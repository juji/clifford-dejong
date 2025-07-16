// Script to generate a 180x180 favicon from og-image.png, cropped from the middle, and place it in the app directory
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
const sourceImage = path.join(publicDir, 'og-image.png');
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
    
    // Get image metadata to determine dimensions
    const metadata = await sharp(sourceImage).metadata();
    
    if (!metadata.width || !metadata.height) {
      console.error('❌ Could not determine image dimensions');
      return;
    }
    
    // Calculate crop dimensions to make it square from the center
    const size = Math.min(metadata.width, metadata.height);
    const left = Math.floor((metadata.width - size) / 2);
    const top = Math.floor((metadata.height - size) / 2);
    
    console.log(`Cropping from center: ${size}x${size} from position (${left},${top})`);
    
    // Create favicon - crop from the center and then resize
    await sharp(sourceImage)
      .extract({ left, top, width: size, height: size }) // Crop to square from center
      .resize(180, 180) // Resize to 180x180
      .toFile(outputPath);
      
    console.log(`✅ Successfully generated favicon: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error generating favicon:', error);
    process.exit(1);
  }
}

// Run the script
generateFavicon();
