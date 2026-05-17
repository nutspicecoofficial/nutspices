import { db } from "./src/db";
import { products, productVariations } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function heal() {
  const allProducts = await db.select().from(products);
  console.log("Healing variations...");
  
  for (const p of allProducts) {
    console.log(`Updating variations for product ${p.id} (${p.name})...`);
    await db.update(productVariations)
      .set({ mrp: p.basePrice })
      .where(eq(productVariations.productId, p.id))
      .run();
  }
  
  console.log("Healing complete.");
}

heal().catch(console.error);
