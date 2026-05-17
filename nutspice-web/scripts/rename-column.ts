import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function migrate() {
  try {
    await db.run(sql`ALTER TABLE home_tabs RENAME COLUMN description TO link_href`);
    console.log("Renamed description to link_href in home_tabs table.");
  } catch (error) {
    console.error("Migration failed (maybe already renamed?):", error);
  }
}

migrate();
