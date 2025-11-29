import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const svgPath = path.resolve(projectRoot, 'assets/logo.svg');
const outDir = path.resolve(projectRoot, 'public');

const sizes = [16, 32, 48, 128, 256, 512];

async function generate() {
  const svg = await readFile(svgPath);
  await mkdir(outDir, { recursive: true });
  for (const size of sizes) {
    const out = path.join(outDir, `icon-${size}.png`);
    const img = await sharp(svg)
      .resize(size, size, { fit: 'cover' })
      // 透明角と白アイコンを活かすためフラット化を無効化
      // .flatten({ background: '#000000' })
      .png({ compressionLevel: 9, progressive: false, palette: false })
      .toBuffer();
    await writeFile(out, img);
  }
  console.log('icons generated at', outDir);
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});


