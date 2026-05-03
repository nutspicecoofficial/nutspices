import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function main() {
  const result = await db.run(sql`SELECT id, created_at FROM users`);
  console.log("Raw values from SQLite:");
  // better-sqlite3 returns rows as an array of objects
  const rows = result.rows || result; // check drizzle output format
  console.log(JSON.stringify(rows, null, 2));
}

main().catch(console.error);
