import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const phoneNumber = cookieStore.get("auth_session")?.value;

  if (!phoneNumber) {
    return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
  }

  try {
    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.phoneNumber, phoneNumber),
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const orderId = parseInt(id);

    // Fetch order to check current status
    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.userId, user.id)),
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    // Only allow cancellation if order is not shipped yet
    const cancellableStatuses = ["pending", "processing", "confirmed"];
    if (!cancellableStatuses.includes(order.status || "")) {
      return NextResponse.json({ 
        success: false, 
        error: `Cannot cancel order in '${order.status}' status.` 
      }, { status: 400 });
    }

    await db.update(orders)
      .set({ status: "cancelled" })
      .where(and(eq(orders.id, orderId), eq(orders.userId, user.id)));

    return NextResponse.json({ success: true, message: "Order cancelled successfully" });
  } catch (error: any) {
    console.error("Order Cancellation API Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
