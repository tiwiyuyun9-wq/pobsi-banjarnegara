// Document Controller - Mengelola Surat Edaran & Dokumen Resmi POBSI
const { dbAll, dbGet, dbRun } = require('../config/db');

exports.getDocs = async (req, res) => {
  try {
    const docs = await dbAll(`SELECT * FROM documents`);
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil berkas dokumen dari SQLite: " + error.message });
  }
};

exports.addDoc = async (req, res) => {
  const { title, date, fileSize, fileType } = req.body;
  if (!title || !date) {
    return res.status(400).json({ error: "Nama dokumen dan tanggal rilis wajib diisi!" });
  }

  try {
    const countRow = await dbGet(`SELECT COUNT(*) as count FROM documents`);
    const nextNum = (countRow ? countRow.count : 0) + 1;
    const id = `D${nextNum.toString().padStart(3, '0')}`;

    const newDoc = {
      id,
      title,
      date,
      fileSize: fileSize || "120 KB",
      fileType: fileType || "PDF"
    };

    await dbRun(
      `INSERT INTO documents (id, title, date, fileSize, fileType) VALUES (?, ?, ?, ?, ?)`,
      [newDoc.id, newDoc.title, newDoc.date, newDoc.fileSize, newDoc.fileType]
    );

    res.status(201).json(newDoc);
  } catch (error) {
    res.status(500).json({ error: "Gagal menyimpan berkas ke SQLite: " + error.message });
  }
};
