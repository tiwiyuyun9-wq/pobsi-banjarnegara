const { readLocalDb, fetchCsv } = require('./_utils');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'application/json');

  try {
    const csvUrl = process.env.GOOGLE_SHEET_PLAYERS_CSV;
    
    if (csvUrl) {
      // Jika environment variable Google Sheets terpasang, ambil data dari cloud
      console.log('Fetching players from Google Sheets...');
      const players = await fetchCsv(csvUrl);
      return res.status(200).json(players);
    } else {
      // Fallback ke database JSON lokal bawaan
      console.log('Serving players from local JSON db...');
      const players = readLocalDb('players');
      return res.status(200).json(players);
    }
  } catch (error) {
    console.error('Error fetching players:', error);
    // Jika ada kegagalan fetch remote, lakukan gracefully fallback ke local db
    const fallbackPlayers = readLocalDb('players');
    return res.status(200).json(fallbackPlayers);
  }
};
