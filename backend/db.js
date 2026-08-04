const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'app_data.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Bảng người dùng
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      telegram_id INTEGER PRIMARY KEY,
      first_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Bảng nhật ký hút thuốc
  db.run(`
    CREATE TABLE IF NOT EXISTS smoking_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id INTEGER,
      logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(telegram_id) REFERENCES users(telegram_id)
    )
  `);
});

module.exports = db;