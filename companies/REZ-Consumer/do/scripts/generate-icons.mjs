// Script to generate app icons from SVG
// Run: node scripts/generate-icons.mjs

import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, '../assets');

// Ensure assets directory exists
if (!existsSync(assetsDir)) {
  mkdirSync(assetsDir, { recursive: true });
}

// Icon configurations
const icons = [
  // App icon (iOS) - 1024x1024
  { name: 'icon.png', size: 1024, padding: 0 },

  // Adaptive icon (Android) - 1024x1024
  { name: 'adaptive-icon.png', size: 1024, padding: 0 },

  // Splash icon
  { name: 'splash-icon.png', size: 512, padding: 0 },

  // Notification icon (Android)
  { name: 'notification-icon.png', size: 96, padding: 0 },
];

// Generate icons from SVG
async function generateIcons() {
  console.log('🎨 Generating app icons...\n');

  for (const icon of icons) {
    const svgPath = join(assetsDir, `${icon.name.replace('.png', '.svg')}`);
    const outputPath = join(assetsDir, icon.name);

    try {
      // Read SVG
      const svg = readFileSync(svgPath);

      // Convert to PNG with sharp
      await sharp(svg)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputPath);

      console.log(`✅ Generated: ${icon.name} (${icon.size}x${icon.size})`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`⚠️  Skipped: ${icon.name} (SVG not found)`);
      } else {
        console.error(`❌ Error generating ${icon.name}:`, error.message);
      }
    }
  }

  console.log('\n✨ Done! Icons generated in assets/');
}

// Run
generateIcons().catch(console.error);
