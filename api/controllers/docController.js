// Document Controller - Mengelola Surat Edaran & Dokumen Resmi POBSI
const fs = require('fs');
const path = require('path');
const { dbAll, dbGet, dbRun, logActivity } = require('../config/db');

exports.getDocs = async (req, res) => {
  try {
    const docs = await dbAll(`SELECT * FROM documents ORDER BY date DESC`);
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil berkas dokumen dari SQLite: " + error.message });
  }
};

exports.addDoc = async (req, res) => {
  const { title, date, fileSize, fileType, fileData, fileExtension } = req.body;
  if (!title || !date) {
    return res.status(400).json({ error: "Nama dokumen dan tanggal rilis wajib diisi!" });
  }

  try {
    const allDocs = await dbAll(`SELECT id FROM documents`);
    let maxNum = 0;
    if (allDocs && allDocs.length > 0) {
      allDocs.forEach(d => {
        const num = parseInt(d.id.substring(1), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      });
    }
    const nextNum = maxNum + 1;
    const id = `D${nextNum.toString().padStart(3, '0')}`;

    let fileUrl = "";
    if (fileData && fileData.includes(';base64,')) {
      const base64Data = fileData.split(';base64,').pop();
      const uploadDir = path.join(__dirname, '../../public/uploads');
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const ext = fileExtension || '.pdf';
      const fileName = `${Date.now()}-${title.replace(/[^a-zA-Z0-9.-]/g, '_')}${ext}`;
      const filePath = path.join(uploadDir, fileName);
      
      fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });
      fileUrl = `/uploads/${fileName}`;
    }

    const newDoc = {
      id,
      title: title.trim(),
      date: date.trim(),
      fileSize: fileSize || "120 KB",
      fileType: fileType || "PDF",
      fileUrl: fileUrl
    };

    await dbRun(
      `INSERT INTO documents (id, title, date, "fileSize", "fileType", "fileUrl") VALUES (?, ?, ?, ?, ?, ?)`,
      [newDoc.id, newDoc.title, newDoc.date, newDoc.fileSize, newDoc.fileType, newDoc.fileUrl]
    );

    await logActivity("Surat edaran ditambahkan", `Dokumen resmi "${title}" berhasil diunggah`, "info", "fa-file-invoice");

    res.status(201).json(newDoc);
  } catch (error) {
    res.status(500).json({ error: "Gagal menyimpan berkas ke SQLite: " + error.message });
  }
};

exports.deleteDoc = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "ID dokumen wajib diberikan!" });
  }

  try {
    // Ambil info dokumen untuk menghapus berkas fisik jika ada
    const doc = await dbGet(`SELECT * FROM documents WHERE id = ?`, [id]);
    if (!doc) {
      return res.status(404).json({ error: "Dokumen tidak ditemukan!" });
    }

    // Jika ada file lokal, hapus fisiknya dari disk
    if (doc.fileUrl && doc.fileUrl.startsWith('/uploads/')) {
      const fileName = doc.fileUrl.replace('/uploads/', '');
      const filePath = path.join(__dirname, '../../public/uploads', fileName);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error("Gagal menghapus file fisik dokumen dari disk:", err);
        }
      }
    }

    await dbRun(`DELETE FROM documents WHERE id = ?`, [id]);

    await logActivity("Surat edaran dihapus", `Dokumen "${doc.title}" telah dihapus`, "danger", "fa-file-invoice");

    res.json({ success: true, message: "Dokumen berhasil dihapus." });
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus berkas di SQLite: " + error.message });
  }
};

