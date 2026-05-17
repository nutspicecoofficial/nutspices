import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('sqlite.db');
if (fs.existsSync(dbPath)) {
  try {
    fs.unlinkSync(dbPath);
    console.log('Database deleted.');
  } catch (e) {
    console.error('Failed to delete database:', e);
  }
} else {
  console.log('Database does not exist.');
}
