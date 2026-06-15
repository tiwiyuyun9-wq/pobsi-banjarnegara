const { supabase } = require('../_supabase');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, currentPassword, newPassword } = req.body;

    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Seluruh kolom kata sandi wajib diisi!' });
    }

    // Verify current password
    const { data: user, error: verifyError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', currentPassword)
      .maybeSingle();

    if (verifyError) {
      console.error('Error verifying password:', verifyError);
      return res.status(500).json({ error: 'Kegagalan database saat verifikasi sandi!' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Kata sandi saat ini salah!' });
    }

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: newPassword })
      .eq('username', username);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return res.status(500).json({ error: 'Gagal memperbarui kata sandi baru ke database!' });
    }

    return res.status(200).json({ success: true, message: 'Kata sandi berhasil diperbarui!' });
  } catch (error) {
    console.error('Error in change-password handler:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
