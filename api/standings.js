const { supabase } = require('./_supabase');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { year, action } = req.query;
  const isReset = action === 'reset' || req.url.includes('/reset');
  const isReindex = action === 'reindex' || req.url.includes('/reindex');

  try {
    /* ==========================================================================
       1. Action: RESET Standings & Sirkuits
       ========================================================================== */
    if (isReset) {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const { year: resetYear } = req.body;
      if (!resetYear) {
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
        .eq('year', resetYear.toString());

      if (resetErr) throw resetErr;

      // Hapus seluruh sirkuit untuk tahun tersebut
      const { error: deleteErr } = await supabase
        .from('boc_sirkuits')
        .delete()
        .eq('year', resetYear.toString());

      if (deleteErr) throw deleteErr;

      return res.status(200).json({ success: true, message: `Seluruh klasemen sirkuit BOC tahun ${resetYear} berhasil di-reset!` });
    }

    /* ==========================================================================
       2. Action: REINDEX Standings ranks
       ========================================================================== */
    if (isReindex) {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const { year: reindexYear } = req.body;
      if (!reindexYear) {
        return res.status(400).json({ error: 'Parameter year wajib disertakan!' });
      }

      const standingYear = reindexYear.toString().trim();

      // Ambil semua standings untuk tahun tersebut, urutkan berdasarkan poin tertinggi
      const { data: allStandings, error: fetchErr } = await supabase
        .from('standings')
        .select('*')
        .eq('year', standingYear)
        .order('points', { ascending: false });

      if (fetchErr) throw fetchErr;

      if (!allStandings || allStandings.length === 0) {
        return res.status(200).json({ success: true, message: `Tidak ada data klasemen untuk tahun ${standingYear} yang perlu di-reindex.` });
      }

      // Beri nomor peringkat (rank) baru secara berurutan
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

      // Upsert kembali ke database Supabase
      const { error: updateErr } = await supabase
        .from('standings')
        .upsert(rankUpdates, { onConflict: 'name,year' });

      if (updateErr) throw updateErr;

      return res.status(200).json({ success: true, message: `Peringkat klasemen tahun ${standingYear} berhasil di-reindex di database Supabase.` });
    }

    /* ==========================================================================
       3. GET: Mengambil Klasemen Standings
       ========================================================================== */
    if (req.method === 'GET') {
      let query = supabase
        .from('standings')
        .select('*');

      if (year) {
        query = query.eq('year', year.toString());
      }

      const { data: standings, error } = await query.order('points', { ascending: false });

      if (error) throw error;

      return res.status(200).json(standings);
    }

    /* ==========================================================================
       4. POST: Menambahkan/Mengupdate Klasemen (Upsert)
       ========================================================================== */
    if (req.method === 'POST') {
      const { name, year: postYear, club, handicap, points, played, won, lost, boc_points } = req.body;
      if (!name || !club || !handicap || points === undefined) {
        return res.status(400).json({ error: "Nama, klub, handicap, dan poin wajib diisi!" });
      }

      const standingYear = (postYear || '2026').toString().trim();

      const newStanding = {
        name: name.trim(),
        year: standingYear,
        club: club.trim(),
        handicap: handicap.toString().trim(),
        points: parseInt(points, 10),
        played: parseInt(played || 0, 10),
        won: parseInt(won || 0, 10),
        lost: parseInt(lost || 0, 10),
        trend: "stable",
        boc_points: boc_points ? (typeof boc_points === 'object' ? JSON.stringify(boc_points) : boc_points) : null
      };

      // Upsert ke Supabase menggunakan composite primary key 'name, year'
      const { error: upsertErr } = await supabase
        .from('standings')
        .upsert([newStanding], { onConflict: 'name,year' });

      if (upsertErr) throw upsertErr;

      const skipRank = req.query.skipRank === 'true';
      if (!skipRank) {
        // Hitung ulang peringkat (rank) untuk seluruh atlet berdasarkan poin tertinggi di tahun bersangkutan
        const { data: allStandings, error: fetchErr } = await supabase
          .from('standings')
          .select('*')
          .eq('year', standingYear)
          .order('points', { ascending: false });

        if (fetchErr) throw fetchErr;

        // Update rank secara massal (bulk upsert) untuk performa instan
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

        const { error: updateErr } = await supabase
          .from('standings')
          .upsert(rankUpdates, { onConflict: 'name,year' });

        if (updateErr) throw updateErr;
      }

      return res.status(201).json(newStanding);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(`Error processing request in api/standings.js (${req.method}):`, error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
