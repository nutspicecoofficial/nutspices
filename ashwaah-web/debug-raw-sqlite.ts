import Database from "better-sqlite3";
const sqlite = new Database("sqlite.db");

const users = sqlite.prepare("SELECT id, full_name, created_at FROM users").all();
console.log("Raw Users:", JSON.stringify(users, null, 2));

const orders = sqlite.prepare("SELECT id, created_at FROM orders").all();
console.log("Raw Orders:", JSON.stringify(orders, null, 2));
