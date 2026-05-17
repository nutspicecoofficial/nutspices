import Database from "better-sqlite3";
const sqlite = new Database("sqlite.db");

const tables = [
  "users",
  "otp_verifications",
  "products",
  "product_variations",
  "product_customisation_rules",
  "cart_items",
  "navigation_menu",
  "page_sections",
  "orders",
  "order_items",
  "home_category_banners"
];

console.log("Clearing database tables...");

sqlite.transaction(() => {
  for (const table of tables) {
    try {
      sqlite.prepare(`DELETE FROM ${table}`).run();
      console.log(`✓ Cleared ${table}`);
    } catch (err) {
      console.warn(`! Could not clear ${table}: ${err.message}`);
    }
  }
})();

console.log("Database cleared successfully.");
sqlite.close();
