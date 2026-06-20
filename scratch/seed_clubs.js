const { supabase } = require('../api/_supabase');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const clubsData = [
  { id: "C001", name: "POBSI Banjarnegara", address: "Kompleks GOR KONI, Jl. Raya Banjarnegara", owner: "Pengcab POBSI", phone: "0821-1502-3944", tables: 4, status: "Aktif" },
  { id: "C002", name: "JP Billiard", address: "Jl. S. Parman, Banjarnegara", owner: "Manajemen JP", phone: "-", tables: 8, status: "Aktif" },
  { id: "C003", name: "RD Billiard", address: "Jl. Letjen Suprapto, Banjarnegara", owner: "Manajemen RD", phone: "-", tables: 6, status: "Aktif" },
  { id: "C004", name: "Platinum Billiard", address: "Jl. MT Haryono, Banjarnegara", owner: "Manajemen Platinum", phone: "-", tables: 10, status: "Aktif" },
  { id: "C005", name: "Luminous Billiard", address: "Jl. Pemuda, Banjarnegara", owner: "Manajemen Luminous", phone: "-", tables: 6, status: "Aktif" },
  { id: "C006", name: "Quantum Billiard", address: "Jl. Raya Banjarnegara", owner: "Manajemen Quantum", phone: "-", tables: 5, status: "Aktif" },
  { id: "C007", name: "Surya Yudha Billiard", address: "Hotel Surya Yudha, Banjarnegara", owner: "Surya Yudha Group", phone: "-", tables: 4, status: "Aktif" }
];

async function seed() {
  console.log("=== Seeding Clubs to Supabase ===");
  // 1. Clean existing clubs in Supabase
  const { error: cleanErr } = await supabase.from('clubs').delete().neq('id', 'placeholder-val-delete-all');
  if (cleanErr) {
    console.error("Gagal membersihkan tabel clubs di Supabase:", cleanErr.message);
  } else {
    console.log("Tabel clubs di Supabase dibersihkan.");
  }

  // 2. Insert to Supabase
  const { data, error } = await supabase.from('clubs').insert(clubsData);
  if (error) {
    console.error("Gagal menyemai clubs ke Supabase:", error.message);
  } else {
    console.log("Berhasil menyemai clubs ke Supabase!");
  }

  // 3. Insert to SQLite local fallback
  console.log("\n=== Seeding Clubs to SQLite ===");
  const dbPath = path.join(__dirname, '..', 'api', 'data', 'billiard.db');
  if (fs.existsSync(dbPath)) {
    const db = new sqlite3.Database(dbPath);
    db.serialize(() => {
      db.run("DELETE FROM clubs", (err) => {
        if (err) console.error("Gagal membersihkan clubs SQLite:", err.message);
      });
      const stmt = db.prepare("INSERT INTO clubs (id, name, address, owner, phone, tables, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
      clubsData.forEach(c => {
        stmt.run(c.id, c.name, c.address, c.owner, c.phone, c.tables, c.status);
      });
      stmt.finalize();
      console.log("Berhasil menyemai clubs ke SQLite!");
    });
    db.close();
  } else {
    console.log("SQLite database tidak ditemukan.");
  }
}

seed();
