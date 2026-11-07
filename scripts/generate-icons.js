import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate premium Dyad SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="100%" stop-color="#09090b"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#818cf8"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#bg)"/>
  <rect x="16" y="16" width="480" height="480" rx="112" fill="none" stroke="#27272a" stroke-width="4"/>
  <!-- Two interconnected nodes representing the dyad -->
  <circle cx="196" cy="256" r="64" fill="#09090b" stroke="url(#accent)" stroke-width="12" filter="url(#glow)"/>
  <circle cx="316" cy="256" r="64" fill="#18181b" stroke="#f43f5e" stroke-width="12" filter="url(#glow)"/>
  <!-- Intersecting bridge wave -->
  <path d="M 196 232 C 240 200, 272 312, 316 280" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round"/>
  <!-- Subtle center pulse -->
  <circle cx="256" cy="256" r="12" fill="#ffffff"/>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);

// Minimal PNG generator using standard Node zlib
function createPng(width, height, getPixel) {
  const bytesPerPixel = 4;
  const rowSize = width * bytesPerPixel;
  const rawData = Buffer.alloc(height * (rowSize + 1));

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: RGBA (6)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let c;
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }

  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(12 + len);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const typeAndData = buf.subarray(4, 8 + len);
  const crcVal = crc32(typeAndData);
  buf.writeUInt32BE(crcVal, 8 + len);
  return buf;
}

// Pixel generator for Dyad icon: Dark charcoal/zinc background, dual circles (cyan/blue & rose)
function getDyadPixel(x, y, w, h, isMaskable = false) {
  const nx = (x / w) * 2 - 1;
  const ny = (y / h) * 2 - 1;
  const rDist = Math.sqrt(nx * nx + ny * ny);

  // Background is deep dark zinc-950 #09090b
  let r = 9, g = 9, b = 11, a = 255;

  // Outer border if not maskable
  if (!isMaskable && rDist > 0.95 && rDist < 0.98) {
    return [39, 39, 42, 255]; // zinc-800
  }

  // Left circle center: (-0.25, 0), radius 0.25
  const d1 = Math.sqrt((nx + 0.24) ** 2 + ny ** 2);
  // Right circle center: (+0.25, 0), radius 0.25
  const d2 = Math.sqrt((nx - 0.24) ** 2 + ny ** 2);

  // Left circle: Cyan/Sky ring
  if (d1 >= 0.20 && d1 <= 0.28) {
    return [56, 189, 248, 255]; // sky-400
  }
  if (d1 < 0.20) {
    return [15, 23, 42, 255]; // slate-900 inner
  }

  // Right circle: Rose/Pink ring
  if (d2 >= 0.20 && d2 <= 0.28) {
    return [244, 63, 94, 255]; // rose-500
  }
  if (d2 < 0.20) {
    return [24, 24, 27, 255]; // zinc-900 inner
  }

  // Center link pulse
  const dCenter = Math.sqrt(nx ** 2 + ny ** 2);
  if (dCenter < 0.06) {
    return [255, 255, 255, 255]; // pure white
  }

  return [r, g, b, a];
}

console.log('Generating PNG icons...');
const icon192 = createPng(192, 192, (x, y, w, h) => getDyadPixel(x, y, w, h, false));
const icon512 = createPng(512, 512, (x, y, w, h) => getDyadPixel(x, y, w, h, false));
const iconMaskable = createPng(512, 512, (x, y, w, h) => getDyadPixel(x, y, w, h, true));
const iconApple = createPng(180, 180, (x, y, w, h) => getDyadPixel(x, y, w, h, false));

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), icon192);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), icon512);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), iconMaskable);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), iconApple);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), iconApple);

console.log('PWA icons successfully generated in public/');
