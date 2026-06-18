import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getNDRList, createNDR } from "@/services/shipping";
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
 * GET /api/shipping/ndr
 * Fetches the active NDR list from the shipping adapter.
 * For each NDR found:
 * 1. Checks and merges the local resolution history from the database (`ndrResolutions`).
 * 2. Syncs the exception status into the local database.
 */
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ndrList = await getNDRList();
    
    // Extract non-null AWB numbers from the NDR list
    const awbNumbers = ndrList.map(item => item.awbNumber).filter(Boolean);
    
    // Batch query the orders table to avoid N+1 database queries
    const matchedOrders = awbNumbers.length > 0
      ? await db.select().from(orders).where(inArray(orders.awbNumber, awbNumbers))
      : [];

    // Map matched orders by AWB number for O(1) lookups
    const orderMap = new Map(matchedOrders.map(o => [o.awbNumber, o]));
    const enrichedList: any[] = [];

    // Dynamically sync and enrich exceptions
    for (const item of ndrList) {
      if (!item.awbNumber) {
        enrichedList.push({
          ...item,
          isLocal: false,
          ndrResolutions: []
        });
        continue;
      }

      const order = orderMap.get(item.awbNumber);
      let ndrResolutions: any[] = [];
      const isLocal = !!order;

      if (order) {
        let currentDetails: any = {};
        if (order.shippingDetails) {
          try {
            currentDetails = JSON.parse(order.shippingDetails);
          } catch {
            currentDetails = { raw: order.shippingDetails };
          }
        }

        // Fetch existing resolutions history
        ndrResolutions = currentDetails.ndrResolutions || [];

        // Only update if it doesn't already have this NDR marked, to minimize DB writes
        if (!currentDetails.isNdr || currentDetails.ndrReason !== item.reason || order.shippingStatus !== "NDR_ACTION_REQUIRED") {
          const updatedDetails = {
            ...currentDetails,
            isNdr: true,
            ndrActive: true,
            ndrReason: item.reason,
            ndrAttempts: item.attempts,
            ndrReportedAt: item.reportedAt || new Date().toISOString()
          };

          await db
            .update(orders)
            .set({
              shippingStatus: "NDR_ACTION_REQUIRED",
              shippingDetails: JSON.stringify(updatedDetails)
            })
            .where(eq(orders.id, order.id));
        }
      }

      enrichedList.push({
        ...item,
        isLocal,
        orderId: order ? order.id : undefined,
        ndrResolutions
      });
    }

    return NextResponse.json({
      success: true,
      data: enrichedList
    });
  } catch (error: any) {
    console.error("GET NDR list API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch NDR list" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/shipping/ndr
 * Submits an NDR resolution request (re-attempt, phone update, address update).
 * Pushes the resolution action into a local history log (`ndrResolutions`) in the DB.
 */
export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { awb, action, action_data, re_attempt_date, remarks } = body;

    if (!awb) {
      return NextResponse.json({ success: false, error: "AWB number is required" }, { status: 400 });
    }
    if (!action) {
      return NextResponse.json({ success: false, error: "Action is required" }, { status: 400 });
    }
    if (!remarks) {
      return NextResponse.json({ success: false, error: "Remarks are required" }, { status: 400 });
    }

    // Call central shipping adapter
    const ndrRes = await createNDR({
      awb,
      action,
      action_data,
      re_attempt_date,
      remarks
    });

    if (!ndrRes || !ndrRes.success) {
      throw new Error("NDR resolution submission returned failure status.");
    }

    // Update local database to clear NDR flag, add resolution log to audit trail, and update status
    const orderRows = await db
      .select()
      .from(orders)
      .where(eq(orders.awbNumber, awb))
      .limit(1);

    if (orderRows.length > 0) {
      const order = orderRows[0];
      let currentDetails: any = {};
      if (order.shippingDetails) {
        try {
          currentDetails = JSON.parse(order.shippingDetails);
        } catch {
          currentDetails = { raw: order.shippingDetails };
        }
      }

      // Append this action to resolution history array
      const resolutions = currentDetails.ndrResolutions || [];
      resolutions.push({
        action: action,
        remarks: remarks,
        submittedAt: new Date().toISOString(),
        action_data: action_data || {}
      });

      // De-activate the active NDR status flags
      const updatedDetails = {
        ...currentDetails,
        isNdr: false,
        ndrActive: false,
        ndrResolutions: resolutions,
        resolvedNdrAction: action,
        resolvedNdrRemarks: remarks,
        resolvedAt: new Date().toISOString(),
        // If address was updated, capture it in shippingDetails history as well
        ...(action === "update-address" && action_data?.address_1 ? { originalAddress: order.shippingAddress } : {})
      };

      const updates: any = {
        shippingStatus: "NDR_RESOLVED",
        shippingDetails: JSON.stringify(updatedDetails)
      };

      // If address was updated, we update the main shipping address on the order as well
      if (action === "update-address" && action_data?.address_1) {
        updates.shippingAddress = action_data.address_1;
      }
      
      // If phone was updated, update customerPhone as well
      if (action === "update-phone" && (action_data?.phone || action_data?.new_phone_number)) {
        updates.shippingDetails = JSON.stringify({
          ...updatedDetails,
          updatedCustomerPhone: action_data.phone || action_data.new_phone_number
        });
      }

      await db
        .update(orders)
        .set(updates)
        .where(eq(orders.id, order.id));
    }

    return NextResponse.json({
      success: true,
      message: ndrRes.message || "NDR resolution instruction submitted successfully."
    });
  } catch (error: any) {
    console.error("POST NDR submit API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit NDR resolution" },
      { status: 500 }
    );
  }
}
