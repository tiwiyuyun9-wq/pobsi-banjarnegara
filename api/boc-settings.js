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

  try {
    /* ==========================================================================
       GET: Mengambil Settings BOC untuk Tahun Tertentu
       ========================================================================== */
    if (req.method === 'GET') {
      const { year } = req.query;
      if (!year) {
        return res.status(400).json({ error: "Parameter year wajib disertakan!" });
      }

      const { data, error } = await supabase
        .from('boc_settings')
        .select('*')
        .eq('year', year.toString())
        .maybeSingle();

      if (error) throw error;

      // Kembalikan settings, atau default jika belum ada
      if (data) {
        // Parse JSON fields
        const result = { ...data };
        try { result.playoff_schedule = result.playoff_schedule ? JSON.parse(result.playoff_schedule) : null; } catch (e) {}
        try { result.prizes = result.prizes ? JSON.parse(result.prizes) : null; } catch (e) {}
        return res.status(200).json(result);
      } else {
        // Return defaults
        return res.status(200).json({
          year: year.toString(),
          cutoff_limit: 16,
          max_handicap: 'Bebas',
          playoff_schedule: null,
          prizes: null,
          rules: null,
          status: 'active'
        });
      }
    }

    /* ==========================================================================
       POST: Menyimpan / Memperbarui Settings BOC untuk Tahun Tertentu
       ========================================================================== */
    if (req.method === 'POST') {
      const { year, cutoff_limit, max_handicap, playoff_schedule, prizes, rules, status } = req.body;
      if (!year) {
        return res.status(400).json({ error: "Parameter year wajib disertakan!" });
      }

      const upsertData = {
        year: year.toString(),
        cutoff_limit: cutoff_limit != null ? parseInt(cutoff_limit) : 16,
        max_handicap: max_handicap || 'Bebas',
        playoff_schedule: playoff_schedule ? (typeof playoff_schedule === 'object' ? JSON.stringify(playoff_schedule) : playoff_schedule) : null,
        prizes: prizes ? (typeof prizes === 'object' ? JSON.stringify(prizes) : prizes) : null,
        rules: rules || null,
        status: status || 'active'
      };

      const { data, error } = await supabase
        .from('boc_settings')
        .upsert(upsertData, { onConflict: 'year' })
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({ success: true, message: `Settings BOC tahun ${year} berhasil disimpan!`, data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(`Error processing request in api/boc-settings.js (${req.method}):`, error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
