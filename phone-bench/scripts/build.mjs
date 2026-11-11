// esbuild で TypeScript をまとめ、public/ の静的ファイルと合わせて dist/ を作る。
import { build } from 'esbuild';
import { cpSync, rmSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const watch = process.argv.includes('--watch');

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(resolve(root, 'public'), dist, { recursive: true });

const entries = {
  background: 'src/background/index.ts',
  emulator: 'src/emulator/main.ts',
  'content/ua-main': 'src/content/ua-main.ts',
  'content/bridge': 'src/content/bridge.ts',
};

await build({
  absWorkingDir: root,
  entryPoints: entries,
  outdir: dist,
  bundle: true,
  // コンテンツスクリプトはモジュールとして読み込めないので、すべて IIFE にする
  format: 'iife',
  target: 'chrome125',
  minify: !watch,
  sourcemap: false,
  logLevel: 'info',
});
