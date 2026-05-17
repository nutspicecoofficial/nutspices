import Database from "better-sqlite3";

const db = new Database(".db/sqlite.db");

try {
  console.log("Dropping avg_rating column...");
  db.prepare("ALTER TABLE products DROP COLUMN avg_rating").run();
  console.log("Dropped avg_rating.");
} catch (e: any) {
  console.error("Failed to drop avg_rating:", e.message);
}

try {
  console.log("Dropping num_reviews column...");
  db.prepare("ALTER TABLE products DROP COLUMN num_reviews").run();
  console.log("Dropped num_reviews.");
} catch (e: any) {
  console.error("Failed to drop num_reviews:", e.message);
}

db.close();
