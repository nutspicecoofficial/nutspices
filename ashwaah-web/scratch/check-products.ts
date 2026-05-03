import Database from "better-sqlite3";
const sqlite = new Database("sqlite.db");

const products = sqlite.prepare("SELECT id, name, images FROM products").all();
console.log("Raw Products:", JSON.stringify(products, null, 2));
