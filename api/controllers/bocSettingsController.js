const { dbAll, dbRun, dbGet } = require('../config/db');
const { uploadMedia } = require('../_media-upload');

exports.getSettings = async (req, res) => {
  const { year } = req.query;
  if (!year) {
    return res.status(400).json({ error: "Parameter year wajib disertakan!" });
  }

  try {
    const row = await dbGet(
      `SELECT * FROM boc_settings WHERE year = ?`,
      [year.toString()]
    );

    if (row) {
      // Parse JSON fields
      try { row.playoff_schedule = row.playoff_schedule ? JSON.parse(row.playoff_schedule) : null; } catch (e) {}
      try { row.prizes = row.prizes ? JSON.parse(row.prizes) : null; } catch (e) {}
      try { row.point_rules = row.point_rules ? JSON.parse(row.point_rules) : null; } catch (e) {}
      res.json(row);
    } else {
      // Return defaults
      res.json({
        year: year.toString(),
        cutoff_limit: 16,
        max_handicap: 'Bebas',
        playoff_schedule: null,
        prizes: null,
        rules: null,
        point_rules: null,
        status: 'active',
        cover: null
      });
    }
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil settings BOC dari SQLite: " + error.message });
  }
};

exports.saveSettings = async (req, res) => {
  const { year, cutoff_limit, max_handicap, playoff_schedule, prizes, rules, status, point_rules, cover } = req.body;
  if (!year) {
    return res.status(400).json({ error: "Parameter year wajib disertakan!" });
  }

  try {
    const playoffStr = playoff_schedule ? (typeof playoff_schedule === 'object' ? JSON.stringify(playoff_schedule) : playoff_schedule) : null;
    const prizesStr = prizes ? (typeof prizes === 'object' ? JSON.stringify(prizes) : prizes) : null;
    const pointRulesStr = point_rules ? (typeof point_rules === 'object' ? JSON.stringify(point_rules) : point_rules) : null;

    let coverUrl = cover || null;
    if (cover) {
      coverUrl = await uploadMedia(cover, `boc-cover-${year}`, 'covers');
    }

    // UPSERT: Insert or replace
    await dbRun(
      `INSERT INTO boc_settings (year, cutoff_limit, max_handicap, playoff_schedule, prizes, rules, status, point_rules, cover)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(year) DO UPDATE SET
         cutoff_limit = excluded.cutoff_limit,
         max_handicap = excluded.max_handicap,
         playoff_schedule = excluded.playoff_schedule,
         prizes = excluded.prizes,
         rules = excluded.rules,
         status = excluded.status,
         point_rules = excluded.point_rules,
         cover = excluded.cover`,
      [
        year.toString(),
        cutoff_limit != null ? parseInt(cutoff_limit) : 16,
        max_handicap || 'Bebas',
        playoffStr,
        prizesStr,
        rules || null,
        status || 'active',
        pointRulesStr,
        coverUrl
      ]
    );

    res.json({ success: true, message: `Settings BOC tahun ${year} berhasil disimpan!` });
  } catch (error) {
    res.status(500).json({ error: "Gagal menyimpan settings BOC ke SQLite: " + error.message });
  }
};
