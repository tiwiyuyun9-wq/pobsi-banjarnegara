const { dbAll } = require('../config/db');

exports.getTournamentHistory = async (req, res) => {
  const { playerId } = req.query;
  try {
    let query = `SELECT * FROM tournament_history`;
    let params = [];
    if (playerId) {
      query += ` WHERE player_id = ?`;
      params.push(playerId);
    }
    // Sort by id descending
    query += ` ORDER BY id DESC`;
    const history = await dbAll(query, params);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data tournament_history dari SQLite: " + error.message });
  }
};
