import { db } from "./src/db";
import { products, productVariations } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function check() {
  const allVariations = await db.select().from(productVariations);
  console.log("--- VARIATIONS ---");
  allVariations.forEach(v => {
    console.log(`ID: ${v.id}, ProductID: ${v.productId}, Size: ${v.size}, Color: ${v.color}, MRP: ${v.mrp}, SalePrice: ${v.salePrice}`);
  });
}

check().catch(console.error);
