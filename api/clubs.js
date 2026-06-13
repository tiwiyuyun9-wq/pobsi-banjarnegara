const { readLocalDb, fetchCsv } = require('./_utils');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'application/json');

  try {
    const csvUrl = process.env.GOOGLE_SHEET_CLUBS_CSV;
    
    if (csvUrl) {
      console.log('Fetching clubs from Google Sheets...');
      const clubs = await fetchCsv(csvUrl);
      return res.status(200).json(clubs);
    } else {
      console.log('Serving clubs from local JSON db...');
      const clubs = readLocalDb('clubs');
      return res.status(200).json(clubs);
    }
  } catch (error) {
    console.error('Error fetching clubs:', error);
    const fallbackClubs = readLocalDb('clubs');
    return res.status(200).json(fallbackClubs);
  }
};
