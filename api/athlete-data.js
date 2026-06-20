const { supabase } = require('./_supabase');

/**
 * Consolidated serverless function for athlete detail data.
 * Combines matches, tournament-history, handicap-history, and ranking-history
 * into a single endpoint to stay within Vercel Hobby plan's 12-function limit.
 *
 * Usage: /api/athlete-data?type=matches&playerId=P011
 *        /api/athlete-data?type=tournament-history&playerId=P011
 *        /api/athlete-data?type=handicap-history&playerId=P011
 *        /api/athlete-data?type=ranking-history&playerId=P011
 */
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

  const { type, playerId } = req.query;

  if (!type) {
    return res.status(400).json({ error: 'Missing required query parameter: type (matches | tournament-history | handicap-history | ranking-history)' });
  }

  try {
    let tableName, orderCol, orderAsc;

    switch (type) {
      case 'matches':
        tableName = 'matches';
        orderCol = 'id';
        orderAsc = false;
        break;
      case 'tournament-history':
        tableName = 'tournament_history';
        orderCol = 'id';
        orderAsc = false;
        break;
      case 'handicap-history':
        tableName = 'handicap_history';
        orderCol = 'id';
        orderAsc = false;
        break;
      case 'ranking-history':
        tableName = 'ranking_history';
        orderCol = 'id';
        orderAsc = true;
        break;
      default:
        return res.status(400).json({ error: `Unknown type: ${type}. Valid types: matches, tournament-history, handicap-history, ranking-history` });
    }

    let query = supabase.from(tableName).select('*');
    if (playerId) {
      query = query.eq('player_id', playerId);
    }
    query = query.order(orderCol, { ascending: orderAsc });

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json(data || []);
  } catch (error) {
    console.error(`Error fetching ${type} from Supabase:`, error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
