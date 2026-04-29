import { db } from "./src/db/index";
import { products, productVariations } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function checkAllData() {
  const allProducts = await db.select().from(products);
  console.log("--- PRODUCTS ---");
  for (const p of allProducts) {
    const variations = await db.select().from(productVariations).where(eq(productVariations.productId, p.id));
    const totalStock = variations.reduce((sum, v) => sum + (v.stock || 0), 0);
    console.log(`ID: ${p.id}, Name: ${p.name}, Total Stock: ${totalStock}`);
    variations.forEach(v => {
      console.log(`  Variation ID: ${v.id}, Size: ${v.size}, Color: ${v.color}, Stock: ${v.stock}`);
    });
  }
}

checkAllData();
