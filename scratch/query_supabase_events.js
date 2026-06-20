const { supabase } = require('../api/_supabase');

async function check() {
  console.log("Querying Supabase events...");
  try {
    const { data, error } = await supabase.from('events').select('id, title, status, elimination_type');
    if (error) {
      console.error("Supabase Error:", error);
    } else {
      console.log("Supabase Events count:", data.length);
      console.log("Supabase Events list:", data);
    }
  } catch (err) {
    console.error("Exception:", err);
  }
}
check();
