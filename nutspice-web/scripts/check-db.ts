import { db } from "../src/db";
import { navigationMenu, pageSections } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const menu = await db.select().from(navigationMenu);
  console.log("Navigation Menu:", JSON.stringify(menu, null, 2));

  const sections = await db.select().from(pageSections);
  console.log("Page Sections:", JSON.stringify(sections, null, 2));
}

main().catch(console.error);
