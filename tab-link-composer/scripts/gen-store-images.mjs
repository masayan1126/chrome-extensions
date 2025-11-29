import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const targets = [
  { in: 'assets/store/screenshot-template.svg', out: 'store/screenshot-1280x800.png', w: 1280, h: 800 },
  { in: 'assets/store/promo-small-template.svg', out: 'store/promo-small-440x280.png', w: 440, h: 280 },
  { in: 'assets/store/promo-marquee-template.svg', out: 'store/promo-marquee-1400x560.png', w: 1400, h: 560 },
];

async function run() {
  for (const t of targets) {
    const svg = await readFile(path.resolve(root, t.in));
    const outDir = path.resolve(root, path.dirname(t.out));
    await mkdir(outDir, { recursive: true });
    const img = await sharp(svg)
      .resize(t.w, t.h, { fit: 'cover' })
      .flatten({ background: '#0b63f6' })
      .png({ compressionLevel: 9, progressive: false, palette: false })
      .toBuffer();
    await writeFile(path.resolve(root, t.out), img);
  }
  console.log('store images generated');
}

run().catch((e) => { console.error(e); process.exit(1); });


