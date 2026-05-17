import Database from "better-sqlite3";
const db = new Database("sqlite.db");
const rows = db.prepare("SELECT * FROM product_variations").all();
console.log(JSON.stringify(rows, null, 2));
