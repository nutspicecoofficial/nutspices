import { db } from "./src/db/index";
import { products, productVariations } from "./src/db/schema";
import { sql, eq } from "drizzle-orm";

async function testApiQueryFixJoin() {
  const query = db.select({
    id: products.id,
    name: products.name,
    totalStock: sql<number>`SUM(${productVariations.stock})`.mapWith(Number)
  })
  .from(products)
  .leftJoin(productVariations, eq(products.id, productVariations.productId))
  .groupBy(products.id);

  console.log("Generated SQL:", query.toSQL().sql);
  
  const results = await query;
  console.log("Query Results:");
  console.log(JSON.stringify(results, null, 2));
}

testApiQueryFixJoin();
