import Database from "better-sqlite3";

const db = new Database(".db/sqlite.db");

try {
  const info = db.prepare("PRAGMA table_info(products)").all();
  console.log(JSON.stringify(info, null, 2));
} catch (e: any) {
  console.error("Failed to get table info:", e.message);
}

db.close();
