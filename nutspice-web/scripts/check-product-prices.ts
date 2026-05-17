import { db } from "./src/db";
import { products } from "./src/db/schema";

async function check() {
  const allProducts = await db.select().from(products);
  console.log("--- PRODUCTS ---");
  allProducts.forEach(p => {
    console.log(`ID: ${p.id}, Name: ${p.name}, BasePrice: ${p.basePrice}, SalePrice: ${p.salePrice}`);
  });
}

check().catch(console.error);
