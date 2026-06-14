/**
 * Generate app icons using Node.js
 * Run: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Create a simple PNG header for a colored square
function createColoredPNG(size, r, g, b) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = createIHDRChunk(size, size);

  // IDAT chunk (compressed pixel data)
  const rawData = [];
  for (let y = 0; y < size; y++) {
    rawData.push(0); // Filter byte
    for (let x = 0; x < size; x++) {
      // Create gradient with "R" letter in center
      const centerX = size / 2;
      const centerY = size / 2;
      const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      const maxDist = size / 2;

      if (dist < size * 0.4) {
        // Inner circle - white
        rawData.push(255, 255, 255, 255);
      } else {
        // Outer - brand color
        rawData.push(r, g, b, 255);
      }
    }
  }

  const zlib = require('zlib');
  const compressed = zlib.deflateSync(Buffer.from(rawData));
  const idat = createChunk('IDAT', compressed);

  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createIHDRChunk(width, height) {
  const data = Buffer.alloc(13);
  data.writeUInt32BE(width, 0);
  data.writeUInt32BE(height, 4);
  data[8] = 8;  // Bit depth
  data[9] = 6;  // Color type (RGBA)
  data[10] = 0; // Compression
  data[11] = 0; // Filter
  data[12] = 0; // Interlace
  return createChunk('IHDR', data);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type);
  const crc = crc32(Buffer.concat([typeBuffer, data]));
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc >>> 0, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  const table = makeCRCTable();
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return crc ^ 0xffffffff;
}

function makeCRCTable() {
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  return table;
}

// Generate icons
const iconsDir = path.join(__dirname, '../apps/user-app/assets');
const driverIconsDir = path.join(__dirname, '../apps/driver-app/assets');

// User app icons (purple #6B4EFF)
const userIcons = [
  { name: 'icon.png', size: 1024 },
  { name: 'adaptive-icon.png', size: 1024 },
  { name: 'splash.png', size: 1284, h: 2778 },
  { name: 'notification-icon.png', size: 96 },
];

// Driver app icons (dark #1a1a2e)
const driverIcons = [
  { name: 'icon.png', size: 1024 },
  { name: 'adaptive-icon.png', size: 1024 },
  { name: 'splash.png', size: 1284, h: 2778 },
];

// User app - purple color
userIcons.forEach(({ name, size, h }) => {
  const height = h || size;
  const png = createColoredPNG(size, 107, 78, 255); // #6B4EFF
  fs.writeFileSync(path.join(iconsDir, name), png);
  console.log(`Created user-app/assets/${name}`);
});

// Driver app - dark color
driverIcons.forEach(({ name, size, h }) => {
  const height = h || size;
  const png = createColoredPNG(size, 26, 26, 46); // #1a1a2e
  fs.writeFileSync(path.join(driverIconsDir, name), png);
  console.log(`Created driver-app/assets/${name}`);
});

console.log('\nIcons generated! Add text/logos using a design tool.');
