const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

const columns = [
    { name: 'description', type: 'TEXT' },
    { name: 'mrp', type: 'REAL' },
    { name: 'sale_price', type: 'REAL' },
    { name: 'images', type: 'TEXT' },
    { name: 'avg_rating', type: 'REAL DEFAULT 4.3' },
    { name: 'num_reviews', type: 'INTEGER DEFAULT 1' },
    { name: 'category', type: 'TEXT' },
    { name: 'gender', type: 'TEXT DEFAULT "unisex"' },
    { name: 'is_featured', type: 'INTEGER DEFAULT 0' },
    { name: 'tags', type: 'TEXT' },
    { name: 'colors', type: 'TEXT' },
    { name: 'created_at', type: 'INTEGER DEFAULT (strftime("%s","now"))' }
];

columns.forEach(col => {
    try {
        db.prepare(`ALTER TABLE products ADD COLUMN ${col.name} ${col.type}`).run();
        console.log(`Added ${col.name} column`);
    } catch (e) {
        console.log(`${col.name} column might already exist or error:`, e.message);
    }
});
