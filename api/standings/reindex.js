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
      return res.status(400).json({ error: 'Parameter year wajib disertakan!' });
    }

    const standingYear = year.toString().trim();

    // 1. Ambil semua standings untuk tahun tersebut, urutkan berdasarkan poin tertinggi
    const { data: allStandings, error: fetchErr } = await supabase
      .from('standings')
      .select('*')
      .eq('year', standingYear)
      .order('points', { ascending: false });

    if (fetchErr) throw fetchErr;

    if (!allStandings || allStandings.length === 0) {
      return res.status(200).json({ success: true, message: `Tidak ada data klasemen untuk tahun ${standingYear} yang perlu di-reindex.` });
    }

    // 2. Beri nomor peringkat (rank) baru secara berurutan
    const rankUpdates = allStandings.map((player, idx) => ({
      name: player.name,
      year: standingYear,
      club: player.club,
      handicap: player.handicap,
      points: player.points,
      played: player.played,
      won: player.won,
      lost: player.lost,
      trend: player.trend,
      boc_points: player.boc_points,
      rank: idx + 1
    }));

    // 3. Upsert kembali ke database Supabase
    const { error: updateErr } = await supabase
      .from('standings')
      .upsert(rankUpdates, { onConflict: 'name,year' });

    if (updateErr) throw updateErr;

    return res.status(200).json({ success: true, message: `Peringkat klasemen tahun ${standingYear} berhasil di-reindex di database Supabase.` });
  } catch (error) {
    console.error('Error re-indexing standings in Supabase:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
