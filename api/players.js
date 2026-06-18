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
       GET: Mengambil Data Atlet
       ========================================================================== */
    if (req.method === 'GET') {
      if (id) {
        // Ambil atlet berdasarkan ID
        const { data: player, error } = await supabase
          .from('players')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        if (!player) return res.status(404).json({ error: 'Atlet tidak ditemukan!' });
        return res.status(200).json(player);
      } else {
        // Ambil semua atlet
        const { data: players, error } = await supabase
          .from('players')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        return res.status(200).json(players);
      }
    }

    /* ==========================================================================
       POST: Menambahkan Atlet Baru
       ========================================================================== */
    if (req.method === 'POST') {
      const { name, club, handicap, points, avatar, gender, age, phone, address, cover, ktp } = req.body;
      if (!name || !club || !handicap) {
        return res.status(400).json({ error: "Nama, klub, dan handicap wajib diisi!" });
      }

      // Ambil ID terbesar untuk generate ID berikutnya
      const { data: allPlayers, error: fetchErr } = await supabase
        .from('players')
        .select('id');

      if (fetchErr) throw fetchErr;

      let maxNum = 0;
      if (allPlayers && allPlayers.length > 0) {
        allPlayers.forEach(p => {
          const num = parseInt(p.id.substring(1), 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        });
      }
      const nextNum = maxNum + 1;
      const newId = `P${nextNum.toString().padStart(3, '0')}`;
      const defaultAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`;

      const newPlayer = {
        id: newId,
        name: name.trim(),
        club: club.trim(),
        handicap: handicap.toString().trim(),
        status: "Aktif",
        points: parseFloat(points || 0.0),
        avatar: avatar && avatar.trim() ? avatar.trim() : defaultAvatar,
        gender: gender || "Laki-laki",
        age: age ? parseInt(age, 10) : 24,
        phone: phone && phone.trim() ? phone.trim() : "0812-XXXX-XXXX",
        address: address && address.trim() ? address.trim() : "Kabupaten Banjarnegara",
        cover: cover && cover.trim() ? cover.trim() : "",
        ktp: ktp && ktp.trim() ? ktp.trim() : ""
      };

      const { data, error } = await supabase
        .from('players')
        .insert([newPlayer])
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    /* ==========================================================================
       PUT: Memperbarui Data Atlet
       ========================================================================== */
    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ error: "ID atlet wajib diberikan!" });

      const { name, club, handicap, points, avatar, gender, age, phone, address, status, cover, ktp } = req.body;

      // Cek apakah atlet ada
      const { data: player, error: checkErr } = await supabase
        .from('players')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (checkErr) throw checkErr;
      if (!player) return res.status(404).json({ error: "Atlet tidak ditemukan!" });

      const updated = {
        name: name !== undefined ? name.trim() : player.name,
        club: club !== undefined ? club.trim() : player.club,
        handicap: handicap !== undefined ? handicap.toString().trim() : player.handicap,
        points: points !== undefined ? parseFloat(points) : player.points,
        avatar: avatar !== undefined ? avatar.trim() : player.avatar,
        gender: gender !== undefined ? gender : player.gender,
        age: age !== undefined ? parseInt(age, 10) : player.age,
        phone: phone !== undefined ? phone.trim() : player.phone,
        address: address !== undefined ? address.trim() : player.address,
        status: status !== undefined ? status : player.status,
        cover: cover !== undefined ? cover.trim() : player.cover,
        ktp: ktp !== undefined ? ktp.trim() : player.ktp
      };

      const { error: updateErr } = await supabase
        .from('players')
        .update(updated)
        .eq('id', id);

      if (updateErr) throw updateErr;

      // Perbarui juga data di tabel standings jika nama, klub, atau handicap berubah
      if (name || club || handicap) {
        await supabase
          .from('standings')
          .update({
            name: updated.name,
            club: updated.club,
            handicap: updated.handicap
          })
          .eq('name', player.name);
      }

      return res.status(200).json({ success: true, player: { id, ...updated } });
    }

    /* ==========================================================================
       DELETE: Menghapus Atlet
       ========================================================================== */
    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: "ID atlet wajib diberikan!" });

      // Cek apakah atlet ada
      const { data: player, error: checkErr } = await supabase
        .from('players')
        .select('name')
        .eq('id', id)
        .maybeSingle();

      if (checkErr) throw checkErr;
      if (!player) return res.status(404).json({ error: "Atlet tidak ditemukan!" });

      // Hapus data dari standings dulu
      await supabase
        .from('standings')
        .delete()
        .eq('name', player.name);

      // Hapus data atlet
      const { error: deleteErr } = await supabase
        .from('players')
        .delete()
        .eq('id', id);

      if (deleteErr) throw deleteErr;

      return res.status(200).json({ success: true, message: `Atlet ${id} berhasil dihapus.` });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(`Error processing request in api/players.js (${req.method}):`, error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
