// Modul Database SQLite Terpusat
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const DB_FILE = path.join(dataDir, 'billiard.db');
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error("Gagal membuka file database SQLite:", err);
  } else {
    console.log(`📁 Terhubung ke database SQLite: ${DB_FILE}`);
  }
});

// Promise-based utility SQL wrappers
const dbRun = (query, params = []) => new Promise((resolve, reject) => {
  db.run(query, params, function(err) {
    if (err) reject(err);
    else resolve({ lastID: this.lastID, changes: this.changes });
  });
});

const dbAll = (query, params = []) => new Promise((resolve, reject) => {
  db.all(query, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
  });
});

const dbGet = (query, params = []) => new Promise((resolve, reject) => {
  db.get(query, params, (err, row) => {
    if (err) reject(err);
    else resolve(row);
  });
});

module.exports = {
  db,
  dbRun,
  dbAll,
  dbGet,
  DB_FILE
};
