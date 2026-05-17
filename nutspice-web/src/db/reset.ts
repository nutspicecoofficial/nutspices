import { db } from "./index";
import { sql } from "drizzle-orm";

async function reset() {
  console.log("Resetting database...");
  const tables = ["product_variations", "products", "page_sections", "navigation_menu", "cart_items", "product_customisation_rules", "users"];
  
  for (const table of tables) {
    try {
      await db.run(sql.raw(`DROP TABLE IF EXISTS ${table}`));
    } catch (e) {
      console.log(`Failed to drop ${table}:`, e);
    }
  }
  console.log("Tables dropped.");
}

reset();
