const { readLocalDb, fetchCsv } = require('./_utils');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'application/json');

  try {
    const csvUrl = process.env.GOOGLE_SHEET_STANDINGS_CSV;
    
    if (csvUrl) {
      console.log('Fetching standings from Google Sheets...');
      const standings = await fetchCsv(csvUrl);
      
      // Sort standings by rank or points (descending)
      const sorted = standings.sort((a, b) => {
        // Fallback to sort by rank (rank 1 is highest)
        const rankA = parseInt(a.rank || 999, 10);
        const rankB = parseInt(b.rank || 999, 10);
        return rankA - rankB;
      });
      
      return res.status(200).json(sorted);
    } else {
      console.log('Serving standings from local JSON db...');
      const standings = readLocalDb('standings');
      return res.status(200).json(standings);
    }
  } catch (error) {
    console.error('Error fetching standings:', error);
    const fallbackStandings = readLocalDb('standings');
    return res.status(200).json(fallbackStandings);
  }
};
