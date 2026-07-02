/**
 * POBSI Banjarnegara — Build Script
 * Minifies CSS/JS and converts images to WebP for performance optimization.
 */

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');
const CleanCSS = require('clean-css');
const sharp = require('sharp');

const PUBLIC_DIR = path.join(__dirname, 'public');
const CSS_DIR = path.join(PUBLIC_DIR, 'css');
const JS_DIR = path.join(PUBLIC_DIR, 'js');
const IMG_DIR = path.join(PUBLIC_DIR, 'images');

async function minifyCSS() {
  console.log('📦 Minifying CSS...');
  const inputFile = path.join(CSS_DIR, 'index.css');
  const outputFile = path.join(CSS_DIR, 'index.min.css');

  const css = fs.readFileSync(inputFile, 'utf8');
  const result = new CleanCSS({
    level: 2,
    sourceMap: false,
  }).minify(css);

  if (result.errors.length > 0) {
    console.error('  ❌ CSS minification errors:', result.errors);
    return;
  }

  fs.writeFileSync(outputFile, result.styles, 'utf8');
  const savedKB = ((css.length - result.styles.length) / 1024).toFixed(1);
  console.log(`  ✅ index.css: ${(css.length / 1024).toFixed(1)} KiB → ${(result.styles.length / 1024).toFixed(1)} KiB (saved ${savedKB} KiB)`);
}

async function minifyJS() {
  console.log('📦 Minifying JavaScript...');
  const inputFile = path.join(JS_DIR, 'app.js');
  const outputFile = path.join(JS_DIR, 'app.min.js');

  const js = fs.readFileSync(inputFile, 'utf8');
  const result = await minify(js, {
    compress: {
      drop_console: false,
      passes: 2,
    },
    mangle: true,
    output: {
      comments: false,
    },
    sourceMap: {
      filename: "app.min.js",
      url: false
    }
  });

  if (result.error) {
    console.error('  ❌ JS minification error:', result.error);
    return;
  }

  fs.writeFileSync(outputFile, result.code, 'utf8');
  if (result.map) {
    fs.writeFileSync(outputFile + '.map', result.map, 'utf8');
  }
  const savedKB = ((js.length - result.code.length) / 1024).toFixed(1);
  console.log(`  ✅ app.js: ${(js.length / 1024).toFixed(1)} KiB → ${(result.code.length / 1024).toFixed(1)} KiB (saved ${savedKB} KiB, map generated)`);

  // Also minify data.js
  const dataInputFile = path.join(JS_DIR, 'data.js');
  const dataOutputFile = path.join(JS_DIR, 'data.min.js');
  if (fs.existsSync(dataInputFile)) {
    const dataJs = fs.readFileSync(dataInputFile, 'utf8');
    const dataResult = await minify(dataJs, {
      compress: { passes: 1 },
      mangle: true,
      output: { comments: false },
    });
    if (dataResult.code) {
      fs.writeFileSync(dataOutputFile, dataResult.code, 'utf8');
      const dataSaved = ((dataJs.length - dataResult.code.length) / 1024).toFixed(1);
      console.log(`  ✅ data.js: ${(dataJs.length / 1024).toFixed(1)} KiB → ${(dataResult.code.length / 1024).toFixed(1)} KiB (saved ${dataSaved} KiB)`);
    }
  }
}

async function convertImagesToWebP() {
  console.log('🖼️  Converting images to WebP...');

  const images = [
    { name: 'pobsi-logo.png', width: 100, quality: 75 },
    { name: 'hero-player.png', width: 1200, quality: 75 },
    { name: 'logo-koni.png', width: 100, quality: 75 },
    { name: 'club-avatar.png', width: 300, quality: 75 },
    { name: 'player-avatar.png', width: 300, quality: 75 },
    { name: 'club-cover.png', width: 800, quality: 70 },
    { name: 'dashboard-hero.png', width: 1200, quality: 70 },
    { name: 'event-poster.png', width: 800, quality: 75 },
    { name: 'boc-community-2026.jpg', width: 800, quality: 70 },
    { name: 'boc-series-3.png', width: 600, quality: 75 },
    { name: 'boc-series-4.png', width: 600, quality: 75 },
    { name: 'boc-series-5.png', width: 600, quality: 75 },
    { name: 'handicap-cup.png', width: 600, quality: 75 },
    { name: 'club-championship.png', width: 600, quality: 75 },
  ];

  for (const img of images) {
    const inputPath = path.join(IMG_DIR, img.name);
    if (!fs.existsSync(inputPath)) {
      console.log(`  ⚠️  Skipping ${img.name} (not found)`);
      continue;
    }

    const outputName = img.name.replace(/\.(png|jpg|jpeg)$/i, '.webp');
    const outputPath = path.join(IMG_DIR, outputName);

    try {
      const inputStats = fs.statSync(inputPath);
      
      await sharp(inputPath)
        .resize(img.width, null, { 
          withoutEnlargement: true,
          fit: 'inside' 
        })
        .webp({ quality: img.quality })
        .toFile(outputPath);

      const outputStats = fs.statSync(outputPath);
      const savedKB = ((inputStats.size - outputStats.size) / 1024).toFixed(1);
      const reduction = ((1 - outputStats.size / inputStats.size) * 100).toFixed(0);
      console.log(`  ✅ ${img.name}: ${(inputStats.size / 1024).toFixed(1)} KiB → ${(outputStats.size / 1024).toFixed(1)} KiB (saved ${savedKB} KiB, -${reduction}%)`);
    } catch (err) {
      console.error(`  ❌ Error converting ${img.name}:`, err.message);
    }
  }
}

async function main() {
  console.log('🚀 POBSI Build Process Starting...\n');
  
  await minifyCSS();
  console.log('');
  await minifyJS();
  console.log('');
  await convertImagesToWebP();
  
  console.log('\n✨ Build complete!');
}

main().catch(console.error);
