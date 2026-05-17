import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { sql } from 'drizzle-orm';

const sqlite = new Database('sqlite.db');
const db = drizzle(sqlite);

async function main() {
  console.log('Creating home_category_banners table...');
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS home_category_banners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        image_url TEXT NOT NULL,
        link_href TEXT NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1
      )
    `);
    console.log('Table created successfully.');
  } catch (error) {
    console.error('Error creating table:', error);
  } finally {
    sqlite.close();
  }
}

main();
