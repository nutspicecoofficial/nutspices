import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq, inArray, and, isNotNull, or } from "drizzle-orm";
import { trackShipmentXpressbees } from "@/services/shipping/xpressbees.service";
import { trackShipment as mockTrackShipment } from "@/services/shipping/mock.service";

/**
 * GET /api/cron/sync-deliveries
 * Secure cron route to synchronize shipment delivery statuses from XpressBees to the local database.
 */
export async function GET(req: Request) {
  // 1. Security Authorization Check
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Query Active Automated Shipments
    const activeOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          isNotNull(orders.awbNumber),
          or(
            inArray(orders.shippingStatus, [
              "3_AWB_GENERATED",
              "4_PICKUP_REQUESTED",
              "PICKED",
              "IN_TRANSIT",
              "OUT_FOR_DELIVERY"
            ]),
            inArray(orders.status, [
              "Shipped",
              "In Transit",
              "Out for Delivery",
              "SHIPPED",
              "IN_TRANSIT",
              "OUT_FOR_DELIVERY"
            ])
          )
        )
      );

    // Filter to strictly exclude manual fulfillments
    const automatedOrders = activeOrders.filter((order) => {
      if (!order.shippingDetails) return true;
      try {
        const details = typeof order.shippingDetails === "string"
          ? JSON.parse(order.shippingDetails)
          : order.shippingDetails;
        
        return details?.isManualFulfillment !== true && details?.mode !== "MANUAL";
      } catch {
        return true; // Keep order if parsing fails to avoid missing any shipment
      }
    });

    const deliveredIds: number[] = [];
    const updatedDetailsMap: Record<string, { oldStatus: string; newStatus: string }> = {};
    const useMock = process.env.USE_MOCK_SHIPPING === "true";

    // 3. Sync with XpressBees / Mock tracking service
    for (const order of automatedOrders) {
      if (!order.awbNumber) continue;

      try {
        let trackingRes;
        if (useMock) {
          trackingRes = await mockTrackShipment(order.awbNumber);
          // For local testing: if AWB number contains "delivered" case-insensitively, simulate successful delivery
          if (order.awbNumber.toLowerCase().includes("delivered")) {
            trackingRes.status = "Delivered";
          }
        } else {
          trackingRes = await trackShipmentXpressbees(order.awbNumber);
        }

        const status = trackingRes.status?.toLowerCase() || "";
        const rawStatus = (trackingRes.trackingData as any)?.current_status?.toLowerCase() || "";

        if (status === "delivered" || rawStatus === "delivered") {
          deliveredIds.push(order.id);
          updatedDetailsMap[order.awbNumber] = {
            oldStatus: order.status || "Shipped",
            newStatus: "Delivered"
          };
        }
      } catch (err) {
        console.error(`Error tracking AWB ${order.awbNumber} for order ID ${order.id}:`, err);
      }
    }

    // 4. Batch Update Local Database
    if (deliveredIds.length > 0) {
      await db
        .update(orders)
        .set({
          status: "Delivered",
          shippingStatus: "DELIVERED"
        })
        .where(inArray(orders.id, deliveredIds));
    }

    return NextResponse.json({
      success: true,
      syncedCount: automatedOrders.length,
      updatedToDelivered: deliveredIds.length,
      data: updatedDetailsMap
    });

  } catch (error: any) {
    console.error("Cron sync-deliveries execution error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
