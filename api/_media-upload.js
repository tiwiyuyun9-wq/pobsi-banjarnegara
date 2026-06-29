const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const isSupabaseEnabled = supabaseUrl && supabaseKey;

let supabase = null;
if (isSupabaseEnabled) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

/**
 * Handles uploading a media file (Base64) to either Supabase Storage (production)
 * or local filesystem (development/offline SQLite mode).
 * 
 * @param {string} fileData - Base64 data string (e.g., "data:image/png;base64,...") or an existing URL.
 * @param {string} filenamePrefix - A prefix for the unique filename (e.g., "player-avatar").
 * @param {string} folderName - Subfolder inside bucket or uploads (e.g., "avatars", "covers", "posters").
 * @returns {Promise<string>} The public URL or relative file path.
 */
async function uploadMedia(fileData, filenamePrefix, folderName) {
  if (!fileData) return "";
  
  // If it's already an HTTP(S) URL or relative path, no need to upload again
  if (fileData.startsWith('http://') || fileData.startsWith('https://') || fileData.startsWith('/uploads/')) {
    return fileData;
  }

  // Parse base64
  if (!fileData.includes(';base64,')) {
    return fileData; // Not a base64 string
  }

  try {
    const parts = fileData.split(';base64,');
    const header = parts[0];
    const base64Data = parts[1];
    const mime = header.split(':')[1].split(';')[0];
    
    // Guess file extension from mime type
    let ext = '.png';
    if (mime.includes('jpeg') || mime.includes('jpg')) ext = '.jpg';
    else if (mime.includes('webp')) ext = '.webp';
    else if (mime.includes('svg')) ext = '.svg';
    else if (mime.includes('pdf')) ext = '.pdf';

    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `${filenamePrefix}-${Date.now()}${ext}`;
    const storagePath = `${folderName}/${fileName}`;

    if (isSupabaseEnabled) {
      // 1. Supabase Storage upload (bucket 'media')
      const { data, error } = await supabase.storage
        .from('media')
        .upload(storagePath, buffer, {
          contentType: mime,
          duplex: 'half'
        });

      if (error) {
        console.error(`❌ Gagal mengunggah media ke Supabase Storage (media/${storagePath}):`, error.message);
        throw error;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('media')
        .getPublicUrl(storagePath);

      return publicUrlData.publicUrl;
    } else {
      // 2. Local fallback (SQLite offline mode)
      const uploadsDir = path.join(__dirname, '..', 'public', 'uploads', folderName);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, buffer);
      
      return `/uploads/${folderName}/${fileName}`;
    }
  } catch (err) {
    console.error('❌ Error uploading media:', err);
    // Return original data as fallback (so base64 doesn't get lost completely on upload fail)
    return fileData;
  }
}

/**
 * Deletes a media file from either Supabase Storage (production)
 * or local filesystem (development/offline SQLite mode).
 * 
 * @param {string} fileUrl - The public URL or relative file path to delete.
 * @returns {Promise<boolean>} True if successful or file not found/deleted.
 */
async function deleteMedia(fileUrl) {
  if (!fileUrl) return false;

  try {
    if (isSupabaseEnabled) {
      let storagePath = "";
      const marker = '/storage/v1/object/public/media/';
      const altMarker = '/public/media/';
      
      if (fileUrl.includes(marker)) {
        storagePath = fileUrl.split(marker).pop();
      } else if (fileUrl.includes(altMarker)) {
        storagePath = fileUrl.split(altMarker).pop();
      }

      if (storagePath) {
        storagePath = decodeURIComponent(storagePath);
        const { error } = await supabase.storage
          .from('media')
          .remove([storagePath]);
          
        if (error) {
          console.error(`❌ Gagal menghapus media dari Supabase Storage (${storagePath}):`, error.message);
          return false;
        }
        console.log(`🗑️ Deleted cloud media: media/${storagePath}`);
        return true;
      }
    } else {
      // Local fallback (SQLite offline mode)
      if (fileUrl.startsWith('/uploads/')) {
        const relativePath = fileUrl.replace(/^\//, ''); // remove leading slash
        const filePath = path.join(__dirname, '..', 'public', relativePath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Deleted local media: ${filePath}`);
          return true;
        }
      }
    }
  } catch (err) {
    console.error('❌ Error deleting media:', err);
  }
  return false;
}

module.exports = { uploadMedia, deleteMedia };
