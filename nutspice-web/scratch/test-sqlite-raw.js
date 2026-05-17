
const Database = require("better-sqlite3");
console.log("Opening database...");
try {
  const db = new Database(".db/sqlite.db", { verbose: console.log });
  console.log("Database opened.");
  const row = db.prepare("SELECT count(*) as count FROM users").get();
  console.log("User count:", row.count);
  db.close();
  console.log("Database closed.");
} catch (err) {
  console.error("Error:", err);
}
