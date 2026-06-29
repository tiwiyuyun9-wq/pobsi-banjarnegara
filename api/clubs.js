const { supabase, logActivity } = require('./_supabase');

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
      const { name, address, owner, phone, tables } = req.body;
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

      const newClub = {
        id: newId,
        name: name.trim(),
        address: address.trim(),
        owner: owner || '-',
        phone: phone || '-',
        tables: parseInt(tables || 0, 10),
        status: 'Aktif'
      };

      const { data, error } = await supabase
        .from('clubs')
        .insert([newClub])
        .select()
        .single();

      if (error) throw error;

      await logActivity("Klub baru ditambahkan", `${newClub.name} terdaftar sebagai klub terafiliasi`, "success", "fa-building");

      return res.status(201).json(data);
    }

    /* ==========================================================================
       PUT: Memperbarui Data Klub
       ========================================================================== */
    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ error: "ID klub wajib diberikan!" });

      const { name, address, owner, phone, tables, status } = req.body;
      if (!name || !address) {
        return res.status(400).json({ error: "Nama klub dan alamat wajib diisi!" });
      }

      const updated = {
        name: name.trim(),
        address: address.trim(),
        owner: owner || '-',
        phone: phone || '-',
        tables: parseInt(tables || 0, 10),
        status: status || 'Aktif'
      };

      const { error } = await supabase
        .from('clubs')
        .update(updated)
        .eq('id', id);

      if (error) throw error;

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
