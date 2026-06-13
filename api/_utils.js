const fs = require('fs');
const path = require('path');
const https = require('https');

// Membaca data dari database JSON lokal (db.json)
function readLocalDb(key) {
  try {
    const filePath = path.join(process.cwd(), 'api', 'db.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data[key] || [];
  } catch (error) {
    console.error(`Error reading local db for ${key}:`, error);
    return [];
  }
}

// Fetch CSV dari URL Google Sheets yang di-publish ke web
function fetchCsv(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch Google Sheets CSV: Status ${res.statusCode}`));
        return;
      }
      
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(parseCsv(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Parser CSV kustom yang kuat (mendukung kolom kutip dan koersi angka)
function parseCsv(csvText) {
  const lines = csvText.split(/\r?\n/);
  if (lines.length === 0 || !lines[0]) return [];
  
  // Baris pertama adalah nama kolom (Headers)
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const results = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    
    if (values.length >= headers.length) {
      const obj = {};
      headers.forEach((header, index) => {
        let val = values[index];
        if (val === undefined || val === null) {
          obj[header] = "";
          return;
        }
        
        // Bersihkan spasi luar
        val = val.trim();
        
        // Koersi tipe data otomatis
        if (val === "true") {
          obj[header] = true;
        } else if (val === "false") {
          obj[header] = false;
        } else if (val !== "" && !isNaN(val)) {
          obj[header] = val.includes('.') ? parseFloat(val) : parseInt(val, 10);
        } else {
          obj[header] = val;
        }
      });
      results.push(obj);
    }
  }
  return results;
}

module.exports = {
  readLocalDb,
  fetchCsv
};
