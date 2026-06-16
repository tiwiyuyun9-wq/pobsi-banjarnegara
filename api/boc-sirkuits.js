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
       GET: Mengambil Daftar Sirkuit untuk Tahun Tertentu
       ========================================================================== */
    if (req.method === 'GET') {
      const { year } = req.query;
      if (!year) {
        return res.status(400).json({ error: "Parameter year wajib disertakan!" });
      }

      const { data: sirkuits, error } = await supabase
        .from('boc_sirkuits')
        .select('name')
        .eq('year', year.toString())
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // Kembalikan array string nama sirkuit
      return res.status(200).json(sirkuits.map(s => s.name));
    }

    /* ==========================================================================
       POST: Mengupdate / Menyimpan Seluruh Sirkuit untuk Tahun Tertentu
       ========================================================================== */
    if (req.method === 'POST') {
      const { year, sirkuits } = req.body;
      if (!year || !Array.isArray(sirkuits)) {
        return res.status(400).json({ error: "Parameter year dan sirkuits (array) wajib disertakan!" });
      }

      // 1. Hapus seluruh sirkuit untuk tahun tersebut
      const { error: deleteErr } = await supabase
        .from('boc_sirkuits')
        .delete()
        .eq('year', year.toString());

      if (deleteErr) throw deleteErr;

      // 2. Insert sirkuit baru jika ada
      if (sirkuits.length > 0) {
        const insertData = sirkuits.map((name, idx) => ({
          year: year.toString(),
          name: name.trim(),
          sort_order: idx
        }));

        const { error: insertErr } = await supabase
          .from('boc_sirkuits')
          .insert(insertData);

        if (insertErr) throw insertErr;
      }

      return res.status(200).json({ success: true, message: `Daftar sirkuit BOC tahun ${year} berhasil diperbarui!` });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(`Error processing request in api/boc-sirkuits.js (${req.method}):`, error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
