#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Screenshot configurations for different form factors
const SCREENSHOT_CONFIGS = [
  // Wide/Desktop screenshots
  { width: 1366, height: 768, name: 'screenshot-1366x768.png', formFactor: 'wide' },
  { width: 1920, height: 1080, name: 'screenshot-1920x1080.png', formFactor: 'wide' },
  { width: 1280, height: 720, name: 'screenshot-1280x720.png', formFactor: 'wide' },
  
  // Narrow/Mobile screenshots  
  { width: 375, height: 667, name: 'screenshot-375x667.png', formFactor: 'narrow' },
  { width: 414, height: 896, name: 'screenshot-414x896.png', formFactor: 'narrow' },
  { width: 360, height: 640, name: 'screenshot-360x640.png', formFactor: 'narrow' }
];

// Different attractor configurations to showcase variety
const ATTRACTOR_CONFIGS = [
  { type: 'clifford', params: { a: -1.4, b: 1.6, c: 1.0, d: 0.7 }, color: 'pink' },
  { type: 'dejong', params: { a: 1.4, b: -2.3, c: 2.4, d: -2.1 }, color: 'blue' },
  { type: 'clifford', params: { a: -1.8, b: -2.0, c: -0.5, d: -0.9 }, color: 'green' }
];

async function generateScreenshots() {
  console.log('📸 Starting screenshot generation...');
  
  const projectRoot = path.join(__dirname, '..');
  const outputDir = path.join(projectRoot, 'public', 'screenshots');
  
  // Create screenshots directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log('📁 Created screenshots directory');
  }
  
  // Check if we need to start the dev server
  const serverUrl = process.env.SCREENSHOT_URL || 'https://cdw.jujiplay.com';
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    console.log(`🌐 Using server: ${serverUrl}`);
    console.log('📱 Generating screenshots for different viewports...');
    
    for (let i = 0; i < SCREENSHOT_CONFIGS.length; i++) {
      const config = SCREENSHOT_CONFIGS[i];
      const attractorConfig = ATTRACTOR_CONFIGS[i % ATTRACTOR_CONFIGS.length];
      
      console.log(`📸 Capturing ${config.name} (${config.width}x${config.height})`);
      
      const page = await browser.newPage();
      
      // Set viewport
      await page.setViewport({ 
        width: config.width, 
        height: config.height,
        deviceScaleFactor: 1
      });
      
      // Navigate to the app
      await page.goto(serverUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      // Wait for the canvas to be ready
      await page.waitForSelector('canvas', { timeout: 10000 });
      
      // Wait a bit more for the attractor to render
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Click on the lil-gui title to expand controls
      try {
        await page.click('.lil-gui.root > .title');
        console.log(`📋 Clicked lil-gui title for ${config.name}`);
        
        // Wait 5 seconds after clicking
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        console.log(`⚠️  Could not click lil-gui title: ${error.message}`);
        // Still wait a bit in case the element doesn't exist
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Hide the controls panel for cleaner screenshots
      await page.evaluate(() => {
        const controlsPanel = document.querySelector('.dg.ac');
        if (controlsPanel) {
          controlsPanel.style.display = 'none';
        }
      });
      
      // Optional: Trigger a specific attractor pattern
      try {
        await page.evaluate((attractorConfig) => {
          // Try to access the global state/controls if available
          if (window.gui && window.gui.__controllers) {
            const controllers = window.gui.__controllers;
            // Set attractor parameters if controls are available
            controllers.forEach(controller => {
              if (controller.property in attractorConfig.params) {
                controller.setValue(attractorConfig.params[controller.property]);
              }
            });
          }
        }, attractorConfig);
        
        // Wait for the new pattern to render
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.log(`⚠️  Could not set custom attractor config: ${error.message}`);
      }
      
      // Take the screenshot
      const outputPath = path.join(outputDir, config.name);
      await page.screenshot({ 
        path: outputPath,
        type: 'png',
        fullPage: false
      });
      
      console.log(`✅ Saved: ${config.name}`);
      
      await page.close();
    }
    
    // Auto-update the manifest.json file
    await updateManifestWithScreenshots(outputDir);
    
    console.log('');
    console.log('🎉 Screenshot generation completed!');
    console.log(`📁 Screenshots saved to: ${outputDir}`);
    console.log('✅ Manifest.json updated with new screenshots');
    console.log('');
    console.log('📝 Next steps:');
    console.log('1. Review the generated screenshots in public/screenshots/');
    console.log('2. Manifest.json has been automatically updated');
    console.log('3. Commit the new screenshots to your repository');
    console.log('4. Deploy to make them available for your TWA');
    
  } catch (error) {
    console.error('❌ Error generating screenshots:', error.message);
    
    if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
      console.log('');
      console.log('💡 Make sure your dev server is running:');
      console.log('   pnpm run dev');
      console.log('');
      console.log('Or set a custom URL:');
      console.log('   SCREENSHOT_URL=https://cdw.jujiplay.com pnpm run twa:screenshots');
    }
    
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function updateManifestWithScreenshots(screenshotsDir) {
  const projectRoot = path.join(__dirname, '..');
  const manifestPath = path.join(projectRoot, 'public', 'manifest.json');
  
  if (!fs.existsSync(manifestPath)) {
    console.log('⚠️  manifest.json not found, skipping update');
    return;
  }
  
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Generate screenshots array from generated files
    const wideScreenshots = SCREENSHOT_CONFIGS
      .filter(config => config.formFactor === 'wide')
      .map(config => ({
        src: `/screenshots/${config.name}`,
        sizes: `${config.width}x${config.height}`,
        type: 'image/png',
        form_factor: 'wide'
      }));
      
    const narrowScreenshots = SCREENSHOT_CONFIGS
      .filter(config => config.formFactor === 'narrow')
      .map(config => ({
        src: `/screenshots/${config.name}`,
        sizes: `${config.width}x${config.height}`,
        type: 'image/png',
        form_factor: 'narrow'
      }));
    
    // Update manifest with new screenshots
    manifest.screenshots = [...wideScreenshots, ...narrowScreenshots];
    
    // Write updated manifest
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log('📝 Updated manifest.json with new screenshots');
    
  } catch (error) {
    console.error('❌ Error updating manifest.json:', error.message);
  }
}

async function generateManifestUpdate() {
  const projectRoot = path.join(__dirname, '..');
  const manifestPath = path.join(projectRoot, 'public', 'manifest.json');
  
  if (!fs.existsSync(manifestPath)) {
    return;
  }
  
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Generate suggested screenshots array
  const wideScreenshots = SCREENSHOT_CONFIGS
    .filter(config => config.formFactor === 'wide')
    .map(config => ({
      src: `/screenshots/${config.name}`,
      sizes: `${config.width}x${config.height}`,
      type: 'image/png',
      form_factor: 'wide'
    }));
    
  const narrowScreenshots = SCREENSHOT_CONFIGS
    .filter(config => config.formFactor === 'narrow')
    .map(config => ({
      src: `/screenshots/${config.name}`,
      sizes: `${config.width}x${config.height}`,
      type: 'image/png',
      form_factor: 'narrow'
    }));
  
  const suggestedScreenshots = [...wideScreenshots, ...narrowScreenshots];
  
  // Write suggestion to a file
  const suggestionPath = path.join(__dirname, 'manifest-screenshots-suggestion.json');
  fs.writeFileSync(suggestionPath, JSON.stringify({
    note: "Copy this screenshots array to your manifest.json",
    screenshots: suggestedScreenshots
  }, null, 2));
  
  console.log(`📝 Manifest suggestion saved to: ${suggestionPath}`);
}

// Check if we need to install puppeteer
async function checkDependencies() {
  try {
    require('puppeteer');
  } catch (error) {
    console.log('📦 Installing puppeteer...');
    const { execSync } = require('child_process');
    try {
      execSync('pnpm add puppeteer --save-dev', { 
        cwd: __dirname, 
        stdio: 'inherit' 
      });
      console.log('✅ Puppeteer installed successfully');
    } catch (installError) {
      console.error('❌ Failed to install puppeteer:', installError.message);
      console.log('Please run: pnpm add puppeteer --save-dev');
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  await checkDependencies();
  await generateScreenshots();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateScreenshots };
