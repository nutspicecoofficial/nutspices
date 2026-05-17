const sqlite = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Path to your SQLite database
const dbPath = path.join(__dirname, 'sqlite.db');

if (!fs.existsSync(dbPath)) {
  console.error("Database file not found at:", dbPath);
  process.exit(1);
}

const db = new sqlite(dbPath);

const tables = [
  'otp_verifications',
  'order_items',
  'orders',
  'cart_items',
  'product_variations',
  'products',
  'page_sections',
  'navigation_menu',
  'home_category_banners',
  'users'
];

console.log("Starting database cleanup...");

try {
  db.prepare('PRAGMA foreign_keys = OFF').run();
  
  for (const table of tables) {
    try {
      db.prepare(`DELETE FROM ${table}`).run();
      db.prepare(`DELETE FROM sqlite_sequence WHERE name='${table}'`).run();
      console.log(`✓ Cleared table: ${table}`);
    } catch (e) {
      console.log(`! Skipping table ${table} (may not exist or already cleared): ${e.message}`);
    }
  }
  
  db.prepare('PRAGMA foreign_keys = ON').run();
  console.log("\nDatabase cleanup complete. All tables are now empty.");
} catch (error) {
  console.error("Cleanup failed:", error);
} finally {
  db.close();
}
