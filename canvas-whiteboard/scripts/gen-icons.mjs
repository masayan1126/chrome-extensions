import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [16, 48, 128];
const publicDir = path.resolve(__dirname, '../public');

// Create a simple whiteboard icon
async function generateIcon(size) {
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6"/>
          <stop offset="100%" style="stop-color:#1d4ed8"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#bg)"/>
      <rect
        x="${size * 0.2}"
        y="${size * 0.25}"
        width="${size * 0.35}"
        height="${size * 0.25}"
        rx="${size * 0.03}"
        fill="white"
        opacity="0.9"
      />
      <circle
        cx="${size * 0.65}"
        cy="${size * 0.6}"
        r="${size * 0.15}"
        fill="white"
        opacity="0.9"
      />
      <line
        x1="${size * 0.4}"
        y1="${size * 0.45}"
        x2="${size * 0.55}"
        y2="${size * 0.5}"
        stroke="white"
        stroke-width="${size * 0.04}"
        opacity="0.7"
      />
    </svg>
  `;

  const outputPath = path.join(publicDir, `icon-${size}.png`);
  await sharp(Buffer.from(svg)).png().toFile(outputPath);
  console.log(`Generated: ${outputPath}`);
}

async function main() {
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  for (const size of sizes) {
    await generateIcon(size);
  }

  console.log('All icons generated successfully!');
}

main().catch(console.error);
