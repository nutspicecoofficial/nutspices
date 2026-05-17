import { db } from "./src/db/index.js";
import { users, orders } from "./src/db/schema.js";

async function main() {
  const allUsers = await db.select().from(users);
  console.log("Users:", allUsers.map(u => ({ id: u.id, phone: u.phoneNumber, name: u.fullName })));

  const allOrders = await db.select().from(orders);
  console.log("Orders count per user:");
  const counts = {};
  allOrders.forEach(o => {
    counts[o.userId] = (counts[o.userId] || 0) + 1;
  });
  console.log(counts);
}

main();
