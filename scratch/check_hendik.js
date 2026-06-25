const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'api', 'data', 'billiard.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log("=== Checking for player Hendik ===");
  db.all("SELECT * FROM players WHERE name LIKE '%Hendik%'", [], (err, rows) => {
    if (err) {
      console.error(err);
    } else {
      console.log(rows);
    }
  });

  console.log("=== Checking events containing playoff / E016 ===");
  db.all("SELECT id, title, bracket FROM events WHERE id = 'E016'", [], (err, rows) => {
    if (err) {
      console.error(err);
    } else {
      rows.forEach(r => {
        console.log(`Event ID: ${r.id}, Title: ${r.title}`);
        try {
          console.log("Full bracket:", r.bracket);
        } catch(e) {
          console.error(e);
        }
      });
    }
  });
});

db.close();
