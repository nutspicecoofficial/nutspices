import Database from "better-sqlite3";
const db = new Database("sqlite.db");

try {
  db.prepare("ALTER TABLE products ADD COLUMN enabled_measurements TEXT").run();
  console.log("Successfully added enabled_measurements column to products table.");
} catch (error: any) {
  if (error.message.includes("duplicate column name")) {
    console.log("Column enabled_measurements already exists.");
  } else {
    console.error("Error adding column:", error.message);
  }
}
