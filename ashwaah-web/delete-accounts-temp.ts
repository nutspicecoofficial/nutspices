import { db } from "./src/db/index";
import { users, cartItems, orders, orderItems } from "./src/db/schema";

async function deleteAllAccounts() {
  console.log("Deleting all accounts and related data...");
  
  // Delete related data first to avoid FK constraints if they are enabled
  await db.delete(orderItems);
  await db.delete(orders);
  await db.delete(cartItems);
  
  // Delete all users
  const result = await db.delete(users);
  
  console.log("All accounts deleted successfully.");
}

deleteAllAccounts().catch(console.error);
