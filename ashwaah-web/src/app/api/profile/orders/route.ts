import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { cookies } from "next/headers";

export async function GET() {
  try {
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

    const userOrders = await db.select({
      id: orders.id,
      totalAmount: orders.totalAmount,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt));

    // For each order, fetch items
    const ordersWithItems = await Promise.all(userOrders.map(async (order) => {
      const items = await db.select({
        id: orderItems.id,
        productId: orderItems.productId,
        productName: products.name,
        quantity: orderItems.quantity,
        price: orderItems.price,
        size: orderItems.size,
        color: orderItems.color,
        customizations: orderItems.customizations,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id));

      return {
        ...order,
        items: items.map(item => ({
          ...item,
          customizations: item.customizations ? JSON.parse(item.customizations) : null
        }))
      };
    }));

    return NextResponse.json({ success: true, data: ordersWithItems });
  } catch (error: any) {
    console.error("User Orders API Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
