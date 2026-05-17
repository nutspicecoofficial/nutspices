const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

try {
    db.prepare('ALTER TABLE products ADD COLUMN mrp REAL').run();
    console.log('Added mrp column');
} catch (e) {
    console.log('mrp column might already exist or error:', e.message);
}

try {
    db.prepare('ALTER TABLE products ADD COLUMN sale_price REAL').run();
    console.log('Added sale_price column');
} catch (e) {
    console.log('sale_price column might already exist or error:', e.message);
}

try {
    db.prepare('ALTER TABLE products ADD COLUMN avg_rating REAL DEFAULT 4.3').run();
    console.log('Added avg_rating column');
} catch (e) {
    console.log('avg_rating column might already exist or error:', e.message);
}

try {
    db.prepare('ALTER TABLE products ADD COLUMN num_reviews INTEGER DEFAULT 1').run();
    console.log('Added num_reviews column');
} catch (e) {
    console.log('num_reviews column might already exist or error:', e.message);
}

try {
    db.prepare('ALTER TABLE products ADD COLUMN colors TEXT').run();
    console.log('Added colors column');
} catch (e) {
    console.log('colors column might already exist or error:', e.message);
}

try {
    db.prepare('ALTER TABLE products ADD COLUMN gender TEXT').run();
    console.log('Added gender column');
} catch (e) {
    console.log('gender column might already exist or error:', e.message);
}

try {
    db.prepare('ALTER TABLE products ADD COLUMN tags TEXT').run();
    console.log('Added tags column');
} catch (e) {
    console.log('tags column might already exist or error:', e.message);
}

try {
    db.prepare('ALTER TABLE products ADD COLUMN is_featured INTEGER DEFAULT 0').run();
    console.log('Added is_featured column');
} catch (e) {
    console.log('is_featured column might already exist or error:', e.message);
}
