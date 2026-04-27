const Database = require('better-sqlite3');
const db = new Database('sqlite.db');
const products = db.prepare("PRAGMA table_info(products);").all();
const productVariations = db.prepare("PRAGMA table_info(product_variations);").all();
console.log("PRODUCTS:", products.map(p => p.name));
console.log("VARIATIONS:", productVariations.map(p => p.name));
