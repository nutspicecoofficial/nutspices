import Database from "better-sqlite3";
const sqlite = new Database("sqlite.db");

function fixTable(tableName: string) {
  const rows = sqlite.prepare(`SELECT id, created_at FROM ${tableName}`).all();
  console.log(`Fixing ${tableName}...`);
  
  for (const row: any of rows) {
    let newDate;
    if (typeof row.created_at === 'number') {
      // If it's a large number (ms), or small (s)
      const val = row.created_at > 10000000000 ? row.created_at : row.created_at * 1000;
      newDate = new Date(val).toISOString();
    } else {
      newDate = new Date().toISOString();
    }
    
    sqlite.prepare(`UPDATE ${tableName} SET created_at = ? WHERE id = ?`).run(newDate, row.id);
  }
}

try {
  fixTable("users");
  fixTable("orders");
  fixTable("products");
  
  // lastLoginAt for users
  const users = sqlite.prepare("SELECT id, last_login_at FROM users").all();
  for (const u: any of users) {
    if (u.last_login_at) {
      const val = u.last_login_at > 10000000000 ? u.last_login_at : u.last_login_at * 1000;
      sqlite.prepare("UPDATE users SET last_login_at = ? WHERE id = ?").run(new Date(val).toISOString(), u.id);
    }
  }

  console.log("Database repair complete!");
} catch (e) {
  console.error(e);
}
