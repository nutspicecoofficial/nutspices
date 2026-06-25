import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env first
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Set up mock configuration for testing
process.env.USE_MOCK_SHIPPING = "true";
process.env.CRON_SECRET = "test_secret_for_local_cron_verification";

async function run() {
  console.log("--------------------------------------------------");
  console.log("Running local verification for sync-deliveries Cron Job...");
  console.log("--------------------------------------------------");

  // Dynamically import db modules after environment variables are loaded
  const { db } = await import("../src/db");
  const { orders } = await import("../src/db/schema");
  const { eq } = await import("drizzle-orm");
  const { GET } = await import("../src/app/api/cron/sync-deliveries/route");

  try {
    // 1. Ensure a test order exists with AWB containing "delivered" so mock sync marks it delivered
    const testAwb = "XB-MOCK-DELIVERED-123";
    let testOrder = (await db.select().from(orders).where(eq(orders.awbNumber, testAwb)))[0];

    if (!testOrder) {
      console.log(`[*] Seeding test order with AWB: ${testAwb}`);
      const insertResult = await db.insert(orders).values({
        totalAmount: 950.00,
        status: "Shipped",
        shippingAddress: "Test Address, New Delhi, 110001",
        paymentMode: "prepaid",
        paymentStatus: "PAID",
        amountPaid: 950.00,
        orderStatus: "2_PROCESSING",
        shippingStatus: "3_AWB_GENERATED",
        awbNumber: testAwb,
        shippingDetails: JSON.stringify({ isManualFulfillment: false, mode: "AUTOMATED" }),
        createdAt: new Date().toISOString()
      }).returning();
      testOrder = insertResult[0];
      console.log(`[✓] Created test order ID: ${testOrder.id}`);
    } else {
      console.log(`[✓] Test order already exists (ID: ${testOrder.id}), resetting its status to Shipped/3_AWB_GENERATED...`);
      await db.update(orders)
        .set({
          status: "Shipped",
          shippingStatus: "3_AWB_GENERATED"
        })
        .where(eq(orders.id, testOrder.id));
    }

    // 2. Invoke Cron GET handler with invalid token (should return 401)
    console.log("\n[*] Testing GET with invalid Authorization header...");
    const reqInvalid = new Request("http://localhost/api/cron/sync-deliveries", {
      headers: { authorization: "Bearer invalid_secret" }
    });
    const resInvalid = await GET(reqInvalid);
    console.log(`Response Status: ${resInvalid.status}`);
    const dataInvalid = await resInvalid.json();
    console.log("Response Body:", dataInvalid);

    if (resInvalid.status !== 401) {
      throw new Error(`Expected 401 Unauthorized, but got ${resInvalid.status}`);
    }
    console.log("[✓] Authorization check verified (rejected invalid token).");

    // 3. Invoke Cron GET handler with valid token
    console.log("\n[*] Testing GET with valid Authorization header...");
    const reqValid = new Request("http://localhost/api/cron/sync-deliveries", {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` }
    });
    const resValid = await GET(reqValid);
    console.log(`Response Status: ${resValid.status}`);
    const dataValid = await resValid.json();
    console.log("Response Body:", dataValid);

    if (resValid.status !== 200) {
      throw new Error(`Expected 200 OK, but got ${resValid.status}`);
    }
    console.log("[✓] Successful sync execution verified.");

    // 4. Verify that the order status was updated in database
    const updatedOrder = (await db.select().from(orders).where(eq(orders.id, testOrder.id)))[0];
    console.log("\n[*] Order status after cron job sync:");
    console.log(`- Status: ${updatedOrder.status} (Expected: Delivered)`);
    console.log(`- Shipping Status: ${updatedOrder.shippingStatus} (Expected: DELIVERED)`);

    if (updatedOrder.status === "Delivered" && updatedOrder.shippingStatus === "DELIVERED") {
      console.log("\n[✓] SUCCESS: Database update is verified!");
    } else {
      throw new Error("FAIL: Database fields did not update to Delivered/DELIVERED");
    }

    // 5. Cleanup test order
    console.log("\n[*] Cleaning up: Removing test order from database...");
    await db.delete(orders).where(eq(orders.id, testOrder.id));
    console.log("[✓] Cleanup complete!");

  } catch (err) {
    console.error("\n[X] Cron sync-deliveries verification failed:", err);
    process.exit(1);
  }
}

run().catch(console.error);
