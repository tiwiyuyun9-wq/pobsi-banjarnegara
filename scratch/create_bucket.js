const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ SUPABASE_URL or SUPABASE_KEY is missing from environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Checking storage buckets...");
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error("❌ Error listing buckets:", listError.message);
      console.error("Full list error details:", listError);
    } else {
      console.log("Current buckets:", buckets.map(b => b.name));
      const hasMedia = buckets.some(b => b.name === 'media');
      if (hasMedia) {
        console.log("✅ Bucket 'media' already exists.");
        return;
      }
    }

    console.log("Creating public bucket 'media'...");
    const { data, error } = await supabase.storage.createBucket('media', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf'],
      fileSizeLimit: 10485760 // 10MB
    });

    if (error) {
      console.error("❌ Error creating bucket:", error.message);
      console.error("Full error details:", error);
    } else {
      console.log("✅ Successfully created bucket 'media'!", data);
    }
  } catch (err) {
    console.error("❌ Exception occurred:", err);
  }
}

run();
