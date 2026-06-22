const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '..', 'api', 'data', 'billiard.db'));

db.get(`SELECT id, title, status, results, bracket FROM events WHERE id = 'E019'`, (err, row) => {
  if (err) {
    console.error("SQLite error:", err);
  } else if (!row) {
    console.log("SQLite Event E019 not found");
  } else {
    console.log("SQLite Event E019 found:");
    console.log("Title:", row.title);
    console.log("Status:", row.status);
    console.log("Results:", row.results);
    try {
      const br = JSON.parse(row.bracket || '{}');
      console.log("Bracket phase:", br.phase);
      console.log("Bracket mainBracket[6] (Final):", br.mainBracket ? br.mainBracket['6'] : null);
      console.log("Bracket thirdPlace:", br.thirdPlace);
    } catch (e) {
      console.log("Bracket parse error:", e);
    }
  }
  db.close();
});
