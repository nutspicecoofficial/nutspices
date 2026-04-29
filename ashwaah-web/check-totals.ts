import Database from "better-sqlite3";
const db = new Database("sqlite.db");
const rows = db.prepare("SELECT product_id, SUM(stock) as total FROM product_variations GROUP BY product_id").all();
console.log(JSON.stringify(rows, null, 2));

const all = db.prepare("SELECT * FROM product_variations").all();
console.log("All rows count:", all.length);
