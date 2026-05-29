/**
 * Verification & Database Seeding script for NDR testing.
 * Sets up a test order with an active NDR AWB (XB5584930291)
 * so we can verify the sync and resolution flows.
 */

const { drizzle } = require("drizzle-orm/better-sqlite3");
const Database = require("better-sqlite3");
const path = require("path");

// Locate local SQLite DB file. Next.js typically stores it as sqlite.db in root.
const dbPath = path.resolve(process.cwd(), "sqlite.db");
console.log("Connecting to SQLite database at:", dbPath);

const sqlite = new Database(dbPath);

async function run() {
  try {
    // 1. Get existing orders
    const orders = sqlite.prepare("SELECT id, status, awb_number, shipping_status, shipping_details FROM orders").all();
    console.log(`\nFound ${orders.length} orders in database:`);
    console.log(orders.map(o => ({ id: o.id, status: o.status, awb: o.awb_number, shipStatus: o.shipping_status })));

    // 2. Check if the target NDR AWB "XB5584930291" exists
    const ndrOrder = orders.find(o => o.awb_number === "XB5584930291");
    if (ndrOrder) {
      console.log("\n[✓] Order with active NDR AWB (XB5584930291) already exists:");
      console.log(ndrOrder);
    } else {
      console.log("\n[*] Target NDR AWB does not exist. Creating a seed order for testing...");
      
      // We will insert a dummy order
      const insertOrder = sqlite.prepare(`
        INSERT INTO orders (
          total_amount, status, shipping_address, payment_mode, payment_status, 
          amount_paid, order_status, shipping_status, awb_number, created_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `);
      
      const res = insertOrder.run(
        1250.00,
        "Shipped",
        "Flat 302, Green Meadows Apt, Sector 45, Gurgaon, Haryana, 122003",
        "prepaid",
        "PAID",
        1250.00,
        "2_PROCESSING",
        "3_AWB_GENERATED",
        "XB5584930291",
        new Date().toISOString()
      );

      const newId = res.lastInsertRowid;
      console.log(`[✓] Created test order with ID: ${newId}`);

      // Seed an order item for completeness
      sqlite.prepare(`
        INSERT INTO order_items (
          order_id, product_id, quantity, price, size, color
        ) VALUES (
          ?, ?, ?, ?, ?, ?
        )
      `).run(newId, 1, 2, 625.00, "250g", "Natural");
      
      console.log("[✓] Created order item for the test order.");
    }

    console.log("\n[✓] Database is ready for NDR dashboard & alert verification!");
  } catch (err) {
    console.error("Verification script failed:", err);
  } finally {
    sqlite.close();
  }
}

run();
