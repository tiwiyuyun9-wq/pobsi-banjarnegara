// Script Migrasi Data dari db.json lokal ke Supabase Cloud
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Harap isi SUPABASE_URL dan SUPABASE_KEY di file .env terlebih dahulu!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('🔄 Memulai migrasi data dari api/data/db.json ke Supabase...');
  
  const jsonPath = path.join(__dirname, 'api', 'data', 'db.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ Error: File api/data/db.json tidak ditemukan!');
    process.exit(1);
  }
  
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const dbData = JSON.parse(rawData);
  
  const tables = [
    { key: 'players', name: 'players' },
    { key: 'standings', name: 'standings' },
    { key: 'events', name: 'events' },
    { key: 'documents', name: 'documents' },
    { key: 'clubs', name: 'clubs' }
  ];
  
  for (const table of tables) {
    const data = dbData[table.key];
    if (data && data.length > 0) {
      console.log(`\n📤 Memproses tabel "${table.name}" (${data.length} baris)...`);
      
      // Bersihkan data lama agar bersih sebelum disisipkan ulang (clean migration)
      let deleteQuery = supabase.from(table.name).delete();
      if (table.name === 'standings') {
        deleteQuery = deleteQuery.neq('name', 'placeholder-val-delete-all');
      } else {
        deleteQuery = deleteQuery.neq('id', 'placeholder-val-delete-all');
      }
      
      const { error: deleteErr } = await deleteQuery;
      if (deleteErr) {
        console.warn(`⚠️ Warning: Gagal membersihkan data lama di tabel ${table.name}:`, deleteErr.message);
      }
      
      // Bagi ke dalam chunk berisi 50 baris untuk mencegah payload overflow
      const chunkSize = 50;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        
        const processedChunk = chunk.map(row => {
          const newRow = { ...row };
          
          // Konversi array/object ke string JSON agar bisa disimpan di Postgres TEXT columns
          if (table.name === 'standings' && newRow.boc_points) {
            newRow.boc_points = typeof newRow.boc_points === 'object' ? JSON.stringify(newRow.boc_points) : newRow.boc_points;
          }
          if (table.name === 'events') {
            ['participants', 'bracket', 'results'].forEach(k => {
              if (newRow[k]) {
                newRow[k] = typeof newRow[k] === 'object' ? JSON.stringify(newRow[k]) : newRow[k];
              }
            });
          }
          return newRow;
        });
        
        const { error } = await supabase.from(table.name).insert(processedChunk);
        if (error) {
          console.error(`❌ Gagal mengunggah chunk tabel ${table.name}:`, error.message);
        } else {
          console.log(`✅ Berhasil mengunggah baris ${i + 1} s/d ${Math.min(i + chunkSize, data.length)}`);
        }
      }
    }
  }
  
  console.log('\n🎉 Proses migrasi ke Supabase selesai!');
}

migrate();
