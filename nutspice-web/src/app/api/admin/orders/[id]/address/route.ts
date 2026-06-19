import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { isAdminNumber } from "@/lib/admin";

/**
 * Checks if the caller session is an administrator.
 */
async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  return session ? isAdminNumber(session) : false;
}

/**
 * PATCH /api/admin/orders/[id]/address
 * Updates the shipping address of an order before AWB generation.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const orderId = parseInt(id);

  if (isNaN(orderId)) {
    return NextResponse.json({ success: false, error: "Invalid order ID" }, { status: 400 });
  }

  // 1. Admin authorization check
  if (!await isAdmin()) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, street, city, state, pincode, alternateContact } = body;

    if (!name || !street || !city || !state || !pincode) {
      return NextResponse.json(
        { success: false, error: "Missing required address fields (name, street, city, state, pincode)" },
        { status: 400 }
      );
    }

    // 2. Fetch the order
    const orderRows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!orderRows.length) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }
    const order = orderRows[0];

    // 3. Status Lock Check
    const shStatus = (order.shippingStatus || "").toUpperCase();
    const status = (order.status || "").toUpperCase();
    if (
      shStatus === "3_AWB_GENERATED" ||
      shStatus === "4_PICKUP_REQUESTED" ||
      shStatus === "DELIVERED" ||
      status === "SHIPPED" ||
      status === "DELIVERED" ||
      status === "IN TRANSIT" ||
      status === "OUT FOR DELIVERY" ||
      order.awbNumber
    ) {
      return NextResponse.json(
        { success: false, error: "Cannot edit address after AWB is generated. Cancel the shipment first." },
        { status: 400 }
      );
    }

    // 4. Update shippingAddress text string
    const oldAddress = order.shippingAddress || "";
    const match = oldAddress.match(/Contact:\s*([^,]+)/i);
    const oldContact = match ? match[1].trim() : "";
    const contact = alternateContact || oldContact || "";

    const newAddressStr = `Name: ${name}, Street: ${street}, City: ${city}, State: ${state}, Pincode: ${pincode}, Contact: ${contact}`;

    await db
      .update(orders)
      .set({
        shippingAddress: newAddressStr
      })
      .where(eq(orders.id, orderId));

    // Fetch the updated order row
    const updatedOrderRows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

    return NextResponse.json({
      success: true,
      message: "Order shipping address updated successfully.",
      data: updatedOrderRows[0]
    });

  } catch (error: any) {
    console.error("PATCH admin order address API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
