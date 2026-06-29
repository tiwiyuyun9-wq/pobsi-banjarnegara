const { dbAll, dbRun } = require('../config/db');

exports.getLogs = async (req, res) => {
  try {
    const { limit } = req.query;
    let query = `SELECT * FROM activity_logs ORDER BY created_at DESC`;
    const params = [];

    if (limit) {
      query += ` LIMIT ?`;
      params.push(parseInt(limit, 10));
    }

    const logs = await dbAll(query, params);
    // SQLite doesn't natively map created_at to ISO string if stored as text, but let's keep it format-compliant
    res.json(logs || []);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil log aktivitas dari SQLite: " + error.message });
  }
};

exports.addLog = async (req, res) => {
  const { title, description, type, icon } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: "Judul dan deskripsi log wajib diisi!" });
  }

  try {
    const logType = type || 'info';
    const logIcon = icon || 'fa-info';
    
    const result = await dbRun(
      `INSERT INTO activity_logs (title, description, type, icon) VALUES (?, ?, ?, ?)`,
      [title.trim(), description.trim(), logType, logIcon]
    );

    // Return the inserted log
    res.status(201).json({
      id: result.lastID,
      title: title.trim(),
      description: description.trim(),
      type: logType,
      icon: logIcon,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: "Gagal menambahkan log aktivitas ke SQLite: " + error.message });
  }
};
