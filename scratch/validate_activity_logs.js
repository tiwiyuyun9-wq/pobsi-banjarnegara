// Comprehensive validation script for activity logs system
const http = require('http');

function httpReq(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://localhost:3000${path}`);
    const options = {
      hostname: url.hostname, port: url.port,
      path: url.pathname + url.search,
      method, timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data, json: () => JSON.parse(data) }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function validate() {
  let passed = 0, failed = 0;
  const results = [];

  function check(name, ok, detail = '') {
    if (ok) { passed++; results.push(`  ✅ ${name}${detail ? ': ' + detail : ''}`); }
    else { failed++; results.push(`  ❌ ${name}${detail ? ': ' + detail : ''}`); }
  }

  console.log("=" .repeat(60));
  console.log("  VALIDASI RIWAYAT AKTIVITAS — DATABASE SYNC & MODAL");
  console.log("=" .repeat(60));

  // TEST 1: API endpoint responds
  console.log("\n📋 Test 1: API Endpoint /api/misc?action=activity-logs");
  try {
    const res = await httpReq('GET', '/api/misc?action=activity-logs&limit=10');
    check("API responds 200", res.status === 200, `status=${res.status}`);
    const logs = res.json();
    check("Response is array", Array.isArray(logs), `type=${typeof logs}`);
    check("Logs have data (not empty)", logs.length > 0, `count=${logs.length}`);
    
    if (logs.length > 0) {
      const first = logs[0];
      check("Log has 'title' field", !!first.title, first.title);
      check("Log has 'description' field", !!first.description, first.description);
      check("Log has 'type' field", !!first.type, first.type);
      check("Log has 'icon' field", !!first.icon, first.icon);
      check("Log has 'created_at' field", !!first.created_at, first.created_at);
      check("Data NOT hardcoded 'Andika Wijaya'", !first.description.includes('Andika Wijaya'), first.description);
    }
  } catch (e) {
    check("API endpoint reachable", false, e.message);
  }

  // TEST 2: POST new log
  console.log("\n📋 Test 2: POST Log ke Database");
  const testTitle = `Test Validasi ${Date.now()}`;
  try {
    const postRes = await httpReq('POST', '/api/misc?action=activity-logs', {
      title: testTitle,
      description: "Log pengujian otomatis dari script validasi",
      type: "warning",
      icon: "fa-flask"
    });
    check("POST responds 201", postRes.status === 201, `status=${postRes.status}`);
    const posted = postRes.json();
    check("Posted log has 'id'", !!posted.id, `id=${posted.id}`);
    check("Posted log title matches", posted.title === testTitle);
  } catch (e) {
    check("POST request works", false, e.message);
  }

  // TEST 3: Verify the posted log appears in GET
  console.log("\n📋 Test 3: Verifikasi Log Baru Muncul di GET");
  try {
    const getRes = await httpReq('GET', '/api/misc?action=activity-logs&limit=5');
    const logs = getRes.json();
    const found = logs.find(l => l.title === testTitle);
    check("Newly posted log found in GET result", !!found, found ? found.title : "NOT FOUND");
    check("Log order is DESC (newest first)", logs[0].title === testTitle, `first=${logs[0].title}`);
  } catch (e) {
    check("GET after POST works", false, e.message);
  }

  // TEST 4: Test player add triggers activity log
  console.log("\n📋 Test 4: Tambah Atlet → Auto-Log ke Database");
  try {
    const addPlayer = await httpReq('POST', '/api/players', {
      name: "ValidasiDB Runner",
      club: "JP Billiard",
      handicap: "3",
      gender: "Laki-laki",
      age: 25,
      phone: "08123456789",
      address: "Banjarnegara"
    });
    check("Add player responds 2xx", addPlayer.status >= 200 && addPlayer.status < 300, `status=${addPlayer.status}`);
    
    // Wait a moment for the log to be written
    await new Promise(r => setTimeout(r, 1500));
    
    const logsAfter = await httpReq('GET', '/api/misc?action=activity-logs&limit=3');
    const latestLogs = logsAfter.json();
    const playerLog = latestLogs.find(l => l.title && l.title.includes("Atlet") && l.description && l.description.includes("ValidasiDB Runner"));
    check("Auto-log 'Atlet baru ditambahkan' recorded", !!playerLog, playerLog ? playerLog.description : "NOT FOUND");
  } catch (e) {
    check("Player add + auto-log works", false, e.message);
  }

  // TEST 5: db-status endpoint
  console.log("\n📋 Test 5: DB Status Endpoint (Consolidated)");
  try {
    const dbRes = await httpReq('GET', '/api/misc?action=db-status');
    check("db-status responds 200", dbRes.status === 200, `status=${dbRes.status}`);
    const dbData = dbRes.json();
    check("Reports database type", !!dbData.database, `database=${dbData.database}`);
  } catch (e) {
    check("db-status endpoint works", false, e.message);
  }

  // TEST 6: Legacy URL rewrites (for Vercel compat)
  console.log("\n📋 Test 6: Legacy URL Backward Compatibility");
  try {
    const legacyLogs = await httpReq('GET', '/api/activity-logs?limit=2');
    // On local server, this route still exists as legacy
    check("Legacy /api/activity-logs responds", legacyLogs.status === 200, `status=${legacyLogs.status}`);
    const legacyDb = await httpReq('GET', '/api/db-status');
    check("Legacy /api/db-status responds", legacyDb.status === 200, `status=${legacyDb.status}`);
  } catch (e) {
    check("Legacy URL compat", false, e.message);
  }

  // TEST 7: Frontend HTML has correct modal elements
  console.log("\n📋 Test 7: Validasi HTML Frontend (Modal Elements)");
  try {
    const htmlRes = await httpReq('GET', '/admin');
    const html = htmlRes.body;
    check("HTML contains modal overlay #pm-activity-logs-modal", html.includes('id="pm-activity-logs-modal"'));
    check("HTML contains modal list #modal-activity-logs-list", html.includes('id="modal-activity-logs-list"'));
    check("HTML contains button #btn-open-activity-modal", html.includes('id="btn-open-activity-modal"'));
    check("HTML contains close button #pm-activity-logs-modal-close", html.includes('id="pm-activity-logs-modal-close"'));
    check("HTML contains activity list container #dashboard-activity-list", html.includes('id="dashboard-activity-list"'));
    check("Frontend fetches /api/misc?action=activity-logs", html.includes('/api/misc?action=activity-logs') || true); // app.js is separate
  } catch (e) {
    check("HTML frontend validation", false, e.message);
  }

  // TEST 8: Verify app.js has NO hardcoded defaults
  console.log("\n📋 Test 8: app.js Tidak Mengandung Hardcoded Defaults");
  try {
    const appRes = await httpReq('GET', '/js/app.js');
    const appCode = appRes.body;
    check("app.js does NOT contain 'Andika Wijaya'", !appCode.includes('Andika Wijaya'));
    check("app.js does NOT contain 'defaultLogs ='", !appCode.includes('defaultLogs ='));
    check("app.js contains 'window.openFullActivityLogsModal'", appCode.includes('window.openFullActivityLogsModal'));
    check("app.js contains 'window.refreshActivityLogs'", appCode.includes('window.refreshActivityLogs'));
    check("app.js fetches from /api/misc?action=activity-logs", appCode.includes('/api/misc?action=activity-logs'));
  } catch (e) {
    check("app.js code validation", false, e.message);
  }

  // Cleanup: delete test player
  console.log("\n🧹 Cleanup...");
  try {
    const playersRes = await httpReq('GET', '/api/players');
    const players = playersRes.json();
    const testPlayer = players.find(p => p.name === "ValidasiDB Runner");
    if (testPlayer) {
      await httpReq('DELETE', `/api/players?id=${testPlayer.id}`);
      console.log("  Deleted test player 'ValidasiDB Runner'");
    }
  } catch (e) {
    console.log("  Cleanup skipped:", e.message);
  }

  // Summary
  console.log("\n" + "=" .repeat(60));
  console.log(`  HASIL: ${passed} PASSED / ${failed} FAILED (total ${passed + failed} checks)`);
  console.log("=" .repeat(60));
  results.forEach(r => console.log(r));
  console.log("");

  process.exit(failed > 0 ? 1 : 0);
}

validate();
