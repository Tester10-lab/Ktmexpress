import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceImg = 'C:\\Users\\Diplon\\Downloads\\Untitled design.png';
const publicDir = path.resolve(__dirname, '../public');

async function processLogo() {
  try {
    // 1. Optimized logo for web usage
    await sharp(sourceImg)
      .trim()
      .resize({ height: 120, withoutEnlargement: true })
      .png({ quality: 80, compressionLevel: 9 })
      .toFile(path.join(publicDir, 'logo.png'));
      
    // 2. Favicon (32x32)
    await sharp(sourceImg)
      .trim()
      .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, 'favicon.png'));
      
    // 3. Apple Touch Icon (180x180) - Needs solid background for iOS
    await sharp(sourceImg)
      .trim()
      .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));
      
    // 4. PWA Icons (192, 512)
    await sharp(sourceImg)
      .trim()
      .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, 'pwa-192x192.png'));
      
    await sharp(sourceImg)
      .trim()
      .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, 'pwa-512x512.png'));
      
    console.log('Successfully optimized and generated all logos.');
  } catch (error) {
    console.error('Error processing logo:', error);
    process.exit(1);
  }
}

processLogo();
