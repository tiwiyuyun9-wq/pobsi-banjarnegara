const { supabase } = require('./_supabase');

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

      // Hitung jumlah baris untuk generate ID
      const { count, error: countErr } = await supabase
        .from('clubs')
        .select('*', { count: 'exact', head: true });

      if (countErr) throw countErr;

      const nextNum = (count || 0) + 1;
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

      return res.status(200).json({ success: true, message: `Klub ${id} berhasil diperbarui.` });
    }

    /* ==========================================================================
       DELETE: Menghapus Klub
       ========================================================================== */
    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: "ID klub wajib diberikan!" });

      const { error } = await supabase
        .from('clubs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({ success: true, message: `Klub ${id} berhasil dihapus.` });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(`Error processing request in api/clubs.js (${req.method}):`, error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
