// Club Controller - Mengelola Data Klub Biliar
const { dbAll, dbGet, dbRun } = require('../config/db');

exports.getClubs = async (req, res) => {
  try {
    const clubs = await dbAll(`SELECT * FROM clubs ORDER BY name ASC`);
    res.json(clubs);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data klub dari SQLite: " + error.message });
  }
};

exports.addClub = async (req, res) => {
  const { name, address, owner, phone, tables } = req.body;
  if (!name || !address) {
    return res.status(400).json({ error: "Nama klub dan alamat wajib diisi!" });
  }

  try {
    const allClubs = await dbAll(`SELECT id FROM clubs`);
    let maxNum = 0;
    if (allClubs && allClubs.length > 0) {
      allClubs.forEach(c => {
        const num = parseInt(c.id.substring(1), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      });
    }
    const nextNum = maxNum + 1;
    const id = `C${nextNum.toString().padStart(3, '0')}`;

    const newClub = {
      id,
      name,
      address,
      owner: owner || '-',
      phone: phone || '-',
      tables: parseInt(tables || 0),
      status: 'Aktif'
    };

    await dbRun(
      `INSERT INTO clubs (id, name, address, owner, phone, tables, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [newClub.id, newClub.name, newClub.address, newClub.owner, newClub.phone, newClub.tables, newClub.status]
    );

    res.status(201).json(newClub);
  } catch (error) {
    res.status(500).json({ error: "Gagal menambahkan klub ke SQLite: " + error.message });
  }
};

exports.deleteClub = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "ID klub wajib diberikan!" });
  }

  try {
    const result = await dbRun(`DELETE FROM clubs WHERE id = ?`, [id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Klub tidak ditemukan!" });
    }
    res.json({ success: true, message: `Klub ${id} berhasil dihapus.` });
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus klub dari SQLite: " + error.message });
  }
};

exports.updateClub = async (req, res) => {
  const { id } = req.params;
  const { name, address, owner, phone, tables, status } = req.body;
  if (!name || !address) {
    return res.status(400).json({ error: "Nama klub dan alamat wajib diisi!" });
  }

  try {
    const result = await dbRun(
      `UPDATE clubs SET name = ?, address = ?, owner = ?, phone = ?, tables = ?, status = ? WHERE id = ?`,
      [name, address, owner || '-', phone || '-', parseInt(tables || 0), status || 'Aktif', id]
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: "Klub tidak ditemukan!" });
    }
    res.json({ success: true, message: `Klub ${id} berhasil diperbarui.` });
  } catch (error) {
    res.status(500).json({ error: "Gagal memperbarui data klub di SQLite: " + error.message });
  }
};

