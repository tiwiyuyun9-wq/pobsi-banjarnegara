const { supabase } = require('../_supabase');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Fetch users list (excl password)
      const { data: users, error } = await supabase
        .from('users')
        .select('username, role, fullname')
        .order('role');

      if (error) {
        console.error('Error fetching users from Supabase:', error);
        return res.status(500).json({ error: 'Gagal memuat daftar pengguna!' });
      }
      return res.status(200).json(users);
    } 
    
    if (req.method === 'POST') {
      const { username, password, fullname, role } = req.body;
      if (!username || !password || !fullname || !role) {
        return res.status(400).json({ error: 'Seluruh input wajib diisi!' });
      }

      // Check if user already exists
      const { data: existing, error: existError } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (existError) {
        console.error('Error checking existing user:', existError);
        return res.status(500).json({ error: 'Gagal mengecek ketersediaan username!' });
      }

      if (existing) {
        return res.status(400).json({ error: 'Username sudah digunakan oleh akun lain!' });
      }

      // Insert new admin user
      const { error: insertError } = await supabase
        .from('users')
        .insert([{ username, password, role, fullname }]);

      if (insertError) {
        console.error('Error inserting user:', insertError);
        return res.status(500).json({ error: 'Gagal menyimpan akun baru ke database!' });
      }

      return res.status(200).json({ success: true, message: 'Akun pengelola berhasil dibuat!' });
    }

    if (req.method === 'DELETE') {
      const { username } = req.query;
      if (!username) {
        return res.status(400).json({ error: 'Parameter username tidak valid!' });
      }

      if (username === 'superadmin') {
        return res.status(400).json({ error: 'Akun "superadmin" utama bawaan tidak boleh dihapus demi keamanan!' });
      }

      // Delete user
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('username', username);

      if (deleteError) {
        console.error('Error deleting user:', deleteError);
        return res.status(500).json({ error: 'Gagal menghapus akun pengelola dari database!' });
      }

      return res.status(200).json({ success: true, message: 'Akun pengelola berhasil dihapus!' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in users handler:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
