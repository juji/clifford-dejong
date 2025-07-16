// Script to generate a 180x180 favicon from basic.png and place it in the app directory
// Usage: node generate-favicon.js

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const appDir = path.join(rootDir, 'app');

// Source image and output path
const sourceImage = path.join(publicDir, 'basic.png');
const outputPath = path.join(appDir, 'favicon.ico');

// Function to generate favicon
async function generateFavicon() {
  try {
    console.log(`Generating 180x180 favicon from ${sourceImage}...`);
    
    // Check if source image exists
    if (!fs.existsSync(sourceImage)) {
      console.error(`❌ Source image not found: ${sourceImage}`);
      return;
    }
    
    // Create favicon
    await sharp(sourceImage)
      .resize(180, 180)
      .toFile(outputPath);
      
    console.log(`✅ Successfully generated favicon: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error generating favicon:', error);
    process.exit(1);
  }
}

// Run the script
generateFavicon();
