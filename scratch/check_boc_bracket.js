const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '..', 'api', 'data', 'billiard.db'));

db.get(`SELECT * FROM events WHERE id = 'E016'`, (err, row) => {
  if (err) {
    console.error("SQLite error:", err);
  } else if (!row) {
    console.log("No BOC event found");
  } else {
    console.log("Event:", row);
  }
  db.close();
});
