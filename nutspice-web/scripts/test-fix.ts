import { db } from "./src/db/index";
import { products, productVariations } from "./src/db/schema";
import { sql } from "drizzle-orm";

async function testApiQueryFix() {
  const query = db.select({
    id: products.id,
    name: products.name,
    totalStock: sql<number>`(SELECT SUM(stock) FROM ${productVariations} WHERE ${productVariations.productId} = ${products.id})`.mapWith(Number)
  }).from(products);

  console.log("Generated SQL:", query.toSQL().sql);
  
  const results = await query;
  console.log("Query Results:");
  console.log(JSON.stringify(results, null, 2));
}

testApiQueryFix();
