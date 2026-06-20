const { uploadMedia } = require('../api/_media-upload');
const fs = require('fs');
const path = require('path');

// Manually disable Supabase in environment to simulate local SQLite offline mode
process.env.SUPABASE_URL = "";
process.env.SUPABASE_KEY = "";

// Re-require or check if isSupabaseEnabled was already set
// Since api/_media-upload.js reads process.env on require, we can require it after setting env
delete require.cache[require.resolve('../api/_media-upload')];
const { uploadMedia: uploadMediaOffline } = require('../api/_media-upload');

async function testLocalUpload() {
  const dummyBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  console.log("Simulating local/offline upload (Supabase disabled)...");
  
  const resultPath = await uploadMediaOffline(dummyBase64, "test-offline-player", "avatars");
  console.log("Resulting path:", resultPath);
  
  if (resultPath.startsWith("/uploads/avatars/test-offline-player-")) {
    const physicalPath = path.join(__dirname, "..", "public", resultPath);
    console.log("Checking physical file at:", physicalPath);
    if (fs.existsSync(physicalPath)) {
      console.log("✅ Offline local upload succeeded! File physically exists.");
      // Clean up test file
      fs.unlinkSync(physicalPath);
      console.log("Cleaned up offline test file.");
    } else {
      console.error("❌ Offline upload returned path, but file does not exist physically.");
    }
  } else {
    console.error("❌ Offline upload failed or returned unexpected path.");
  }
}

testLocalUpload();
