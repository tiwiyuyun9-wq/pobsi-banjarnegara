const { readLocalDb, fetchCsv } = require('./_utils');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'application/json');

  try {
    const csvUrl = process.env.GOOGLE_SHEET_EVENTS_CSV;
    
    if (csvUrl) {
      console.log('Fetching events from Google Sheets...');
      const events = await fetchCsv(csvUrl);
      return res.status(200).json(events);
    } else {
      console.log('Serving events from local JSON db...');
      const events = readLocalDb('events');
      return res.status(200).json(events);
    }
  } catch (error) {
    console.error('Error fetching events:', error);
    const fallbackEvents = readLocalDb('events');
    return res.status(200).json(fallbackEvents);
  }
};
