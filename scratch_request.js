const http = require('http');

http.get('http://localhost:3000/api/events', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const events = JSON.parse(data);
      console.log("Response status:", res.statusCode);
      console.log("Response events count:", events.length);
      console.log("Events IDs:", events.map(e => e.id));
      if (events.length > 0) {
        console.log("Last event:", events[events.length - 1]);
      }
    } catch (e) {
      console.error("Parse error:", e);
      console.log("Raw response:", data);
    }
  });
}).on('error', (err) => {
  console.error("HTTP error:", err);
});
