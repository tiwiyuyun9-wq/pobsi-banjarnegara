const { dbAll, dbRun } = require('../config/db');

exports.getSirkuits = async (req, res) => {
  const { year } = req.query;
  if (!year) {
    return res.status(400).json({ error: "Parameter year wajib disertakan!" });
  }

  try {
    const sirkuits = await dbAll(
      `SELECT name FROM boc_sirkuits WHERE year = ? ORDER BY sort_order ASC`,
      [year]
    );
    res.json(sirkuits.map(s => s.name));
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil daftar sirkuit dari SQLite: " + error.message });
  }
};

exports.saveSirkuits = async (req, res) => {
  const { year, sirkuits } = req.body;
  if (!year || !Array.isArray(sirkuits)) {
    return res.status(400).json({ error: "Parameter year dan sirkuits (array) wajib disertakan!" });
  }

  try {
    // Mulai dengan menghapus seluruh sirkuit untuk tahun tersebut
    await dbRun(`DELETE FROM boc_sirkuits WHERE year = ?`, [year]);

    // Insert sirkuit baru jika ada
    if (sirkuits.length > 0) {
      for (let idx = 0; idx < sirkuits.length; idx++) {
        await dbRun(
          `INSERT INTO boc_sirkuits (year, name, sort_order) VALUES (?, ?, ?)`,
          [year.toString(), sirkuits[idx].trim(), idx]
        );
      }
    }

    res.json({ success: true, message: `Daftar sirkuit BOC tahun ${year} berhasil diperbarui!` });
  } catch (error) {
    res.status(500).json({ error: "Gagal menyimpan sirkuit ke SQLite: " + error.message });
  }
};
