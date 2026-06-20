const http = require('http');

function postEvent() {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      title: "Grand Final Battle of Champions 2026",
      date: "2026-12-27",
      venue: "JP BILLIARD",
      prizePool: "Rp 15.000.000",
      entryFee: "Rp 150.000",
      contact: "POBSI Committee",
      status: "Daftar",
      description: "Turnamen Puncak Grand Final Battle of Champions",
      type: "Battle of Champions (BOC)",
      elimination_type: "boc",
      bracket_size: "16",
      participants: []
    });

    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/events',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log("POST status:", res.statusCode);
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error("POST parse error: " + data));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function putEvent(id) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      title: "Grand Final Battle of Champions 2026 (Updated)",
      date: "2026-12-27",
      venue: "JP BILLIARD",
      prizePool: "Rp 15.000.000",
      entryFee: "Rp 150.000",
      contact: "POBSI Committee",
      status: "Daftar",
      description: "Turnamen Puncak Grand Final Battle of Champions (Updated)",
      type: "Battle of Champions (BOC)",
      elimination_type: "boc",
      bracket_size: "16",
      participants: []
    });

    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/events/${id}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log("PUT status:", res.statusCode);
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error("PUT parse error: " + data));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  try {
    console.log("Starting simulation...");
    const created = await postEvent();
    console.log("Created Event:", created);
    if (created && created.id) {
      console.log(`Sending PUT to /api/events/${created.id}...`);
      const updated = await putEvent(created.id);
      console.log("PUT Response:", updated);
    }
  } catch (err) {
    console.error("Simulation failed:", err);
  }
}

run();
