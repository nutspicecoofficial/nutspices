import Database from "better-sqlite3";
const db = new Database("sqlite.db");
const info = db.prepare("PRAGMA table_info(product_variations)").all();
console.log(JSON.stringify(info, null, 2));
