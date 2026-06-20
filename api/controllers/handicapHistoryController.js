const { dbAll } = require('../config/db');

exports.getHandicapHistory = async (req, res) => {
  const { playerId } = req.query;
  try {
    let query = `SELECT * FROM handicap_history`;
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
    res.status(500).json({ error: "Gagal mengambil data handicap_history dari SQLite: " + error.message });
  }
};
