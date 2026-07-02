// Script to clear all database tables (SQLite and Supabase)
// except default administrative users.
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const integerIdTables = [
  'ranking_history',
  'handicap_history',
  'tournament_history',
  'matches',
  'activity_logs',
  'boc_sirkuits'
];

const textIdTables = [
  'events',
  'documents',
  'clubs',
  'players'
];

async function clearSupabase() {
  if (!supabaseUrl || !supabaseKey) {
    console.log('⚠️ Supabase credentials not found. Skipping Supabase clearing.');
    return;
  }
  console.log('☁️ Clearing Supabase tables...');
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Clear integer ID tables
  for (const table of integerIdTables) {
    console.log(`   Clearing table '${table}' in Supabase (integer id)...`);
    const { error } = await supabase.from(table).delete().gt('id', 0);
    if (error) {
      console.warn(`   ⚠️ Warning: failed to clear '${table}':`, error.message);
    } else {
      console.log(`   ✅ Cleared table '${table}' in Supabase`);
    }
  }

  // Clear text ID tables
  for (const table of textIdTables) {
    console.log(`   Clearing table '${table}' in Supabase (text id)...`);
    const { error } = await supabase.from(table).delete().neq('id', 'dummy_nonexistent');
    if (error) {
      console.warn(`   ⚠️ Warning: failed to clear '${table}':`, error.message);
    } else {
      console.log(`   ✅ Cleared table '${table}' in Supabase`);
    }
  }

  // Clear standings
  console.log("   Clearing table 'standings' in Supabase...");
  const { error: stdErr } = await supabase.from('standings').delete().neq('year', 'dummy_nonexistent');
  if (stdErr) console.warn("   ⚠️ Warning: failed to clear 'standings':", stdErr.message);
  else console.log("   ✅ Cleared table 'standings' in Supabase");

  // Clear boc_settings
  console.log("   Clearing table 'boc_settings' in Supabase...");
  const { error: setErr } = await supabase.from('boc_settings').delete().neq('year', 'dummy_nonexistent');
  if (setErr) console.warn("   ⚠️ Warning: failed to clear 'boc_settings':", setErr.message);
  else console.log("   ✅ Cleared table 'boc_settings' in Supabase");

  // Clear users table in Supabase except superadmin, admin, staff
  console.log("   Clearing extra users in Supabase...");
  const { error: userErr } = await supabase.from('users').delete().not('username', 'in', '("superadmin","admin","staff")');
  if (userErr) console.warn("   ⚠️ Warning: failed to clear extra users in Supabase:", userErr.message);
  else console.log("   ✅ Cleared extra users in Supabase");

  console.log('✅ Supabase tables cleared!');
}

function clearSQLite() {
  const dbPath = path.join(__dirname, '..', 'api', 'data', 'billiard.db');
  if (!fs.existsSync(dbPath)) {
    console.log(`⚠️ SQLite database file not found. Skipping SQLite clearing.`);
    return;
  }
  console.log(`💾 Clearing SQLite database at: ${dbPath}`);
  const db = new sqlite3.Database(dbPath);

  const allTables = [
    ...integerIdTables,
    ...textIdTables,
    'standings',
    'boc_settings'
  ];

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Disable foreign key constraints temporarily to avoid delete issues
      db.run('PRAGMA foreign_keys = OFF');

      for (const table of allTables) {
        db.run(`DELETE FROM ${table}`, (err) => {
          if (err) {
            console.error(`   ❌ Failed to clear table '${table}':`, err.message);
          } else {
            console.log(`   ✅ Cleared table '${table}' in SQLite`);
          }
        });
      }

      // Clear users except default ones
      db.run(`DELETE FROM users WHERE username NOT IN ('superadmin', 'admin', 'staff')`, (err) => {
        if (err) {
          console.error(`   ❌ Failed to clear extra users:`, err.message);
        } else {
          console.log(`   ✅ Cleared extra users from table 'users' in SQLite`);
        }
      });

      // Enable foreign key constraints back
      db.run('PRAGMA foreign_keys = ON', (err) => {
        db.close((closeErr) => {
          if (closeErr) reject(closeErr);
          else {
            console.log('✅ SQLite database cleared!');
            resolve();
          }
        });
      });
    });
  });
}

function renameDbJson() {
  const dbJsonPath = path.join(__dirname, '..', 'api', 'data', 'db.json');
  const backupPath = path.join(__dirname, '..', 'api', 'data', 'db.json.bak');
  if (fs.existsSync(dbJsonPath)) {
    fs.renameSync(dbJsonPath, backupPath);
    console.log('📦 Renamed api/data/db.json to db.json.bak to prevent auto-seeding on restart!');
  } else {
    console.log('📦 api/data/db.json not found or already renamed.');
  }
}

async function main() {
  renameDbJson();
  await clearSupabase();
  await clearSQLite();
  console.log('\n🎉 ALL DATABASES CLEARED SUCCESSFULLY!');
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
