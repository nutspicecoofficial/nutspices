import { db } from "./src/db";
import { products, navigationMenu, pageSections } from "./src/db/schema";

async function main() {
  const allProducts = await db.select().from(products);
  console.log("Total Products:", allProducts.length);
  allProducts.forEach(p => {
    console.log(`- [${p.id}] ${p.name} (${p.category})`);
  });

  const menu = await db.select().from(navigationMenu);
  console.log("\nNavigation Menu:");
  menu.forEach(m => {
    console.log(`- [${m.id}] ${m.label} (${m.href})`);
  });

  const sections = await db.select().from(pageSections);
  console.log("\nPage Sections:");
  sections.forEach(s => {
    console.log(`- [${s.id}] ${s.title} (Menu ID: ${s.menuId})`);
  });
}

main().catch(console.error);
