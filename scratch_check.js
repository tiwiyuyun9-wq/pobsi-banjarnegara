const { supabase } = require('./api/_supabase');

async function check() {
  console.log("=== Querying Supabase events ===");
  const { data: events, error: err1 } = await supabase
    .from('events')
    .select('id, title, poster, elimination_type')
    .eq('elimination_type', 'boc');
  
  if (err1) console.error("Events error:", err1);
  else console.log("BOC Events:", events);

  console.log("=== Querying Supabase boc_settings ===");
  const { data: settings, error: err2 } = await supabase
    .from('boc_settings')
    .select('year, cover');

  if (err2) console.error("Settings error:", err2);
  else console.log("BOC Settings:", settings);
}

check();
