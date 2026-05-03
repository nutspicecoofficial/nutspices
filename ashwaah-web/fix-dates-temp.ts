import { db } from "./src/db";
import { users, orders, products } from "./src/db/schema";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Fixing corrupted timestamps...");

  const now = new Date();
  
  // Fix users
  await db.update(users).set({ createdAt: now }).where(sql`created_at > 100000000000000`);
  console.log("Users timestamps fixed.");

  // Fix orders
  await db.update(orders).set({ createdAt: now }).where(sql`created_at > 100000000000000`);
  console.log("Orders timestamps fixed.");

  // Fix products
  await db.update(products).set({ createdAt: now }).where(sql`created_at > 100000000000000`);
  console.log("Products timestamps fixed.");

  console.log("Database repair complete!");
}

main().catch(console.error);
