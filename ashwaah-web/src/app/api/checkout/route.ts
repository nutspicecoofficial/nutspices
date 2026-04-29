import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, users } from "@/db/schema";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { items, totalAmount, paymentMethod } = await req.json();
    const cookieStore = await cookies();
    const phoneNumber = cookieStore.get("auth_session")?.value;

    if (!phoneNumber) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.phoneNumber, phoneNumber),
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Create Order
    const [newOrder] = await db.insert(orders).values({
      userId: user.id,
      totalAmount: totalAmount,
      status: "processing", // Initial status after payment
      shippingAddress: "Default Boutique Address", // Simplified for now
      createdAt: new Date(),
    }).returning();

    // Create Order Items
    for (const item of items) {
      await db.insert(orderItems).values({
        orderId: newOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        color: item.color,
        customizations: JSON.stringify(item.customizations),
      });
    }

    return NextResponse.json({ success: true, orderId: newOrder.id });
  } catch (error: any) {
    console.error("Checkout API Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
