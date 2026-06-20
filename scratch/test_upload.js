const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
  const dummyBuffer = Buffer.from('hello world from dummy file');
  const path = `test-${Date.now()}.txt`;
  console.log(`Trying to upload dummy file to bucket 'media' at path '${path}'...`);
  
  const { data, error } = await supabase.storage
    .from('media')
    .upload(path, dummyBuffer, {
      contentType: 'text/plain',
      duplex: 'half'
    });

  if (error) {
    console.error("❌ Upload failed:", error.message);
    console.error("Details:", error);
  } else {
    console.log("✅ Upload succeeded!", data);
    const { data: publicUrlData } = supabase.storage
      .from('media')
      .getPublicUrl(path);
    console.log("Public URL:", publicUrlData.publicUrl);
  }
}

testUpload();
