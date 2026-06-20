const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'api', 'data', 'billiard.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log("=== Checking SQLite `boc_settings` ===");
  db.all("SELECT year, cover, status FROM boc_settings", [], (err, rows) => {
    if (err) {
      console.error(err);
    } else {
      console.log(rows);
    }
  });

  console.log("\n=== Checking SQLite `events` (showing limit 2) ===");
  db.all("SELECT id, title, poster FROM events LIMIT 2", [], (err, rows) => {
    if (err) {
      console.error(err);
    } else {
      console.log(rows);
    }
  });

  console.log("\n=== Checking SQLite `players` (showing limit 2 with non-null images) ===");
  db.all("SELECT id, name, avatar, cover, ktp FROM players WHERE avatar IS NOT NULL OR cover IS NOT NULL OR ktp IS NOT NULL LIMIT 2", [], (err, rows) => {
    if (err) {
      console.error(err);
    } else {
      console.log(rows);
    }
  });
});

db.close();
