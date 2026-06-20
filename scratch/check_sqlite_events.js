const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '..', 'api', 'data', 'billiard.db'));

db.all(`SELECT id, title FROM events`, (err, rows) => {
  if (err) {
    console.error("SQLite error:", err);
  } else {
    console.log("SQLite Events count:", rows.length);
    console.log("SQLite Events:", rows);
  }
  db.close();
});
