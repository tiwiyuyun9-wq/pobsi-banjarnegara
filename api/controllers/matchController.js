const { dbAll } = require('../config/db');

exports.getMatches = async (req, res) => {
  const { playerId } = req.query;
  try {
    let query = `SELECT * FROM matches`;
    let params = [];
    if (playerId) {
      query += ` WHERE player_id = ?`;
      params.push(playerId);
    }
    // Sort by id descending
    query += ` ORDER BY id DESC`;
    const matches = await dbAll(query, params);
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data matches dari SQLite: " + error.message });
  }
};
