// Script: Re-seed Supabase dari SQLite lokal (reference/seed data)
// Hanya mengupdate standings dan boc_sirkuits yang ter-reset
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL dan SUPABASE_KEY harus diisi di .env!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const dbPath = path.join(__dirname, '..', 'api', 'data', 'billiard.db');
const db = new sqlite3.Database(dbPath);

const dbAll = (query, params = []) => new Promise((resolve, reject) => {
  db.all(query, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
  });
});

async function reseed() {
  console.log('🔄 Memulai reseed data dari SQLite lokal ke Supabase...\n');

  // ====== 1. Re-seed BOC Sirkuits ======
  console.log('📋 [1/2] Re-seeding boc_sirkuits...');
  const sirkuits = await dbAll('SELECT * FROM boc_sirkuits WHERE year = "2026" ORDER BY sort_order');
  console.log(`   Ditemukan ${sirkuits.length} sirkuit di SQLite.`);

  if (sirkuits.length > 0) {
    // Hapus data lama di Supabase
    const { error: delSirkErr } = await supabase
      .from('boc_sirkuits')
      .delete()
      .eq('year', '2026');
    if (delSirkErr) console.error('   ⚠️ Gagal hapus sirkuit lama:', delSirkErr.message);

    // Insert data baru
    const sirkuitData = sirkuits.map(s => ({
      year: s.year.toString(),
      name: s.name,
      sort_order: s.sort_order
    }));

    const { error: insSirkErr } = await supabase
      .from('boc_sirkuits')
      .insert(sirkuitData);

    if (insSirkErr) {
      console.error('   ❌ Gagal insert sirkuit:', insSirkErr.message);
    } else {
      console.log(`   ✅ ${sirkuits.length} sirkuit berhasil di-reseed!`);
    }
  }

  // ====== 2. Re-seed Standings ======
  console.log('\n📋 [2/2] Re-seeding standings...');
  const standings = await dbAll('SELECT * FROM standings WHERE year = "2026"');
  console.log(`   Ditemukan ${standings.length} standings di SQLite (${standings.filter(s => s.points > 0).length} memiliki poin > 0).`);

  if (standings.length > 0) {
    // Hapus semua standings tahun 2026 di Supabase
    const { error: delStdErr } = await supabase
      .from('standings')
      .delete()
      .eq('year', '2026');
    if (delStdErr) console.error('   ⚠️ Gagal hapus standings lama:', delStdErr.message);

    // Upload dalam batch (50 per batch)
    const chunkSize = 50;
    let successCount = 0;
    for (let i = 0; i < standings.length; i += chunkSize) {
      const chunk = standings.slice(i, i + chunkSize).map(row => ({
        name: row.name,
        year: (row.year || '2026').toString(),
        club: row.club,
        handicap: row.handicap ? row.handicap.toString() : '3N',
        points: parseInt(row.points || 0, 10),
        played: parseInt(row.played || 0, 10),
        won: parseInt(row.won || 0, 10),
        lost: parseInt(row.lost || 0, 10),
        rank: row.rank || null,
        trend: row.trend || 'stable',
        boc_points: row.boc_points || null
      }));

      const { error } = await supabase.from('standings').insert(chunk);
      if (error) {
        console.error(`   ❌ Gagal insert batch ${i + 1}-${Math.min(i + chunkSize, standings.length)}:`, error.message);
      } else {
        successCount += chunk.length;
        console.log(`   ✅ Berhasil insert standings baris ${i + 1} s/d ${Math.min(i + chunkSize, standings.length)}`);
      }
    }
    console.log(`   📊 Total: ${successCount}/${standings.length} standings berhasil di-reseed.`);
  }

  db.close();
  console.log('\n🎉 Proses reseed ke Supabase selesai!');
}

reseed().catch(err => {
  console.error('❌ Fatal error:', err);
  db.close();
  process.exit(1);
});
