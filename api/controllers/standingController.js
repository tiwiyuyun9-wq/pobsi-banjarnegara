// Standing Controller - Mengelola Klasemen Battle of Champions
const { dbAll, dbRun, logActivity } = require('../config/db');

exports.getStandings = async (req, res) => {
  const { year } = req.query;
  try {
    let query = `SELECT * FROM standings`;
    let params = [];
    if (year) {
      query += ` WHERE year = ?`;
      params.push(year);
    }
    query += ` ORDER BY points DESC`;
    const standings = await dbAll(query, params);
    res.json(standings);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil klasemen dari SQLite: " + error.message });
  }
};

exports.updateStanding = async (req, res) => {
  const { name, year, club, handicap, points, played, won, lost, boc_points } = req.body;
  if (!name || !club || !handicap || points === undefined) {
    return res.status(400).json({ error: "Nama, klub, handicap, dan poin wajib diisi!" });
  }

  const standingYear = (year || '2026').toString().trim();

  try {
    const newStanding = {
      name: name.trim(),
      year: standingYear,
      club: club.trim(),
      handicap: handicap.toString().trim(),
      points: parseInt(points, 10),
      played: parseInt(played || 0, 10),
      won: parseInt(won || 0, 10),
      lost: parseInt(lost || 0, 10),
      trend: "stable",
      boc_points: boc_points || null
    };

    // Gunakan REPLACE INTO (UPSERT)
    await dbRun(
      `REPLACE INTO standings (rank, name, year, club, handicap, points, played, won, lost, trend, boc_points) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [null, newStanding.name, newStanding.year, newStanding.club, newStanding.handicap, newStanding.points, newStanding.played, newStanding.won, newStanding.lost, newStanding.trend, newStanding.boc_points]
    );

    // Hitung ulang peringkat berdasarkan poin tertinggi untuk tahun ini saja
    const skipRank = req.query.skipRank === 'true';
    if (!skipRank) {
      const allStandings = await dbAll(`SELECT * FROM standings WHERE year = ? ORDER BY points DESC`, [newStanding.year]);
      for (let i = 0; i < allStandings.length; i++) {
        const rank = i + 1;
        const player_name = allStandings[i].name;
        await dbRun(`UPDATE standings SET rank = ? WHERE name = ? AND year = ?`, [rank, player_name, newStanding.year]);
      }
    }

    res.status(201).json(newStanding);
  } catch (error) {
    res.status(500).json({ error: "Gagal memperbarui klasemen ke SQLite: " + error.message });
  }
};

exports.resetStandings = async (req, res) => {
  const { year } = req.body;
  if (!year) {
    return res.status(400).json({ error: "Tahun (year) wajib ditentukan untuk melakukan reset!" });
  }

  try {
    // Reset standings columns for a specific year
    await dbRun(
      `UPDATE standings SET points = 0, played = 0, won = 0, lost = 0, rank = null, boc_points = null WHERE year = ?`,
      [year.toString()]
    );
    // Hapus seluruh sirkuit untuk tahun tersebut
    await dbRun(`DELETE FROM boc_sirkuits WHERE year = ?`, [year.toString()]);

    await logActivity("Klasemen di-reset", `Klasemen BOC tahun ${year} berhasil di-reset`, "warning", "fa-rotate-left");

    res.json({ success: true, message: `Seluruh klasemen sirkuit BOC tahun ${year} berhasil di-reset!` });
  } catch (error) {
    res.status(500).json({ error: "Gagal mereset klasemen di SQLite: " + error.message });
  }
};

exports.reindexStandings = async (req, res) => {
  const { year } = req.body;
  if (!year) {
    return res.status(400).json({ error: "Tahun (year) wajib ditentukan untuk melakukan re-index!" });
  }

  const standingYear = year.toString().trim();

  try {
    const allStandings = await dbAll(
      `SELECT * FROM standings WHERE year = ? ORDER BY points DESC`,
      [standingYear]
    );

    if (allStandings.length === 0) {
      return res.json({ success: true, message: `Tidak ada data klasemen untuk tahun ${standingYear} yang perlu di-reindex.` });
    }

    for (let i = 0; i < allStandings.length; i++) {
      const rank = i + 1;
      const player_name = allStandings[i].name;
      await dbRun(
        `UPDATE standings SET rank = ? WHERE name = ? AND year = ?`,
        [rank, player_name, standingYear]
      );
    }

    await logActivity("Klasemen di-reindex", `Peringkat klasemen BOC tahun ${standingYear} berhasil diperbarui`, "info", "fa-ranking-star");

    res.json({ success: true, message: `Peringkat klasemen tahun ${standingYear} berhasil di-reindex di database SQLite.` });
  } catch (error) {
    res.status(500).json({ error: "Gagal melakukan re-index klasemen di SQLite: " + error.message });
  }
};

