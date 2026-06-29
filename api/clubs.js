const { supabase, logActivity } = require('./_supabase');
const { uploadMedia } = require('./_media-upload');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Ambil ID parameter jika ada (di-rewrite oleh vercel.json)
  const { id } = req.query;

  try {
    /* ==========================================================================
       GET: Mengambil Data Klub
       ========================================================================== */
    if (req.method === 'GET') {
      if (id) {
        const { data: club, error } = await supabase
          .from('clubs')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        if (!club) return res.status(404).json({ error: 'Klub tidak ditemukan!' });
        return res.status(200).json(club);
      } else {
        const { data: clubs, error } = await supabase
          .from('clubs')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        return res.status(200).json(clubs);
      }
    }

    /* ==========================================================================
       POST: Menambahkan Klub Baru
       ========================================================================== */
    if (req.method === 'POST') {
      const { name, abbr, address, owner, phone, tables, logo, cover } = req.body;
      if (!name || !address) {
        return res.status(400).json({ error: "Nama klub dan alamat wajib diisi!" });
      }

      // Ambil ID terbesar untuk generate ID berikutnya
      const { data: allClubs, error: fetchErr } = await supabase
        .from('clubs')
        .select('id');

      if (fetchErr) throw fetchErr;

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
      const newId = `C${nextNum.toString().padStart(3, '0')}`;

      // Upload logo and cover to Supabase Storage or local fallback
      const logoUrl = logo ? await uploadMedia(logo, `club-logo-${newId}`, 'clubs') : null;
      const coverUrl = cover ? await uploadMedia(cover, `club-cover-${newId}`, 'clubs') : null;

      const newClub = {
        id: newId,
        name: name.trim(),
        abbr: (abbr || '').trim() || '-',
        address: address.trim(),
        owner: owner || '-',
        phone: phone || '-',
        tables: parseInt(tables || 0, 10),
        status: 'Aktif',
        logo: logoUrl || null,
        cover: coverUrl || null
      };

      let data;
      let insertPayload = { ...newClub };
      let maxRetries = 5;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const resInsert = await supabase
          .from('clubs')
          .insert([insertPayload])
          .select()
          .single();

        if (resInsert.error) {
          // Deteksi kolom yang belum ada di Supabase dan hapus dari payload
          const colMatch = resInsert.error.message && resInsert.error.message.match(/Could not find the '(\w+)' column/);
          if (colMatch) {
            const missingCol = colMatch[1];
            console.warn(`⚠️ Warning: Kolom '${missingCol}' belum dibuat di Supabase Cloud. Menghapus dari payload dan retry...`);
            delete insertPayload[missingCol];
            continue;
          }
          throw resInsert.error;
        }

        data = resInsert.data;
        break;
      }

      await logActivity("Klub baru ditambahkan", `${newClub.name} terdaftar sebagai klub terafiliasi`, "success", "fa-building");

      return res.status(201).json(data);
    }

    /* ==========================================================================
       PUT: Memperbarui Data Klub
       ========================================================================== */
    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ error: "ID klub wajib diberikan!" });

      const { name, abbr, address, owner, phone, tables, status, logo, cover } = req.body;
      if (!name || !address) {
        return res.status(400).json({ error: "Nama klub dan alamat wajib diisi!" });
      }

      // Upload logo and cover to Supabase Storage or local fallback
      const logoUrl = logo ? await uploadMedia(logo, `club-logo-${id}`, 'clubs') : null;
      const coverUrl = cover ? await uploadMedia(cover, `club-cover-${id}`, 'clubs') : null;

      const updated = {
        name: name.trim(),
        abbr: (abbr || '').trim() || '-',
        address: address.trim(),
        owner: owner || '-',
        phone: phone || '-',
        tables: parseInt(tables || 0, 10),
        status: status || 'Aktif',
        logo: logoUrl || null,
        cover: coverUrl || null
      };

      let updatePayload = { ...updated };
      let maxRetries = 5;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const resUpdate = await supabase
          .from('clubs')
          .update(updatePayload)
          .eq('id', id);

        if (resUpdate.error) {
          // Deteksi kolom yang belum ada di Supabase dan hapus dari payload
          const colMatch = resUpdate.error.message && resUpdate.error.message.match(/Could not find the '(\w+)' column/);
          if (colMatch) {
            const missingCol = colMatch[1];
            console.warn(`⚠️ Warning: Kolom '${missingCol}' belum dibuat di Supabase Cloud. Menghapus dari payload dan retry...`);
            delete updatePayload[missingCol];
            continue;
          }
          throw resUpdate.error;
        }
        break;
      }

      await logActivity("Data klub diperbarui", `Data klub ${name} berhasil diperbarui`, "info", "fa-building");

      return res.status(200).json({ success: true, message: `Klub ${id} berhasil diperbarui.` });
    }

    /* ==========================================================================
       DELETE: Menghapus Klub
       ========================================================================== */
    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: "ID klub wajib diberikan!" });

      // Cek apakah klub ada
      const { data: club, error: checkErr } = await supabase
        .from('clubs')
        .select('name')
        .eq('id', id)
        .maybeSingle();

      if (checkErr) throw checkErr;
      if (!club) return res.status(404).json({ error: "Klub tidak ditemukan!" });

      const { error } = await supabase
        .from('clubs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await logActivity("Klub dihapus", `Klub ${club.name} dihapus dari daftar afiliasi`, "danger", "fa-building");

      return res.status(200).json({ success: true, message: `Klub ${id} berhasil dihapus.` });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(`Error processing request in api/clubs.js (${req.method}):`, error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
