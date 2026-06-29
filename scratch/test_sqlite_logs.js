const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'api', 'data', 'billiard.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error("Gagal membuka SQLite:", err.message);
    process.exit(1);
  }
});

console.log("Membuka database SQLite local...");
db.all("SELECT * FROM sqlite_master WHERE type='table' AND name='activity_logs'", [], (err, rows) => {
  if (err) {
    console.error("Gagal query master table:", err.message);
    db.close();
    process.exit(1);
  }
  
  if (rows.length > 0) {
    console.log("✅ Tabel 'activity_logs' ditemukan di SQLite!");
    
    // Query logs
    db.all("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 5", [], (err, logs) => {
      if (err) {
        console.error("Gagal query activity_logs:", err.message);
      } else {
        console.log(`Ditemukan ${logs.length} log lokal di SQLite:`);
        console.log(logs);
      }
      db.close();
      process.exit(0);
    });
  } else {
    console.log("❌ Tabel 'activity_logs' tidak ditemukan di SQLite!");
    db.close();
    process.exit(1);
  }
});
