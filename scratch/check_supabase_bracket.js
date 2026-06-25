require('dotenv').config();
const { supabase } = require('../api/_supabase');

async function checkBracket() {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .ilike('name', '%Hendik%');

  if (error) {
    console.error("Supabase error:", error);
  } else {
    console.log("Supabase players found matching Hendik:", data);
  }
}

checkBracket();
