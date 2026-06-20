const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { supabase } = require('../api/_supabase');

async function cleanupSupabase() {
  console.log("Cleaning up Supabase events E017, E018...");
  const { error } = await supabase
    .from('events')
    .delete()
    .in('id', ['E017', 'E018']);
  if (error) {
    console.error("Supabase cleanup error:", error);
  } else {
    console.log("Supabase cleanup done.");
  }
}

function cleanupSQLite() {
  return new Promise((resolve, reject) => {
    console.log("Cleaning up SQLite events E017, E018...");
    const db = new sqlite3.Database(path.join(__dirname, '..', 'api', 'data', 'billiard.db'));
    db.run(`DELETE FROM events WHERE id IN ('E017', 'E018')`, function(err) {
      if (err) {
        console.error("SQLite cleanup error:", err);
        reject(err);
      } else {
        console.log(`SQLite cleanup done. Rows deleted: ${this.changes}`);
        resolve();
      }
      db.close();
    });
  });
}

async function run() {
  await cleanupSupabase();
  await cleanupSQLite();
  console.log("Cleanup completed.");
}
run();
