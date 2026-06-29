const http = require('http');

console.log("Sending request to http://localhost:3000/api/db-status...");
const req = http.get("http://localhost:3000/api/db-status", { timeout: 3000 }, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`BODY: ${data}`);
    process.exit(0);
  });
});

req.on('timeout', () => {
  console.error("Request timed out!");
  req.destroy();
  process.exit(1);
});

req.on('error', (err) => {
  console.error("Error occurred:", err.message);
  process.exit(1);
});
