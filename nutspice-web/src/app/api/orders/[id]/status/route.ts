/**
 * Next.js App Router API Route for Managing Order/Shipping Status Transitions.
 * Endpoint: PATCH /api/orders/[id]/status
 * Enforces admin authorization, handles cancellations, schedules AWB generation,
 * requests pickups, and updates database state machine columns.
 */

import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { generateShipment, requestPickup, cancelShipment } from "@/services/shipping";

import { isAdminNumber } from "@/lib/admin";

/**
 * Checks if the caller session is an administrator.
 */
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
    const { orderStatus, shippingStatus, packageDetails, cancelReason, cancelShipmentOnly } = body;

    // Fetch the current order row from SQLite
    const orderRows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!orderRows.length) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }
    const order = orderRows[0];

    // Check if we are doing a cancelShipmentOnly request
    if (cancelShipmentOnly) {
      if (!order.awbNumber) {
        return NextResponse.json({ success: false, error: "No active shipment found to cancel." }, { status: 400 });
      }

      // 1. Build the updated shipping details log
      let currentDetails: any = {};
      if (order.shippingDetails) {
        try {
          currentDetails = typeof order.shippingDetails === "string"
            ? JSON.parse(order.shippingDetails)
            : order.shippingDetails;
        } catch {
          currentDetails = { raw: order.shippingDetails };
        }
      }

      // 2. Call Xpressbees API if not manual. Let errors bubble up to reject state updates
      if (currentDetails?.mode !== "MANUAL" && currentDetails?.isManualFulfillment !== true) {
        await cancelShipment(order.awbNumber);
      }

      const cancelledHistory = [...(currentDetails.cancelledAwbs || [])];
      cancelledHistory.push({
        awbNumber: order.awbNumber,
        labelUrl: currentDetails.labelUrl || currentDetails.label || "",
        manifestUrl: currentDetails.manifestUrl || "",
        cancelledAt: new Date().toISOString()
      });

      const updatedDetails = {
        ...currentDetails,
        awbNumber: null,
        labelUrl: null,
        label: null,
        manifestUrl: null,
        pickupToken: null,
        scheduledDate: null,
        pickupRequestedAt: null,
        isNdr: false,
        ndrActive: false,
        cancelledAwbs: cancelledHistory
      };

      // 3. Update the SQLite database
      await db
        .update(orders)
        .set({
          orderStatus: "2_PROCESSING",
          shippingStatus: "PENDING",
          awbNumber: null,
          shippingDetails: JSON.stringify(updatedDetails)
        })
        .where(eq(orders.id, orderId));

      return NextResponse.json({
        success: true,
        message: "Shipment cancelled and order reverted to Processing successfully.",
        data: {
          orderStatus: "2_PROCESSING",
          shippingStatus: "PENDING",
          awbNumber: null
        }
      });
    }

    // Maintain object of all fields to update in the DB
    const updates: Partial<typeof orders.$inferSelect> = {};

    // 2. Handle Cancellations
    if (orderStatus === "CANCELLED") {
      updates.orderStatus = "CANCELLED";
      updates.status = "Cancelled"; // Dynamic inventory checks count active statuses, so this restores virtual stock
      updates.cancelReason = cancelReason || "Cancelled by administrator";
      
      // If AWB was already booked, request cancellation from courier
      if (order.awbNumber) {
        try {
          let currentDetails: any = {};
          if (order.shippingDetails) {
            try {
              currentDetails = typeof order.shippingDetails === "string"
                ? JSON.parse(order.shippingDetails)
                : order.shippingDetails;
            } catch {
              currentDetails = {};
            }
          }
          if (currentDetails?.mode !== "MANUAL" && currentDetails?.isManualFulfillment !== true) {
            await cancelShipment(order.awbNumber);
          }
          updates.shippingStatus = "SHIPMENT_CANCELLED";
        } catch (shipmentCancelErr: any) {
          console.error("Warning: Failed to cancel courier shipment during cancellation transition:", shipmentCancelErr);
          // Keep local order cancelled status intact even if courier cancellation warns/fails
        }
      }
    } else if (orderStatus) {
      // General order status mapping
      updates.orderStatus = orderStatus;
      if (orderStatus === "0_PLACED") {
        updates.status = "Order Placed";
      } else if (orderStatus === "1_CONFIRMED") {
        updates.status = "Processing";
      } else if (orderStatus === "2_PROCESSING") {
        updates.status = "Processing";
      }
    }

    // 3. Trigger AWB Booking (3_AWB_GENERATED)
    if (shippingStatus === "3_AWB_GENERATED") {
      // Verify AWB number is currently null
      if (order.awbNumber) {
        return NextResponse.json(
          { success: false, error: "AWB number has already been allocated to this order." },
          { status: 400 }
        );
      }

      const isManual = packageDetails?.mode === "MANUAL" || body.mode === "MANUAL";
      const manualDetails = packageDetails?.manualDetails || body.manualDetails;

      if (isManual) {
        if (!manualDetails || !manualDetails.courierName || !manualDetails.awbNumber) {
          return NextResponse.json(
            { success: false, error: "Manual courier name and AWB number are required." },
            { status: 400 }
          );
        }

        let currentDetails: any = {};
        if (order.shippingDetails) {
          try {
            currentDetails = typeof order.shippingDetails === "string"
              ? JSON.parse(order.shippingDetails)
              : order.shippingDetails;
          } catch {
            currentDetails = { raw: order.shippingDetails };
          }
        }

        const mergedDetails = {
          ...currentDetails,
          isManualFulfillment: true,
          mode: "MANUAL",
          courierName: manualDetails.courierName,
          awbNumber: manualDetails.awbNumber,
          trackingUrl: manualDetails.trackingUrl || "",
          courierContact: manualDetails.courierContact || "",
          generatedAt: new Date().toISOString(),
          invoiceNumber: packageDetails?.invoiceNumber || body.invoiceNumber || null,
          invoiceDate: packageDetails?.invoiceDate || body.invoiceDate || null
        };

        updates.awbNumber = manualDetails.awbNumber;
        updates.shippingStatus = "3_AWB_GENERATED";
        updates.status = "Shipped";
        updates.shippingDetails = JSON.stringify(mergedDetails);
      } else {
        // Fetch order items and join products to get correct names
        const items = await db
          .select({
            id: orderItems.id,
            productId: orderItems.productId,
            quantity: orderItems.quantity,
            price: orderItems.price,
            size: orderItems.size,
            color: orderItems.color,
            customizations: orderItems.customizations,
            productName: products.name
          })
          .from(orderItems)
          .leftJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, orderId));

        // Call shipping adapter (which routes to Xpressbees when mock mode is disabled)
        const shipmentRes = await generateShipment({
          order,
          items,
          packageDetails
        });

        if (!shipmentRes || !shipmentRes.success || !shipmentRes.awbNumber) {
          throw new Error("Shipment generation adapter returned failure status.");
        }

        let currentDetails: any = {};
        if (order.shippingDetails) {
          try {
            currentDetails = typeof order.shippingDetails === "string"
              ? JSON.parse(order.shippingDetails)
              : order.shippingDetails;
          } catch {
            currentDetails = { raw: order.shippingDetails };
          }
        }

        const mergedDetails = {
          ...currentDetails,
          courierName: shipmentRes.courierName || "Xpressbees",
          labelUrl: shipmentRes.labelUrl || "",
          estimatedDelivery: shipmentRes.estimatedDelivery || "",
          generatedAt: new Date().toISOString(),
          weight: packageDetails?.weight || null,
          length: packageDetails?.length || null,
          breadth: packageDetails?.breadth !== undefined ? packageDetails.breadth : (packageDetails?.width !== undefined ? packageDetails.width : null),
          height: packageDetails?.height || null,
          invoiceNumber: packageDetails?.invoiceNumber || null,
          invoiceDate: packageDetails?.invoiceDate || null,
          courierId: packageDetails?.courierId || null
        };

        updates.awbNumber = shipmentRes.awbNumber;
        updates.shippingStatus = "3_AWB_GENERATED";
        updates.status = "Shipped";
        updates.shippingDetails = JSON.stringify(mergedDetails);
      }
    } 
    // 4. Trigger Pickup Booking (4_PICKUP_REQUESTED)
    else if (shippingStatus === "4_PICKUP_REQUESTED") {
      const activeAwb = updates.awbNumber || order.awbNumber;
      if (!activeAwb) {
        return NextResponse.json(
          { success: false, error: "Cannot request pickup: AWB number is missing." },
          { status: 400 }
        );
      }

      // Parse current shipping details to merge pickup token/date details
      let currentDetails: any = {};
      const targetDetails = updates.shippingDetails || order.shippingDetails;
      if (targetDetails) {
        try {
          currentDetails = typeof targetDetails === "string" ? JSON.parse(targetDetails) : targetDetails;
        } catch {
          currentDetails = { raw: targetDetails };
        }
      }

      if (currentDetails?.mode === "MANUAL" || currentDetails?.isManualFulfillment === true) {
        updates.shippingStatus = "4_PICKUP_REQUESTED";
        updates.status = "Shipped";
        updates.shippingDetails = JSON.stringify({
          ...currentDetails,
          pickupToken: "MANUAL_PICKUP",
          scheduledDate: new Date().toISOString().split("T")[0],
          pickupMessage: "Manual pickup handled locally.",
          pickupRequestedAt: new Date().toISOString()
        });
      } else {
        // Call requestPickup adapter
        const pickupRes = await requestPickup({
          awbNumber: activeAwb
        });

        if (!pickupRes || !pickupRes.success) {
          throw new Error("Courier scheduling pickup request returned failure status.");
        }

        updates.shippingStatus = "4_PICKUP_REQUESTED";
        updates.status = "Shipped";

        updates.shippingDetails = JSON.stringify({
          ...currentDetails,
          pickupToken: pickupRes.pickupToken,
          scheduledDate: pickupRes.scheduledDate,
          pickupMessage: pickupRes.message,
          manifestUrl: pickupRes.manifestUrl || currentDetails.manifestUrl || "",
          pickupRequestedAt: new Date().toISOString()
        });
      }
    } 
    // Standard shippingStatus updates mapping to general status
    else if (shippingStatus) {
      updates.shippingStatus = shippingStatus;
      if (shippingStatus === "PENDING") {
        updates.awbNumber = null;
        let currentDetails: any = {};
        if (order.shippingDetails) {
          try {
            currentDetails = typeof order.shippingDetails === "string"
              ? JSON.parse(order.shippingDetails)
              : order.shippingDetails;
          } catch {
            currentDetails = null;
          }
        }
        if (currentDetails && Array.isArray(currentDetails.cancelledAwbs)) {
          updates.shippingDetails = JSON.stringify({
            cancelledAwbs: currentDetails.cancelledAwbs
          });
        } else {
          updates.shippingDetails = null;
        }

        if (order.awbNumber && currentDetails?.mode !== "MANUAL" && currentDetails?.isManualFulfillment !== true) {
          try {
            await cancelShipment(order.awbNumber);
          } catch (shipmentCancelErr: any) {
            console.error("Warning: Failed to cancel courier shipment during downgrade to PENDING:", shipmentCancelErr);
          }
        }
      } else if (shippingStatus === "PICKED") {
        updates.status = "In Transit";
      } else if (shippingStatus === "IN_TRANSIT") {
        updates.status = "In Transit";
      } else if (shippingStatus === "OUT_FOR_DELIVERY") {
        updates.status = "Out for Delivery";
      } else if (shippingStatus === "DELIVERED") {
        updates.status = "Delivered";
      } else if (shippingStatus === "SHIPMENT_CANCELLED") {
        updates.status = "Cancelled";
      }
    }

    // 5. Database Persistence
    if (Object.keys(updates).length > 0) {
      await db.update(orders).set(updates).where(eq(orders.id, orderId));
    }

    return NextResponse.json({
      success: true,
      message: "Order status transitioned successfully.",
      data: updates
    });

  } catch (error: any) {
    console.error("PATCH status API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
