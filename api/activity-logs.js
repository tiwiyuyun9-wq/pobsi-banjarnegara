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
       GET: Mengambil Riwayat Aktivitas
       ========================================================================== */
    if (req.method === 'GET') {
      const { limit } = req.query;
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(parseInt(limit, 10));
      }

      const { data: logs, error } = await query;
      if (error) {
        if (error.message && (error.message.includes('activity_logs') || error.message.includes('cache') || error.message.includes('relation'))) {
          console.warn("⚠️ Warning: Tabel 'activity_logs' belum dibuat di database Supabase Cloud. Menampilkan log default.");
          return res.status(200).json([]);
        }
        throw error;
      }
      return res.status(200).json(logs || []);
    }

    /* ==========================================================================
       POST: Menambahkan Log Aktivitas Baru
       ========================================================================== */
    if (req.method === 'POST') {
      const { title, description, type, icon } = req.body;
      if (!title || !description) {
        return res.status(400).json({ error: "Judul dan deskripsi log wajib diisi!" });
      }

      const newLog = {
        title: title.trim(),
        description: description.trim(),
        type: type || 'info',
        icon: icon || 'fa-info'
      };

      const { data: insertedLog, error } = await supabase
        .from('activity_logs')
        .insert([newLog])
        .select()
        .single();

      if (error) {
        if (error.message && (error.message.includes('activity_logs') || error.message.includes('cache') || error.message.includes('relation'))) {
          console.warn(`⚠️ Warning: Tabel 'activity_logs' belum dibuat di database Supabase Cloud. Log "${title}" diabaikan.`);
          return res.status(201).json({ id: Date.now(), ...newLog, created_at: new Date().toISOString() });
        }
        throw error;
      }
      return res.status(201).json(insertedLog);
    }

    return res.status(405).json({ error: "Method tidak diizinkan!" });
  } catch (error) {
    console.error("Kesalahan API Activity Logs:", error);
    return res.status(500).json({ error: "Kesalahan server internal: " + error.message });
  }
};
