// Seed initial activity logs to Supabase
const http = require('http');

const logs = [
  { title: "Sistem dimulai", description: "Dashboard POBSI Banjarnegara berhasil diinisialisasi", type: "success", icon: "fa-circle-check" },
  { title: "Tabel activity_logs dibuat", description: "Skema database cloud Supabase berhasil diperbarui", type: "info", icon: "fa-database" },
  { title: "Konsolidasi API selesai", description: "Endpoint serverless dioptimasi untuk deployment Vercel", type: "info", icon: "fa-server" }
];

async function seedLog(log) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(log);
    const options = {
      hostname: 'localhost', port: 3000,
      path: '/api/misc?action=activity-logs',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': data.length },
      timeout: 5000
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        console.log(`  [${res.statusCode}] ${log.title}: ${body.substring(0, 80)}`);
        resolve();
      });
    });
    req.on('error', e => { console.error(`  ❌ ${log.title}: ${e.message}`); reject(e); });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(data);
    req.end();
  });
}

(async () => {
  console.log("🌱 Seeding activity logs...");
  for (const log of logs) {
    try { await seedLog(log); } catch(e) { /* skip */ }
  }
  console.log("✅ Done!");
  
  // Verify
  http.get('http://localhost:3000/api/misc?action=activity-logs&limit=5', (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      const parsed = JSON.parse(d);
      console.log(`\n📊 Verifikasi: ${parsed.length} log ditemukan di database:`);
      parsed.forEach(l => console.log(`  - [${l.type}] ${l.title}: ${l.description}`));
      process.exit(0);
    });
  });
})();
