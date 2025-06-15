#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Icon sizes needed for Android TWA
const ICON_SIZES = [
  { size: 36, density: 'ldpi' },
  { size: 48, density: 'mdpi' },
  { size: 72, density: 'hdpi' },
  { size: 96, density: 'xhdpi' },
  { size: 144, density: 'xxhdpi' },
  { size: 192, density: 'xxxhdpi' },
  { size: 512, density: 'playstore' }
];

const ADAPTIVE_ICON_SIZES = [
  { size: 81, density: 'ldpi' },
  { size: 108, density: 'mdpi' },
  { size: 162, density: 'hdpi' },
  { size: 216, density: 'xhdpi' },
  { size: 324, density: 'xxhdpi' },
  { size: 432, density: 'xxxhdpi' }
];

async function generateIcons() {
  console.log('🎨 Generating Android icons from favicon.svg...');
  
  // Paths
  const projectRoot = path.join(__dirname, '..');
  const inputSvg = path.join(projectRoot, 'public', 'favicon.svg');
  const outputDir = path.join(projectRoot, 'public', 'icons');
  
  // Check if source file exists
  if (!fs.existsSync(inputSvg)) {
    console.error('❌ Source file not found:', inputSvg);
    console.log('Please ensure favicon.svg exists in the public directory');
    process.exit(1);
  }
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  try {
    console.log('📂 Reading source SVG...');
    const svgBuffer = fs.readFileSync(inputSvg);
    
    // Generate regular icons
    console.log('🔧 Generating regular icons...');
    for (const { size, density } of ICON_SIZES) {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      
      await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated ${size}x${size} (${density})`);
    }
    
    // Generate adaptive icons (foreground layer)
    console.log('🔧 Generating adaptive icon foregrounds...');
    for (const { size, density } of ADAPTIVE_ICON_SIZES) {
      const outputPath = path.join(outputDir, `adaptive-icon-${size}x${size}.png`);
      
      // For adaptive icons, we need to scale down the content to fit in the safe zone
      // Android adaptive icons use a 108dp canvas with a 72dp safe zone
      const safeZoneRatio = 72 / 108; // ~0.67
      const contentSize = Math.round(size * safeZoneRatio);
      const padding = Math.round((size - contentSize) / 2);
      
      await sharp(svgBuffer)
        .resize(contentSize, contentSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated adaptive ${size}x${size} (${density})`);
    }
    
    // Generate monochrome icon for adaptive icons
    console.log('🔧 Generating monochrome icons...');
    for (const { size, density } of ADAPTIVE_ICON_SIZES) {
      const outputPath = path.join(outputDir, `monochrome-icon-${size}x${size}.png`);
      
      const safeZoneRatio = 72 / 108;
      const contentSize = Math.round(size * safeZoneRatio);
      const padding = Math.round((size - contentSize) / 2);
      
      await sharp(svgBuffer)
        .resize(contentSize, contentSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .greyscale()
        .threshold(128) // Convert to pure black and white
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated monochrome ${size}x${size} (${density})`);
    }
    
    // Generate a simple background for adaptive icons
    console.log('🔧 Generating adaptive icon backgrounds...');
    for (const { size, density } of ADAPTIVE_ICON_SIZES) {
      const outputPath = path.join(outputDir, `background-${size}x${size}.png`);
      
      // Create a simple black background
      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 255 }
        }
      })
      .png()
      .toFile(outputPath);
      
      console.log(`✅ Generated background ${size}x${size} (${density})`);
    }
    
    // Generate usage instructions
    const instructionsPath = path.join(__dirname, 'icon-instructions.md');
    const instructions = `# Generated Android Icons

Icons have been generated and saved to \`public/icons/\` directory.

## Icon Types

### Regular Icons
- \`icon-*x*.png\` - Standard app icons for different densities
- Use these for basic icon requirements

### Adaptive Icons (Android 8.0+)
- \`adaptive-icon-*x*.png\` - Foreground layer
- \`background-*x*.png\` - Background layer  
- \`monochrome-*x*.png\` - Monochrome version for themed icons

## Android Resource Directories

When setting up your Android project, place icons in these directories:

### Regular Icons
- \`public/icons/icon-36x36.png\` → \`res/mipmap-ldpi/ic_launcher.png\`
- \`public/icons/icon-48x48.png\` → \`res/mipmap-mdpi/ic_launcher.png\`
- \`public/icons/icon-72x72.png\` → \`res/mipmap-hdpi/ic_launcher.png\`
- \`public/icons/icon-96x96.png\` → \`res/mipmap-xhdpi/ic_launcher.png\`
- \`public/icons/icon-144x144.png\` → \`res/mipmap-xxhdpi/ic_launcher.png\`
- \`public/icons/icon-192x192.png\` → \`res/mipmap-xxxhdpi/ic_launcher.png\`

### Adaptive Icons
- \`public/icons/adaptive-icon-81x81.png\` → \`res/mipmap-ldpi/ic_launcher_foreground.png\`
- \`public/icons/background-81x81.png\` → \`res/mipmap-ldpi/ic_launcher_background.png\`
- \`public/icons/monochrome-icon-81x81.png\` → \`res/mipmap-ldpi/ic_launcher_monochrome.png\`
- etc. for other densities...

### Play Store
- \`public/icons/icon-512x512.png\` - Use this for Google Play Store listing

## Generated: ${new Date().toISOString()}
`;
    
    fs.writeFileSync(instructionsPath, instructions);
    
    console.log('');
    console.log('🎉 Icon generation completed!');
    console.log(`📁 Icons saved to: ${outputDir}`);
    console.log('📖 See icon-instructions.md in the twa directory for usage instructions');
    console.log('');
    console.log('Next steps:');
    console.log('1. Icons are ready in public/icons/ directory');
    console.log('2. Build your TWA: npm run twa:build');
    
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  generateIcons().catch(console.error);
}

module.exports = { generateIcons };
