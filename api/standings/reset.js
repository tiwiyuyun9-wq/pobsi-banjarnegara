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
    const { year } = req.body;
    if (!year) {
      return res.status(400).json({ error: "Tahun (year) wajib ditentukan untuk melakukan reset!" });
    }

    // Reset standings columns in Supabase for the specific year
    const { error: resetErr } = await supabase
      .from('standings')
      .update({
        points: 0,
        played: 0,
        won: 0,
        lost: 0,
        rank: null,
        boc_points: null
      })
      .eq('year', year.toString());

    if (resetErr) throw resetErr;

    // Hapus seluruh sirkuit untuk tahun tersebut
    const { error: deleteErr } = await supabase
      .from('boc_sirkuits')
      .delete()
      .eq('year', year.toString());

    if (deleteErr) throw deleteErr;

    return res.status(200).json({ success: true, message: `Seluruh klasemen sirkuit BOC tahun ${year} berhasil di-reset!` });
  } catch (error) {
    console.error('Error resetting standings in Supabase:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
