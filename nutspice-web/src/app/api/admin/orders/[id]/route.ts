import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { isAdminNumber } from "@/lib/admin";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  return session ? isAdminNumber(session) : false;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!await isAdmin()) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { status } = await req.json();
    const orderId = parseInt(id);

    if (!status) {
      return NextResponse.json({ success: false, error: "Status is required" }, { status: 400 });
    }

    await db.update(orders)
      .set({ status })
      .where(eq(orders.id, orderId));

    return NextResponse.json({ success: true, message: "Order status updated successfully" });
  } catch (error: any) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
