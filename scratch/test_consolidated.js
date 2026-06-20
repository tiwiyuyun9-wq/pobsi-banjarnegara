const standingsHandler = require('../api/standings');

// Mock req and res objects
function createMockResponse(cb) {
  return {
    statusCode: 200,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      cb(null, this.statusCode, data);
    },
    end() {
      cb(null, this.statusCode, null);
    }
  };
}

async function runTests() {
  console.log("=== Test 1: GET standings (year 2026) ===");
  const req1 = {
    method: 'GET',
    query: { year: '2026' },
    url: '/api/standings?year=2026'
  };
  
  await new Promise((resolve) => {
    const res = createMockResponse((err, status, data) => {
      console.log(`Status: ${status}`);
      if (data) {
        console.log(`Success! Found ${data.length} standings entries.`);
      }
      resolve();
    });
    standingsHandler(req1, res);
  });

  console.log("\n=== Test 2: POST reindex (using query action=reindex) ===");
  const req2 = {
    method: 'POST',
    query: { action: 'reindex' },
    body: { year: '2026' },
    url: '/api/standings/reindex'
  };

  await new Promise((resolve) => {
    const res = createMockResponse((err, status, data) => {
      console.log(`Status: ${status}`);
      console.log(`Response:`, data);
      resolve();
    });
    standingsHandler(req2, res);
  });
}

runTests().catch(console.error);
