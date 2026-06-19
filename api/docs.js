const { supabase } = require('./_supabase');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  try {
    /* ==========================================================================
       GET: Mengambil Dokumen Resmi
       ========================================================================== */
    if (req.method === 'GET') {
      const { data: docs, error } = await supabase
        .from('documents')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return res.status(200).json(docs);
    }

    /* ==========================================================================
       POST: Menambahkan Dokumen Baru
       ========================================================================== */
    if (req.method === 'POST') {
      const { title, date, fileSize, fileType, fileData, fileExtension } = req.body;
      if (!title || !date) {
        return res.status(400).json({ error: "Nama dokumen dan tanggal rilis wajib diisi!" });
      }

      // Ambil ID terbesar untuk generate ID berikutnya
      const { data: allDocs, error: fetchErr } = await supabase
        .from('documents')
        .select('id');

      if (fetchErr) throw fetchErr;

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
      const newId = `D${nextNum.toString().padStart(3, '0')}`;

      let fileUrl = "";
      if (fileData && fileData.includes(';base64,')) {
        const base64Data = fileData.split(';base64,').pop();
        const buffer = Buffer.from(base64Data, 'base64');
        const ext = fileExtension || '.pdf';
        const fileName = `${Date.now()}-${title.replace(/[^a-zA-Z0-9.-]/g, '_')}${ext}`;

        let contentType = 'application/pdf';
        if (fileType === 'WORD') {
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        } else if (fileType === 'EXCEL') {
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        }

        // Upload ke Supabase Storage (bucket 'documents')
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, buffer, {
            contentType: contentType,
            duplex: 'half'
          });

        if (uploadError) {
          console.error("Gagal mengunggah berkas ke Supabase Storage:", uploadError);
          // Tetap lanjutkan tapi tanpa fileUrl, atau throw error jika wajib
        } else {
          // Ambil URL Publik
          const { data: publicUrlData } = supabase.storage
            .from('documents')
            .getPublicUrl(fileName);
          fileUrl = publicUrlData.publicUrl;
        }
      }

      const newDoc = {
        id: newId,
        title: title.trim(),
        date: date.trim(),
        fileSize: fileSize || "120 KB",
        fileType: fileType || "PDF",
        fileUrl: fileUrl
      };

      const { data, error } = await supabase
        .from('documents')
        .insert([newDoc])
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    /* ==========================================================================
       DELETE: Menghapus Dokumen
       ========================================================================== */
    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: "ID dokumen wajib diberikan!" });

      // Ambil data untuk mengecek fileUrl & menghapusnya dari storage
      const { data: doc, error: getErr } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();

      if (!getErr && doc && doc.fileUrl && doc.fileUrl.includes('/documents/')) {
        const fileName = doc.fileUrl.split('/documents/').pop();
        if (fileName) {
          try {
            await supabase.storage
              .from('documents')
              .remove([fileName]);
          } catch (storageErr) {
            console.error("Gagal menghapus file dari Supabase Storage:", storageErr);
          }
        }
      }

      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true, message: "Berkas berhasil dihapus." });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(`Error processing request in api/docs.js (${req.method}):`, error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
