import { db } from "./src/db/index";
import { products, productVariations } from "./src/db/schema";

async function checkData() {
  const allProducts = await db.select().from(products);
  console.log("Products count:", allProducts.length);
  if (allProducts.length > 0) {
    console.log("First Product:", allProducts[0]);
  }

  const allVariations = await db.select().from(productVariations);
  console.log("Variations count:", allVariations.length);
  if (allVariations.length > 0) {
    console.log("First Variation:", allVariations[0]);
  }
}

checkData();
