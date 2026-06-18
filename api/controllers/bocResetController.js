// BOC Reset Controller - Dev/Testing Tool untuk Reset State BOC
const { dbAll, dbRun, dbGet } = require('../config/db');
const path = require('path');
const fs = require('fs');

// Optional Supabase client for Supabase mode
let supabase = null;
const isSupabaseEnabled = process.env.SUPABASE_URL && process.env.SUPABASE_KEY;
if (isSupabaseEnabled) {
  try {
    supabase = require('../_supabase').supabase;
  } catch (e) {
    console.warn("⚠️ Warning: Failed to load Supabase client in bocResetController:", e.message);
  }
}

exports.resetBoc = async (req, res) => {
  const { year, reseed, clearSirkuits, clearEvents, clearSchedule } = req.body;
  if (!year) {
    return res.status(400).json({ error: "Parameter year wajib disertakan!" });
  }

  const yearStr = year.toString();
  const summary = [];

  try {
    if (supabase) {
      console.log(`☁️ Supabase mode active for resetBoc (BOC ${yearStr})`);
      
      // 1. Hapus semua BOC events untuk tahun ini (jika terpilih)
      if (clearEvents !== false) {
        const { data: events, error: getEventsErr } = await supabase
          .from('events')
          .select('id, title, description')
          .eq('elimination_type', 'boc');
        
        if (getEventsErr) throw getEventsErr;

        const filteredEvents = events.filter(e => 
          (e.title && e.title.includes(yearStr)) || 
          (e.description && e.description.includes(yearStr))
        );

        if (filteredEvents.length > 0) {
          const idsToDelete = filteredEvents.map(e => e.id);
          const { error: deleteEventsErr } = await supabase
            .from('events')
            .delete()
            .in('id', idsToDelete);
          
          if (deleteEventsErr) throw deleteEventsErr;
          summary.push(`🗑️ Dihapus ${filteredEvents.length} BOC event(s): ${filteredEvents.map(e => e.title).join(', ')}`);
        } else {
          summary.push(`ℹ️ Tidak ada BOC event untuk tahun ${yearStr}`);
        }
      } else {
        summary.push(`ℹ️ Skip hapus BOC events`);
      }

      // 2. Clear playoff_schedule di boc_settings (jika terpilih)
      if (clearSchedule !== false) {
        const { data: settings, error: getSettingsErr } = await supabase
          .from('boc_settings')
          .select('*')
          .eq('year', yearStr)
          .maybeSingle();

        if (getSettingsErr) throw getSettingsErr;

        if (settings) {
          const { error: updateScheduleErr } = await supabase
            .from('boc_settings')
            .update({ playoff_schedule: null })
            .eq('year', yearStr);
          
          if (updateScheduleErr) throw updateScheduleErr;
          summary.push(`📅 Jadwal playoff di-reset ke null`);
        } else {
          summary.push(`ℹ️ Tidak ada boc_settings untuk tahun ${yearStr}`);
        }
      } else {
        summary.push(`ℹ️ Skip reset jadwal playoff`);
      }

      // 3. (Opsional) Clear sirkuit
      if (clearSirkuits) {
        const { error: deleteSirkuitsErr } = await supabase
          .from('boc_sirkuits')
          .delete()
          .eq('year', yearStr);
        
        if (deleteSirkuitsErr) throw deleteSirkuitsErr;
        summary.push(`🔄 Sirkuit dihapus untuk tahun ${yearStr}`);
      }

      // 4. (Opsional) Reseed standings dan sirkuits dari db.json
      if (reseed) {
        const dbJsonFile = path.join(__dirname, '..', 'data', 'db.json');
        if (fs.existsSync(dbJsonFile)) {
          try {
            const rawJson = fs.readFileSync(dbJsonFile, 'utf8');
            const seedData = JSON.parse(rawJson);

            if (seedData.standings && seedData.standings.length > 0) {
              const { error: deleteStandingsErr } = await supabase
                .from('standings')
                .delete()
                .eq('year', yearStr);
              
              if (deleteStandingsErr) throw deleteStandingsErr;

              const supabaseStandings = seedData.standings.map(s => ({
                rank: s.rank,
                name: s.name,
                year: yearStr,
                club: s.club,
                handicap: s.handicap,
                points: s.points,
                played: s.played || 0,
                won: s.won || 0,
                lost: s.lost || 0,
                trend: s.trend || 'stable',
                boc_points: null
              }));

              const { error: insertStandingsErr } = await supabase
                .from('standings')
                .insert(supabaseStandings);

              if (insertStandingsErr) throw insertStandingsErr;
              summary.push(`🌱 Reseed ${seedData.standings.length} standings dari db.json`);

              // Reseed default sirkuits ke Supabase
              const { error: deleteSirkuitsErr } = await supabase
                .from('boc_sirkuits')
                .delete()
                .eq('year', yearStr);
              
              if (deleteSirkuitsErr) throw deleteSirkuitsErr;

              const defaultSirkuits = [
                'RD HT', 'JP HT', 'LMS HT', 'SYP HT',
                'RD HT (2)', 'JP HT (2)', 'LMS HT (2)', 'PLT HT',
                'SYP HT (2)', 'RD HT (3)'
              ];
              const supabaseSirkuits = defaultSirkuits.map((name, idx) => ({
                year: yearStr,
                name: name,
                sort_order: idx
              }));

              const { error: insertSirkuitsErr } = await supabase
                .from('boc_sirkuits')
                .insert(supabaseSirkuits);

              if (insertSirkuitsErr) throw insertSirkuitsErr;
              summary.push(`🔄 Reseed ${defaultSirkuits.length} default sirkuits ke Supabase`);
            }
          } catch (parseErr) {
            summary.push(`⚠️ Gagal parse/reseed db.json: ${parseErr.message}`);
          }
        } else {
          summary.push(`⚠️ File db.json tidak ditemukan, skip reseed`);
        }
      }

    } else {
      console.log(`💾 SQLite mode active for resetBoc (BOC ${yearStr})`);
      
      // 1. Hapus semua BOC events untuk tahun ini (jika terpilih)
      if (clearEvents !== false) {
        const bocEvents = await dbAll(
          `SELECT id, title, status FROM events WHERE elimination_type = 'boc' AND (title LIKE ? OR description LIKE ?)`,
          [`%${yearStr}%`, `%${yearStr}%`]
        );

        if (bocEvents.length > 0) {
          await dbRun(
            `DELETE FROM events WHERE elimination_type = 'boc' AND (title LIKE ? OR description LIKE ?)`,
            [`%${yearStr}%`, `%${yearStr}%`]
          );
          summary.push(`🗑️ Dihapus ${bocEvents.length} BOC event(s): ${bocEvents.map(e => e.title).join(', ')}`);
        } else {
          summary.push(`ℹ️ Tidak ada BOC event untuk tahun ${yearStr}`);
        }
      } else {
        summary.push(`ℹ️ Skip hapus BOC events`);
      }

      // 2. Clear playoff_schedule di boc_settings (jika terpilih)
      if (clearSchedule !== false) {
        const settings = await dbGet(`SELECT * FROM boc_settings WHERE year = ?`, [yearStr]);
        if (settings) {
          await dbRun(
            `UPDATE boc_settings SET playoff_schedule = NULL WHERE year = ?`,
            [yearStr]
          );
          summary.push(`📅 Jadwal playoff di-reset ke null`);
        } else {
          summary.push(`ℹ️ Tidak ada boc_settings untuk tahun ${yearStr}`);
        }
      } else {
        summary.push(`ℹ️ Skip reset jadwal playoff`);
      }

      // 3. (Opsional) Clear sirkuit
      if (clearSirkuits) {
        const deletedSirkuits = await dbRun(`DELETE FROM boc_sirkuits WHERE year = ?`, [yearStr]);
        summary.push(`🔄 Sirkuit dihapus untuk tahun ${yearStr}`);
      }

      // 4. (Opsional) Reseed standings dan sirkuits dari db.json
      if (reseed) {
        const dbJsonFile = path.join(__dirname, '..', 'data', 'db.json');
        if (fs.existsSync(dbJsonFile)) {
          try {
            const rawJson = fs.readFileSync(dbJsonFile, 'utf8');
            const seedData = JSON.parse(rawJson);

            if (seedData.standings && seedData.standings.length > 0) {
              // Hapus standings lama untuk tahun ini
              await dbRun(`DELETE FROM standings WHERE year = ?`, [yearStr]);

              // Insert seed data
              for (const s of seedData.standings) {
                await dbRun(
                  `INSERT INTO standings (rank, name, year, club, handicap, points, played, won, lost, trend, boc_points) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [s.rank, s.name, yearStr, s.club, s.handicap, s.points, s.played || 0, s.won || 0, s.lost || 0, s.trend || 'stable', null]
                );
              }
              summary.push(`🌱 Reseed ${seedData.standings.length} standings dari db.json`);

              // Reseed default sirkuits ke SQLite
              await dbRun(`DELETE FROM boc_sirkuits WHERE year = ?`, [yearStr]);
              const defaultSirkuits = [
                'RD HT', 'JP HT', 'LMS HT', 'SYP HT',
                'RD HT (2)', 'JP HT (2)', 'LMS HT (2)', 'PLT HT',
                'SYP HT (2)', 'RD HT (3)'
              ];
              for (let i = 0; i < defaultSirkuits.length; i++) {
                await dbRun(
                  `INSERT INTO boc_sirkuits (year, name, sort_order) VALUES (?, ?, ?)`,
                  [yearStr, defaultSirkuits[i], i]
                );
              }
              summary.push(`🔄 Reseed ${defaultSirkuits.length} default sirkuits ke SQLite`);
            }
          } catch (parseErr) {
            summary.push(`⚠️ Gagal parse db.json: ${parseErr.message}`);
          }
        } else {
          summary.push(`⚠️ File db.json tidak ditemukan, skip reseed`);
        }
      }
    }

    res.json({
      success: true,
      message: `BOC state tahun ${yearStr} berhasil di-reset!`,
      summary
    });
  } catch (error) {
    console.error("Gagal mereset BOC state:", error);
    res.status(500).json({ error: "Gagal mereset BOC state: " + error.message });
  }
};
