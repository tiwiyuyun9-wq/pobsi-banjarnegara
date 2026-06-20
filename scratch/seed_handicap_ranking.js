const { supabase } = require('../api/_supabase');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Handicap history seed data based on the screenshot design
// Matches the UI: date, from_hc, to_hc, reason, admin_name
const mockHandicapHistory = [
  // Pak Teguh RD (P009) - HC saat ini: 3A
  { player_id: "P009", date: "12 Mar 2025", from_hc: "3A", to_hc: "3N", reason: "Peningkatan konsistensi di Series", admin_name: "Admin POBSI" },
  { player_id: "P009", date: "20 Jan 2025", from_hc: "3B", to_hc: "3A", reason: "Evaluasi tim pelatih & performa turnamen", admin_name: "Admin POBSI" },
  { player_id: "P009", date: "12 Jan 2025", from_hc: "-", to_hc: "3B", reason: "Registrasi & Pendaftaran Awal Atlet", admin_name: "Admin POBSI" },

  // Aan PLT (P011) - HC saat ini: 3N
  { player_id: "P011", date: "12 Mar 2025", from_hc: "3A", to_hc: "3N", reason: "Peningkatan konsistensi di Series", admin_name: "Admin POBSI" },
  { player_id: "P011", date: "20 Jan 2025", from_hc: "3B", to_hc: "3A", reason: "Evaluasi tim pelatih & performa turnamen", admin_name: "Admin POBSI" },
  { player_id: "P011", date: "12 Jan 2025", from_hc: "-", to_hc: "3B", reason: "Registrasi & Pendaftaran Awal Atlet", admin_name: "Admin POBSI" },

  // Additional players for completeness
  // P001 - Aditya (HC 5)
  { player_id: "P001", date: "18 Mei 2025", from_hc: "4A", to_hc: "5B", reason: "Konsisten Top 8 di Turnamen Sirkuit POBSI", admin_name: "Admin POBSI" },
  { player_id: "P001", date: "12 Mar 2025", from_hc: "4B", to_hc: "4A", reason: "Juara BOC Series #3", admin_name: "Admin POBSI" },
  { player_id: "P001", date: "20 Jan 2025", from_hc: "3A", to_hc: "4B", reason: "Peningkatan Performa & Evaluasi Tim Teknis", admin_name: "Admin POBSI" },
  { player_id: "P001", date: "12 Jan 2025", from_hc: "-", to_hc: "3A", reason: "Registrasi & Pendaftaran Awal Atlet", admin_name: "Admin POBSI" },

  // P002 - Bambang (HC 6)
  { player_id: "P002", date: "18 Mei 2025", from_hc: "5A", to_hc: "6", reason: "Konsisten Top 8 di Turnamen Sirkuit POBSI", admin_name: "Admin POBSI" },
  { player_id: "P002", date: "12 Mar 2025", from_hc: "5B", to_hc: "5A", reason: "Juara BOC Series #3", admin_name: "Admin POBSI" },
  { player_id: "P002", date: "20 Jan 2025", from_hc: "4A", to_hc: "5B", reason: "Peningkatan Performa & Evaluasi Tim Teknis", admin_name: "Admin POBSI" },
  { player_id: "P002", date: "12 Jan 2025", from_hc: "-", to_hc: "4A", reason: "Registrasi & Pendaftaran Awal Atlet", admin_name: "Admin POBSI" },
];

// Ranking history seed data for chart display
// Shows monthly ranking positions over the past year
const mockRankingHistory = [
  // P009
  { player_id: "P009", date: "2025-07", rank: 24 },
  { player_id: "P009", date: "2025-09", rank: 20 },
  { player_id: "P009", date: "2025-11", rank: 14 },
  { player_id: "P009", date: "2026-01", rank: 10 },
  { player_id: "P009", date: "2026-03", rank: 7 },
  { player_id: "P009", date: "2026-05", rank: 9 },

  // P011
  { player_id: "P011", date: "2025-07", rank: 18 },
  { player_id: "P011", date: "2025-09", rank: 15 },
  { player_id: "P011", date: "2025-11", rank: 12 },
  { player_id: "P011", date: "2026-01", rank: 9 },
  { player_id: "P011", date: "2026-03", rank: 11 },
  { player_id: "P011", date: "2026-05", rank: 15 },

  // P001
  { player_id: "P001", date: "2025-07", rank: 5 },
  { player_id: "P001", date: "2025-09", rank: 4 },
  { player_id: "P001", date: "2025-11", rank: 3 },
  { player_id: "P001", date: "2026-01", rank: 2 },
  { player_id: "P001", date: "2026-03", rank: 1 },
  { player_id: "P001", date: "2026-05", rank: 1 },

  // P002
  { player_id: "P002", date: "2025-07", rank: 8 },
  { player_id: "P002", date: "2025-09", rank: 6 },
  { player_id: "P002", date: "2025-11", rank: 5 },
  { player_id: "P002", date: "2026-01", rank: 3 },
  { player_id: "P002", date: "2026-03", rank: 2 },
  { player_id: "P002", date: "2026-05", rank: 2 },
];

async function seed() {
  // 1. Seed SQLite
  console.log("=== Seeding SQLite ===");
  const dbPath = path.join(__dirname, '..', 'api', 'data', 'billiard.db');
  if (fs.existsSync(dbPath)) {
    const db = new sqlite3.Database(dbPath);
    db.serialize(() => {
      db.run("DELETE FROM handicap_history");
      db.run("DELETE FROM ranking_history");

      const hcStmt = db.prepare("INSERT INTO handicap_history (player_id, date, from_hc, to_hc, reason, admin_name) VALUES (?, ?, ?, ?, ?, ?)");
      mockHandicapHistory.forEach(h => {
        hcStmt.run(h.player_id, h.date, h.from_hc, h.to_hc, h.reason, h.admin_name);
      });
      hcStmt.finalize();

      const rkStmt = db.prepare("INSERT INTO ranking_history (player_id, date, rank) VALUES (?, ?, ?)");
      mockRankingHistory.forEach(r => {
        rkStmt.run(r.player_id, r.date, r.rank);
      });
      rkStmt.finalize();

      console.log("✅ Berhasil menyemai data handicap_history & ranking_history di SQLite!");
    });
    db.close();
  } else {
    console.log("⚠️ billiard.db tidak ditemukan.");
  }

  // 2. Seed Supabase
  console.log("\n=== Seeding Supabase ===");
  try {
    const { error: cleanHcErr } = await supabase.from('handicap_history').delete().neq('id', -1);
    const { error: cleanRkErr } = await supabase.from('ranking_history').delete().neq('id', -1);

    if (cleanHcErr || cleanRkErr) {
      console.warn("⚠️ Gagal membersihkan tabel di Supabase:", cleanHcErr?.message || cleanRkErr?.message);
      console.log("💡 Silakan jalankan DDL SQL di panel Supabase Dashboard terlebih dahulu!");
      return;
    }

    const { error: hcInsertErr } = await supabase.from('handicap_history').insert(mockHandicapHistory);
    const { error: rkInsertErr } = await supabase.from('ranking_history').insert(mockRankingHistory);

    if (hcInsertErr || rkInsertErr) {
      console.error("❌ Gagal menyemai data ke Supabase:", hcInsertErr?.message || rkInsertErr?.message);
    } else {
      console.log("✅ Berhasil menyemai data handicap_history & ranking_history di Supabase!");
    }
  } catch (err) {
    console.error("❌ Terjadi error saat seeding Supabase:", err.message);
  }
}

seed();
