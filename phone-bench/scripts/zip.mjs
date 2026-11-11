// dist/ の中身だけを zip にする（public/ を含めると manifest が重複してストアで弾かれる）。
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { version } = JSON.parse(readFileSync(resolve(root, 'dist/manifest.json'), 'utf8'));
const name = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).name;
const out = resolve(root, `${name}-v${version}.zip`);
rmSync(out, { force: true });
execFileSync('zip', ['-r', '-X', out, '.', '-x', '.DS_Store'], { cwd: resolve(root, 'dist'), stdio: 'inherit' });
console.log(`created ${out}`);
