// This script is used to generate PWA icons
// To use it, run: node scripts/generate-pwa-icons.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check if imagemagick is installed
try {
  execSync('which convert', { stdio: 'ignore' });
} catch (e) {
  console.error('ImageMagick is not installed. Please install it to generate icons.');
  console.error('On macOS: brew install imagemagick');
  console.error('On Ubuntu/Debian: sudo apt-get install imagemagick');
  process.exit(1);
}

const FAVICON_PATH = path.join(__dirname, '../app/favicon.ico');
const ICONS_DIR = path.join(__dirname, '../public/icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Sizes for PWA icons
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Generate icons
sizes.forEach(size => {
  const outputPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
  
  try {
    execSync(`convert ${FAVICON_PATH} -resize ${size}x${size} ${outputPath}`, {
      stdio: 'inherit'
    });
    console.log(`Generated ${size}x${size} icon`);
  } catch (error) {
    console.error(`Failed to generate ${size}x${size} icon:`, error.message);
  }
});

console.log('PWA icons generation complete!'); 