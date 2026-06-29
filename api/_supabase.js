const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Warning: SUPABASE_URL atau SUPABASE_KEY tidak terdefinisi di environment variables!');
}

// Inisialisasi Supabase Client
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseKey || 'placeholder-key'
);

const logActivity = async (title, description, type = 'info', icon = 'fa-info') => {
  try {
    const { error } = await supabase
      .from('activity_logs')
      .insert([{
        title: title.trim(),
        description: description.trim(),
        type: type,
        icon: icon
      }]);
    if (error) {
      if (error.message && (error.message.includes('activity_logs') || error.message.includes('cache') || error.message.includes('relation'))) {
        console.warn(`⚠️ Warning: Tabel 'activity_logs' belum dibuat di database Supabase Cloud. Pencatatan cloud "${title}" dilewati.`);
        return;
      }
      throw error;
    }
    console.log(`☁️ Logged cloud activity: ${title} - ${description}`);
  } catch (err) {
    console.error("Gagal mencatat aktivitas ke Supabase:", err.message || err);
  }
};

module.exports = { supabase, logActivity };
