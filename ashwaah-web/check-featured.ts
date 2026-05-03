import { db } from "./src/db";
import { products } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function check() {
  const allProducts = await db.select().from(products);
  console.log("Total products:", allProducts.length);
  
  const featured = await db.select().from(products).where(eq(products.isFeatured, true));
  console.log("Featured products:", featured.length);
  
  if (allProducts.length > 0 && featured.length === 0) {
    console.log("Setting first 4 products as featured...");
    for (let i = 0; i < Math.min(4, allProducts.length); i++) {
      await db.update(products).set({ isFeatured: true }).where(eq(products.id, allProducts[i].id));
    }
    console.log("Done. Featured products should now show up.");
  }
}

check().catch(console.error);
