// Script Migrasi Data dari SQLite Lokal ke Supabase Cloud
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sqlite3 = require('sqlite3').verbose();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Harap isi SUPABASE_URL dan SUPABASE_KEY di file .env terlebih dahulu!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const dbPath = path.join(__dirname, 'api', 'data', 'billiard.db');
if (!fs.existsSync(dbPath)) {
  console.error(`❌ Error: File database SQLite tidak ditemukan di ${dbPath}!`);
  process.exit(1);
}

const db = new sqlite3.Database(dbPath);

const dbAll = (query, params = []) => new Promise((resolve, reject) => {
  db.all(query, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
  });
});

async function migrate() {
  console.log('🔄 Memulai migrasi data dari SQLite lokal ke Supabase...');

  const tables = [
    { name: 'players', sqliteTable: 'players', cleanField: 'id', cleanVal: 'placeholder-val-delete-all' },
    { name: 'clubs', sqliteTable: 'clubs', cleanField: 'id', cleanVal: 'placeholder-val-delete-all' },
    { name: 'documents', sqliteTable: 'documents', cleanField: 'id', cleanVal: 'placeholder-val-delete-all' },
    { name: 'events', sqliteTable: 'events', cleanField: 'id', cleanVal: 'placeholder-val-delete-all' },
    { name: 'standings', sqliteTable: 'standings', cleanField: 'name', cleanVal: 'placeholder-val-delete-all' },
    { name: 'boc_sirkuits', sqliteTable: 'boc_sirkuits', cleanField: 'id', cleanVal: -1 },
    { name: 'boc_settings', sqliteTable: 'boc_settings', cleanField: 'year', cleanVal: 'placeholder-val-delete-all' }
  ];

  for (const table of tables) {
    try {
      console.log(`\n📖 Mengambil data dari SQLite lokal: tabel "${table.sqliteTable}"...`);
      const rows = await dbAll(`SELECT * FROM ${table.sqliteTable}`);
      console.log(`   Ditemukan ${rows.length} baris.`);

      if (rows.length === 0) {
        console.log(`⚠️ Skip "${table.name}" karena tidak ada data.`);
        continue;
      }

      console.log(`🧹 Membersihkan data lama di Supabase untuk tabel "${table.name}"...`);
      let deleteQuery = supabase.from(table.name).delete();
      
      if (typeof table.cleanVal === 'number') {
        deleteQuery = deleteQuery.neq(table.cleanField, table.cleanVal);
      } else {
        deleteQuery = deleteQuery.neq(table.cleanField, table.cleanVal);
      }

      const { error: deleteErr } = await deleteQuery;
      if (deleteErr) {
        console.warn(`⚠️ Warning: Gagal membersihkan tabel "${table.name}":`, deleteErr.message);
      }

      // Upload data in chunks
      const chunkSize = 50;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        
        // Ensure numbers or booleans are parsed if needed, but mostly SQLite rows match Postgres schemas
        const processedChunk = chunk.map(row => {
          const newRow = { ...row };
          // Ensure year in standings has default if null
          if (table.name === 'standings') {
            newRow.year = newRow.year || '2026';
          }
          return newRow;
        });

        const { error } = await supabase.from(table.name).insert(processedChunk);
        if (error) {
          console.error(`❌ Gagal mengunggah chunk tabel ${table.name}:`, error.message);
        } else {
          console.log(`✅ Berhasil mengunggah "${table.name}" baris ${i + 1} s/d ${Math.min(i + chunkSize, rows.length)}`);
        }
      }
    } catch (err) {
      console.error(`❌ Terjadi kesalahan saat memproses tabel ${table.name}:`, err.message);
    }
  }

  db.close();
  console.log('\n🎉 Proses reseeding ke Supabase selesai!');
}

migrate();
