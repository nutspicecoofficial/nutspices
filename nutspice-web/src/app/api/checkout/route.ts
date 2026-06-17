import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, users, productVariations } from "@/db/schema";
import { cookies } from "next/headers";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import Razorpay from "razorpay";

class OutOfStockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OutOfStockError';
  }
}

export async function POST(req: Request) {
  try {
    const { 
      items, 
      totalAmount, 
      paymentMethod, 
      shippingAddress,
      shippingDetails,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature 
    } = await req.json();

    const cookieStore = await cookies();
    const phoneNumber = cookieStore.get("auth_session")?.value;

    if (!phoneNumber) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    // Verify Razorpay Signature
    if (paymentMethod === "online_prepaid") {
      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return NextResponse.json({ success: false, error: "Payment details missing" }, { status: 400 });
      }

      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 400 });
      }
    }

    // Find user
    const userRows = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber)).limit(1);
    if (!userRows.length) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }
    const user = userRows[0];

    // Append new address to user's saved addresses
    if (shippingAddress) {
      let addresses: string[] = [];
      if (user.address) {
        try {
          addresses = JSON.parse(user.address);
          if (!Array.isArray(addresses)) addresses = [user.address];
        } catch {
          addresses = [user.address];
        }
      }
      if (!addresses.includes(shippingAddress)) {
        addresses.push(shippingAddress);
        await db.update(users)
          .set({ address: JSON.stringify(addresses) })
          .where(eq(users.id, user.id));
      }
    }

    // --------------------------------------------------------
    // Stock Validation & Order Creation inside a DB Transaction
    // --------------------------------------------------------
    try {
      const orderId = await db.transaction(async (tx) => {
        // 1. Strict Stock Validation
        for (const item of items) {
          // Find base stock for this product variation
          const variationRows = await tx.select().from(productVariations)
            .where(and(eq(productVariations.productId, item.productId), eq(productVariations.size, item.size)))
            .limit(1);
            
          if (!variationRows.length) {
            throw new OutOfStockError(`Product variation not found for product ID ${item.productId} size ${item.size}`);
          }
          const v = variationRows[0];
          
          // Calculate consumed stock from past orders
          const pastOrderItems = await tx.select({
            quantity: orderItems.quantity,
            status: orders.status
          }).from(orderItems)
            .leftJoin(orders, eq(orderItems.orderId, orders.id))
            .where(and(
              eq(orderItems.productId, item.productId),
              eq(orderItems.size, item.size)
            ));
            
          const totalConsumed = pastOrderItems
            .filter(oi => oi.status && ["order placed", "processing", "shipped", "in transit", "out for delivery", "delivered"].includes(oi.status.toLowerCase()))
            .reduce((sum, oi) => sum + (oi.quantity || 0), 0);
            
          const remaining = Math.max(0, v.stock - totalConsumed);
          
          if (remaining < item.quantity) {
            throw new OutOfStockError(`Insufficient stock. Only ${remaining} left for this item.`);
          }
        }

        const isPrepaid = paymentMethod === "online_prepaid";

        // 2. Create Order
        const [newOrder] = await tx.insert(orders).values({
          userId: user.id,
          totalAmount: totalAmount,
          status: "Order Placed", 
          shippingAddress: shippingAddress,
          shippingDetails: shippingDetails,
          paymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          paymentMode: isPrepaid ? "Prepaid" : null,
          paymentStatus: isPrepaid ? "PAID" : null,
          amountPaid: isPrepaid ? totalAmount : null,
          razorpayPaymentId: isPrepaid ? razorpay_payment_id : null,
          createdAt: new Date().toISOString(),
        }).returning();

        // 3. Create Order Items
        for (const item of items) {
          await tx.insert(orderItems).values({
            orderId: newOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            size: item.size,
            customizations: item.customizations ? JSON.stringify(item.customizations) : null,
          });
        }

        return newOrder.id;
      });

      return NextResponse.json({ success: true, orderId });

    } catch (transactionError: any) {
      if (transactionError instanceof OutOfStockError || transactionError.name === 'OutOfStockError') {
        // Automatic Refund Logic if paid online
        if (paymentMethod === "online_prepaid" && razorpay_payment_id) {
          const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
          });

          try {
            await razorpay.payments.refund(razorpay_payment_id, {
              amount: Math.round(totalAmount * 100),
              notes: { reason: "Out of stock race condition - auto refund" }
            });
            
            return NextResponse.json({ 
              success: false, 
              error: "Some items went out of stock just as you were paying. Your payment has been automatically refunded.",
              refundInitiated: true 
            }, { status: 400 });
            
          } catch (refundError) {
            console.error("Razorpay Auto-Refund failed:", refundError);
            return NextResponse.json({ 
              success: false, 
              error: "Items went out of stock, but the automatic refund failed. Please contact support.",
              refundInitiated: false 
            }, { status: 500 });
          }
        }
        
        // Not online prepaid (e.g., COD), or no payment ID yet
        return NextResponse.json({ success: false, error: transactionError.message }, { status: 400 });
      }
      
      throw transactionError; // Re-throw to outer catch block if it's a generic DB error
    }

  } catch (error: any) {
    console.error("Checkout API Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
