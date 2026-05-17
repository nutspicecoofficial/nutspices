
import { db } from "./src/db/index";
import { users, products, orders } from "./src/db/schema";

async function test() {
  try {
    const userCount = await db.select().from(users);
    console.log("Users:", userCount.length);
    const productCount = await db.select().from(products);
    console.log("Products:", productCount.length);
    const orderCount = await db.select().from(orders);
    console.log("Orders:", orderCount.length);
  } catch (err) {
    console.error("DB Test Error:", err);
  }
}

test();
