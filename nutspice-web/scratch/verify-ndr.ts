import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { db } from "../src/db";
import { orders, orderItems } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  console.log("Connecting to LibSQL/Turso database using project configuration...");

  try {
    // 1. Fetch current orders
    const allOrders = await db.select().from(orders);
    console.log(`\nFound ${allOrders.length} orders in database:`);
    console.log(
      allOrders.map(o => ({
        id: o.id,
        status: o.status,
        awb: o.awbNumber,
        shipStatus: o.shippingStatus,
        shippingDetails: o.shippingDetails ? "Parsed JSON" : "Null"
      }))
    );

    // 2. Check if the target NDR AWB "XB5584930291" exists
    const ndrOrder = allOrders.find(o => o.awbNumber === "XB5584930291");
    if (ndrOrder) {
      console.log("\n[✓] Order with active NDR AWB (XB5584930291) already exists:");
      console.log(ndrOrder);
    } else {
      console.log("\n[*] Target NDR AWB does not exist. Seeding a new order in Turso database...");
      
      const insertResult = await db.insert(orders).values({
        totalAmount: 1250.00,
        status: "Shipped",
        shippingAddress: "Flat 302, Green Meadows Apt, Sector 45, Gurgaon, Haryana, 122003",
        paymentMode: "prepaid",
        paymentStatus: "PAID",
        amountPaid: 1250.00,
        orderStatus: "2_PROCESSING",
        shippingStatus: "3_AWB_GENERATED",
        awbNumber: "XB5584930291",
        createdAt: new Date().toISOString()
      }).returning();

      const newOrder = insertResult[0];
      console.log(`[✓] Seeded test order with ID: ${newOrder.id}`);

      // Attempt to seed an order item
      try {
        await db.insert(orderItems).values({
          orderId: newOrder.id,
          productId: 1, // default product fallback
          quantity: 2,
          price: 625.00,
          size: "250g",
          color: "Natural"
        });
        console.log("[✓] Seeded order item for the test order.");
      } catch (itemErr) {
        console.warn("Note: Could not insert order item (perhaps foreign key constraint failed). Order row seeded successfully.");
      }
    }

    console.log("\n[✓] Database inspection and seeding complete!");
  } catch (err: any) {
    console.error("Drizzle verification script failed:", err);
  }
}

run().catch(console.error);
