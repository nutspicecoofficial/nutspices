import Database from "better-sqlite3";
const db = new Database("sqlite.db");

try {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      shipping_address TEXT,
      created_at INTEGER
    )
  `).run();
  
  db.prepare(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      variation_id INTEGER REFERENCES product_variations(id),
      quantity INTEGER NOT NULL DEFAULT 1,
      price REAL NOT NULL,
      size TEXT NOT NULL,
      color TEXT,
      customizations TEXT
    )
  `).run();
  
  console.log("Successfully created orders and order_items tables in SQLite.");
} catch (error: any) {
  console.error("Error creating tables:", error.message);
}
