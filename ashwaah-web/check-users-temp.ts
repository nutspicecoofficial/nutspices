import { db } from "./src/db";
import { users } from "./src/db/schema";

async function main() {
  const allUsers = await db.select().from(users);
  console.log("Users and their timestamps:");
  allUsers.forEach(u => {
    console.log(`- [${u.id}] ${u.fullName} | Phone: ${u.phoneNumber} | CreatedAt: ${u.createdAt} | Type: ${typeof u.createdAt}`);
    if (u.createdAt instanceof Date) {
      console.log(`  Formatted: ${u.createdAt.toISOString()}`);
    }
  });
}

main().catch(console.error);
