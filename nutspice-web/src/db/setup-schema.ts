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
      "address" text,
      "created_at" text DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS "otp_verifications" (
      "id" integer PRIMARY KEY AUTOINCREMENT,
      "phone_number" text NOT NULL,
      "otp" text NOT NULL,
      "expires_at" text NOT NULL,
      "created_at" text DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS "products" (
      "id" integer PRIMARY KEY AUTOINCREMENT,
      "name" text NOT NULL,
      "description" text,
      "base_price" real NOT NULL,
      "sale_price" real,
      "images" text,
      "category" text,
      "tags" text,
      "is_featured" integer DEFAULT 0,
      "created_at" text DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS "product_variations" (
      "id" integer PRIMARY KEY AUTOINCREMENT,
      "product_id" integer REFERENCES "products"("id") ON DELETE CASCADE,
      "size" text NOT NULL,
      "stock" integer NOT NULL DEFAULT 0,
      "sku" text,
      "mrp" real,
      "sale_price" real
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
    )`,
    `CREATE TABLE IF NOT EXISTS "orders" (
      "id" integer PRIMARY KEY AUTOINCREMENT,
      "user_id" integer REFERENCES "users"("id"),
      "total_amount" real NOT NULL,
      "status" text DEFAULT 'pending',
      "shipping_address" text,
      "created_at" text DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS "order_items" (
      "id" integer PRIMARY KEY AUTOINCREMENT,
      "order_id" integer REFERENCES "orders"("id") ON DELETE CASCADE,
      "product_id" integer REFERENCES "products"("id"),
      "variation_id" integer REFERENCES "product_variations"("id"),
      "quantity" integer NOT NULL DEFAULT 1,
      "price" real NOT NULL,
      "size" text NOT NULL,
      "color" text,
      "customizations" text
    )`,
    `CREATE TABLE IF NOT EXISTS "cart_items" (
      "id" integer PRIMARY KEY AUTOINCREMENT,
      "user_id" integer REFERENCES "users"("id"),
      "product_id" integer REFERENCES "products"("id"),
      "variation_id" integer REFERENCES "product_variations"("id"),
      "quantity" integer NOT NULL DEFAULT 1,
      "price" real NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "home_category_banners" (
      "id" integer PRIMARY KEY AUTOINCREMENT,
      "title" text NOT NULL,
      "image_url" text NOT NULL,
      "link_href" text NOT NULL,
      "display_order" integer NOT NULL DEFAULT 0,
      "is_active" integer NOT NULL DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS "home_tabs" (
      "id" integer PRIMARY KEY AUTOINCREMENT,
      "title" text NOT NULL,
      "link_href" text,
      "image_url" text,
      "display_order" integer NOT NULL DEFAULT 0,
      "is_active" integer NOT NULL DEFAULT 1
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
