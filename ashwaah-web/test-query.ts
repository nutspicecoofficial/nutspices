import { db } from "./src/db/index";
import { products, productVariations } from "./src/db/schema";
import { sql } from "drizzle-orm";

async function testApiQuery() {
  const results = await db.select({
    id: products.id,
    name: products.name,
    totalStock: sql<number>`(SELECT SUM(stock) FROM ${productVariations} WHERE product_id = ${products.id})`.mapWith(Number)
  }).from(products);

  console.log("Query Results:");
  console.log(JSON.stringify(results, null, 2));
}

testApiQuery();
