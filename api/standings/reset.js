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
    // Reset seluruh kolom nilai klasemen di Supabase (menggunakan filter neq name dummy untuk mengupdate seluruh baris)
    const { error } = await supabase
      .from('standings')
      .update({
        points: 0,
        played: 0,
        won: 0,
        lost: 0,
        rank: null,
        boc_points: null
      })
      .neq('name', 'placeholder-value-to-update-all');

    if (error) throw error;

    return res.status(200).json({ success: true, message: "Seluruh klasemen sirkuit BOC berhasil di-reset!" });
  } catch (error) {
    console.error('Error resetting standings in Supabase:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
