import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function migrate() {
  console.log("Starting manual migration...");
  try {
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS home_tabs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        display_order INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1
      )
    `);
    console.log("Table home_tabs created or already exists.");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

migrate();
