const { supabase } = require('./_supabase');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const isSupabaseEnabled = process.env.SUPABASE_URL && process.env.SUPABASE_KEY;
  return res.status(200).json({ database: isSupabaseEnabled ? 'Supabase' : 'SQLite' });
};
