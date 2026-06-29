const http = require('http');

const data = JSON.stringify({
  title: "Uji Coba",
  description: "Mendeteksi database cloud Supabase",
  type: "success",
  icon: "fa-circle-check"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/activity-logs',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  },
  timeout: 3000
};

console.log("Sending POST request to http://localhost:3000/api/activity-logs...");
const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let responseData = '';
  res.on('data', chunk => responseData += chunk);
  res.on('end', () => {
    console.log(`BODY: ${responseData}`);
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

req.write(data);
req.end();
