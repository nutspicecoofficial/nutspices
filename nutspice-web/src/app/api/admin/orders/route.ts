import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { cookies } from "next/headers";
import { isAdminNumber } from "@/lib/admin";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  return session ? isAdminNumber(session) : false;
}

export async function GET() {
  if (!await isAdmin()) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allOrders = await db.select({
      id: orders.id,
      totalAmount: orders.totalAmount,
      status: orders.status,
      createdAt: orders.createdAt,
      shippingAddress: orders.shippingAddress,
      customerName: users.fullName,
      customerPhone: users.phoneNumber,
      paymentMode: orders.paymentMode,
      paymentStatus: orders.paymentStatus,
      amountPaid: orders.amountPaid,
      razorpayOrderId: orders.razorpayOrderId,
      razorpayPaymentId: orders.razorpayPaymentId,
      paymentId: orders.paymentId,
      orderStatus: orders.orderStatus,
      shippingStatus: orders.shippingStatus,
      awbNumber: orders.awbNumber,
      shippingDetails: orders.shippingDetails,
      cancelReason: orders.cancelReason,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .orderBy(desc(orders.createdAt));

    // For each order, fetch items
    const ordersWithItems = await Promise.all(allOrders.map(async (order) => {
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
    console.error("Error fetching admin orders:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
