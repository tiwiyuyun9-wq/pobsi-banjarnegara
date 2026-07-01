const { supabase } = require('./_supabase');
const { uploadBrandingMedia } = require('./_media-upload');

/**
 * Consolidated serverless function for miscellaneous endpoints.
 * Combines activity-logs and db-status into a single Vercel serverless function
 * to stay within the Hobby plan's 12-function limit.
 *
 * Usage:
 *   /api/misc?action=db-status
 *   /api/misc?action=activity-logs&limit=5
 *   POST /api/misc?action=activity-logs  { title, description, type, icon }
 */
module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  if (!action) {
    return res.status(400).json({ error: 'Missing required query parameter: action (db-status | activity-logs)' });
  }

  try {
    /* ==========================================================================
       ACTION: db-status
       ========================================================================== */
    if (action === 'db-status') {
      const isSupabaseEnabled = process.env.SUPABASE_URL && process.env.SUPABASE_KEY;
      return res.status(200).json({ database: isSupabaseEnabled ? 'Supabase' : 'SQLite' });
    }

    /* ==========================================================================
       ACTION: activity-logs
       ========================================================================== */
    if (action === 'activity-logs') {
      // GET: Mengambil Riwayat Aktivitas
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

      // POST: Menambahkan Log Aktivitas Baru
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
    }

    /* ==========================================================================
       ACTION: upload-branding
       ========================================================================== */
    if (action === 'upload-branding') {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method tidak diizinkan! Gunakan POST." });
      }

      const { type, fileData } = req.body;
      if (!type || !fileData) {
        return res.status(400).json({ error: "Parameter type dan fileData wajib dikirimkan!" });
      }

      if (type !== 'logo' && type !== 'favicon') {
        return res.status(400).json({ error: "Parameter type harus berupa 'logo' atau 'favicon'!" });
      }

      const fileUrl = await uploadBrandingMedia(fileData, type);
      return res.status(200).json({ success: true, url: fileUrl });
    }

    return res.status(400).json({ error: `Unknown action: ${action}. Valid actions: db-status, activity-logs, upload-branding` });
  } catch (error) {
    console.error(`Error in api/misc.js (action=${action}, method=${req.method}):`, error);
    return res.status(500).json({ error: "Kesalahan server internal: " + error.message });
  }
};
