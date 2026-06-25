const { supabase } = require('../api/_supabase');

async function check() {
  try {
    const { data, error } = await supabase.from('events').select('participants').eq('id', 'E019').single();
    if (error) {
      console.error(error);
    } else {
      const parsed = typeof data.participants === 'string' ? JSON.parse(data.participants) : data.participants;
      console.log("Full participants list:", parsed);
    }
  } catch (err) {
    console.error(err);
  }
}
check();
