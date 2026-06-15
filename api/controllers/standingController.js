// Standing Controller - Mengelola Klasemen Battle of Champions
const { dbAll, dbRun } = require('../config/db');

exports.getStandings = async (req, res) => {
  try {
    const standings = await dbAll(`SELECT * FROM standings ORDER BY points DESC`);
    res.json(standings);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil klasemen dari SQLite: " + error.message });
  }
};

exports.updateStanding = async (req, res) => {
  const { name, club, handicap, points, played, won, lost, boc_points } = req.body;
  if (!name || !club || !handicap || points === undefined) {
    return res.status(400).json({ error: "Nama, klub, handicap, dan poin wajib diisi!" });
  }

  try {
    const newStanding = {
      name,
      club,
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
      `REPLACE INTO standings (rank, name, club, handicap, points, played, won, lost, trend, boc_points) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [null, newStanding.name, newStanding.club, newStanding.handicap, newStanding.points, newStanding.played, newStanding.won, newStanding.lost, newStanding.trend, newStanding.boc_points]
    );

    // Hitung ulang peringkat berdasarkan poin tertinggi
    const skipRank = req.query.skipRank === 'true';
    if (!skipRank) {
      const allStandings = await dbAll(`SELECT * FROM standings ORDER BY points DESC`);
      for (let i = 0; i < allStandings.length; i++) {
        const rank = i + 1;
        const player_name = allStandings[i].name;
        await dbRun(`UPDATE standings SET rank = ? WHERE name = ?`, [rank, player_name]);
      }
    }

    res.status(201).json(newStanding);
  } catch (error) {
    res.status(500).json({ error: "Gagal memperbarui klasemen ke SQLite: " + error.message });
  }
};

exports.resetStandings = async (req, res) => {
  try {
    await dbRun(`UPDATE standings SET points = 0, played = 0, won = 0, lost = 0, rank = null, boc_points = null`);
    res.json({ success: true, message: "Seluruh klasemen sirkuit BOC berhasil di-reset!" });
  } catch (error) {
    res.status(500).json({ error: "Gagal mereset klasemen di SQLite: " + error.message });
  }
};
