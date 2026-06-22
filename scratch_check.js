const { supabase } = require('./api/_supabase');

async function check() {
  console.log("=== Querying Supabase event E019 ===");
  const { data: event, error: err } = await supabase
    .from('events')
    .select('id, title, status, results, bracket')
    .eq('id', 'E019')
    .single();
  
  if (err) {
    console.error("Supabase error:", err);
  } else if (!event) {
    console.log("Supabase Event E019 not found");
  } else {
    console.log("Supabase Event E019 found:");
    console.log("Title:", event.title);
    console.log("Status:", event.status);
    console.log("Results:", event.results);
    try {
      const br = typeof event.bracket === 'string' ? JSON.parse(event.bracket || '{}') : event.bracket;
      console.log("Bracket phase:", br.phase);
      console.log("Bracket mainBracket[6] (Final):", br.mainBracket ? br.mainBracket['6'] : null);
      console.log("Bracket thirdPlace:", br.thirdPlace);
    } catch (e) {
      console.log("Bracket parse error:", e);
    }
  }
}

check();
