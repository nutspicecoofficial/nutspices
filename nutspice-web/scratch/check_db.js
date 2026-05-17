
const Database = require('better-sqlite3');
const db = new Database('.db/sqlite.db');

const products = db.prepare('SELECT * FROM products').all();
console.log('Products in DB:');
console.log(JSON.stringify(products, null, 2));

const nav = db.prepare('SELECT * FROM navigation_menu').all();
console.log('\nNavigation Menu in DB:');
console.log(JSON.stringify(nav, null, 2));

const sections = db.prepare('SELECT * FROM page_sections').all();
console.log('\nPage Sections:');
console.log(JSON.stringify(sections, null, 2));
