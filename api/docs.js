const { readLocalDb, fetchCsv } = require('./_utils');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'application/json');

  try {
    const csvUrl = process.env.GOOGLE_SHEET_DOCS_CSV;
    
    if (csvUrl) {
      console.log('Fetching documents from Google Sheets...');
      const docs = await fetchCsv(csvUrl);
      return res.status(200).json(docs);
    } else {
      console.log('Serving documents from local JSON db...');
      const docs = readLocalDb('documents');
      return res.status(200).json(docs);
    }
  } catch (error) {
    console.error('Error fetching documents:', error);
    const fallbackDocs = readLocalDb('documents');
    return res.status(200).json(fallbackDocs);
  }
};
