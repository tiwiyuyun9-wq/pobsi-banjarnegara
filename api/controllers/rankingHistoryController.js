const { dbAll } = require('../config/db');

exports.getRankingHistory = async (req, res) => {
  const { playerId } = req.query;
  try {
    let query = `SELECT * FROM ranking_history`;
    let params = [];
    if (playerId) {
      query += ` WHERE player_id = ?`;
      params.push(playerId);
    }
    // Sort by id ascending
    query += ` ORDER BY id ASC`;
    const history = await dbAll(query, params);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data ranking_history dari SQLite: " + error.message });
  }
};
