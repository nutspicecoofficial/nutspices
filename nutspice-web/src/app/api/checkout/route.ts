import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, users } from "@/db/schema";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { 
      items, 
      totalAmount, 
      paymentMethod, 
      shippingAddress,
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

    // Create Order
    const [newOrder] = await db.insert(orders).values({
      userId: user.id,
      totalAmount: totalAmount,
      status: "Order Placed", // Status after successful payment
      shippingAddress: shippingAddress,
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      createdAt: new Date().toISOString(),
    }).returning();

    // Create Order Items
    for (const item of items) {
      await db.insert(orderItems).values({
        orderId: newOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        customizations: item.customizations ? JSON.stringify(item.customizations) : null,
      });
    }

    return NextResponse.json({ success: true, orderId: newOrder.id });
  } catch (error: any) {
    console.error("Checkout API Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
