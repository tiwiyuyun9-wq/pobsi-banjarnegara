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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { playerId } = req.query;

  try {
    let query = supabase.from('ranking_history').select('*');
    if (playerId) {
      query = query.eq('player_id', playerId);
    }
    
    // Sort by id ascending to draw from left to right chronologically
    query = query.order('id', { ascending: true });

    const { data: history, error } = await query;
    if (error) throw error;

    return res.status(200).json(history || []);
  } catch (error) {
    console.error('Error fetching ranking history from Supabase:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
