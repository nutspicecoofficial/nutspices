import { db } from "./index";
import { sql } from "drizzle-orm";

async function setup() {
  console.log("Setting up database schema manually...");
  
  const queries = [
    `CREATE TABLE IF NOT EXISTS "users" (
      "id" integer PRIMARY KEY AUTOINCREMENT,
      "phone_number" text NOT NULL UNIQUE,
      "full_name" text,
      "role" text DEFAULT 'user',
      "created_at" integer DEFAULT (strftime('%s', 'now'))
    )`,
    `CREATE TABLE IF NOT EXISTS "products" (
      "id" integer PRIMARY KEY AUTOINCREMENT,
      "name" text NOT NULL,
      "description" text,
      "mrp" real,
      "sale_price" real,
      "avg_rating" real DEFAULT 4.3,
      "num_reviews" integer DEFAULT 1,
      "images" text,
      "colors" text,
      "gender" text,
      "category" text,
      "tags" text,
      "is_featured" integer DEFAULT 0,
      "created_at" integer DEFAULT (strftime('%s', 'now'))
    )`,
    `CREATE TABLE IF NOT EXISTS "product_variations" (
      "id" integer PRIMARY KEY AUTOINCREMENT,
      "product_id" integer REFERENCES "products"("id") ON DELETE CASCADE,
      "size" text NOT NULL,
      "color" text,
      "stock" integer NOT NULL DEFAULT 0,
      "sku" text
    )`,
    `CREATE TABLE IF NOT EXISTS "navigation_menu" (
      "id" integer PRIMARY KEY AUTOINCREMENT,
      "label" text NOT NULL,
      "href" text NOT NULL,
      "order" integer NOT NULL DEFAULT 0,
      "is_active" integer NOT NULL DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS "page_sections" (
      "id" integer PRIMARY KEY AUTOINCREMENT,
      "menu_id" integer NOT NULL REFERENCES "navigation_menu"("id") ON DELETE CASCADE,
      "title" text NOT NULL,
      "product_ids" text NOT NULL,
      "display_order" integer NOT NULL DEFAULT 0
    )`
  ];

  for (const q of queries) {
    try {
      await db.run(sql.raw(q));
    } catch (e) {
      console.error("Failed query:", q);
      console.error(e);
    }
  }
  
  console.log("Schema setup complete.");
}

setup();
