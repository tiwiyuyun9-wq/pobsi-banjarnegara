const { supabase } = require('../api/_supabase');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const mockMatches = [
  // Pak Teguh RD (P009)
  { player_id: "P009", opponent_name: "Ade JP", opponent_club: "JP Billiard", score: "7 - 4", outcome: "W", date: "18 Mei 2026" },
  { player_id: "P009", opponent_name: "Yudha", opponent_club: "Independen", score: "7 - 5", outcome: "W", date: "10 Mei 2026" },
  { player_id: "P009", opponent_name: "Inux JP", opponent_club: "JP Billiard", score: "7 - 2", outcome: "W", date: "02 Mei 2026" },
  { player_id: "P009", opponent_name: "Akbar", opponent_club: "Independen", score: "7 - 3", outcome: "W", date: "24 Apr 2026" },

  // Aan PLT (P011)
  { player_id: "P011", opponent_name: "Edi Muncang", opponent_club: "RD Billiard", score: "4 - 7", outcome: "L", date: "15 Mei 2026" },
  { player_id: "P011", opponent_name: "Akbar", opponent_club: "Independen", score: "7 - 5", outcome: "W", date: "08 Mei 2026" }
];

const mockTourneys = [
  // Pak Teguh RD (P009)
  { player_id: "P009", title: "BOC Series #4", date: "18 Mei 2026", venue: "Surya Yudha Billiard Arena", badge: "Juara 1", class_name: "juara1", icon: "🥇" },
  { player_id: "P009", title: "BOC Series #3", date: "12 Mar 2026", venue: "JP Billiard Club", badge: "Runner Up", class_name: "runnerup", icon: "🥈" },

  // Aan PLT (P011)
  { player_id: "P011", title: "Handicap Challenge Cup", date: "20 Apr 2026", venue: "Star Billiard", badge: "Semi Final", class_name: "semifinal", icon: "🥉" }
];

async function seed() {
  // 1. Seed SQLite
  console.log("=== Seeding SQLite ===");
  const dbPath = path.join(__dirname, '..', 'api', 'data', 'billiard.db');
  if (fs.existsSync(dbPath)) {
    const db = new sqlite3.Database(dbPath);
    db.serialize(() => {
      db.run("DELETE FROM matches");
      db.run("DELETE FROM tournament_history");

      const matchStmt = db.prepare("INSERT INTO matches (player_id, opponent_name, opponent_club, score, outcome, date) VALUES (?, ?, ?, ?, ?, ?)");
      mockMatches.forEach(m => {
        matchStmt.run(m.player_id, m.opponent_name, m.opponent_club, m.score, m.outcome, m.date);
      });
      matchStmt.finalize();

      const tourneyStmt = db.prepare("INSERT INTO tournament_history (player_id, title, date, venue, badge, class_name, icon) VALUES (?, ?, ?, ?, ?, ?, ?)");
      mockTourneys.forEach(t => {
        tourneyStmt.run(t.player_id, t.title, t.date, t.venue, t.badge, t.class_name, t.icon);
      });
      tourneyStmt.finalize();

      console.log("✅ Berhasil menyemai data matches & tournament_history di SQLite!");
    });
    db.close();
  } else {
    console.log("⚠️ billiard.db tidak ditemukan.");
  }

  // 2. Seed Supabase
  console.log("\n=== Seeding Supabase ===");
  try {
    const { error: cleanMatchErr } = await supabase.from('matches').delete().neq('id', -1);
    const { error: cleanTourneyErr } = await supabase.from('tournament_history').delete().neq('id', -1);
    
    if (cleanMatchErr || cleanTourneyErr) {
      console.warn("⚠️ Gagal membersihkan tabel di Supabase (mungkin tabel belum dibuat):", cleanMatchErr?.message || cleanTourneyErr?.message);
      console.log("💡 Silakan jalankan DDL SQL di panel Supabase Dashboard terlebih dahulu!");
      return;
    }

    const { error: matchInsertErr } = await supabase.from('matches').insert(mockMatches);
    const { error: tourneyInsertErr } = await supabase.from('tournament_history').insert(mockTourneys);

    if (matchInsertErr || tourneyInsertErr) {
      console.error("❌ Gagal menyemai data ke Supabase:", matchInsertErr?.message || tourneyInsertErr?.message);
    } else {
      console.log("✅ Berhasil menyemai data matches & tournament_history di Supabase!");
    }
  } catch (err) {
    console.error("❌ Terjadi error saat seeding Supabase:", err.message);
  }
}

seed();
