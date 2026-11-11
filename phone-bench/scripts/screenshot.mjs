// ストア用のスクリーンショット（1280×800）を docs/screenshot.png に作る。
// 使い方: npm run build && npm run screenshot
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');

// 見本の画面（レスポンシブな架空のお店のページ）
const demo = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tsumugi Bakery</title><style>
*{box-sizing:border-box}body{margin:0;font:16px/1.6 system-ui,"Hiragino Sans",sans-serif;color:#2b2118;background:#fbf7f1}
header{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid #eadfce}
.logo{font-weight:800;letter-spacing:.02em}.menu{width:26px;height:18px;border-block:3px solid #2b2118;position:relative}
.menu:after{content:"";position:absolute;left:0;right:0;top:4.5px;border-top:3px solid #2b2118}
.hero{padding:28px 18px 24px;background:linear-gradient(160deg,#f3e3c8,#e8c9a0)}
.hero h1{font-size:32px;line-height:1.25;margin:0 0 10px}.hero p{margin:0 0 18px;color:#5a4636}
.cta{display:inline-block;padding:12px 20px;border-radius:999px;background:#7a3e12;color:#fff;font-weight:700;text-decoration:none}
.items{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;padding:20px 18px}
.item{background:#fff;border-radius:14px;padding:10px;box-shadow:0 1px 3px #0001}
.ph{aspect-ratio:4/3;border-radius:10px;background:radial-gradient(circle at 40% 40%,#e9b77a,#b8743a)}
.item:nth-child(2) .ph{background:radial-gradient(circle at 40% 40%,#f0d8a8,#c99a55)}
.item:nth-child(3) .ph{background:radial-gradient(circle at 40% 40%,#d9a066,#8f4f1f)}
.item:nth-child(4) .ph{background:radial-gradient(circle at 40% 40%,#f5e2bd,#d4a868)}
.item b{display:block;margin-top:8px}.item span{color:#7a6a5a;font-size:14px}
@media (min-width:420px){.hero h1{font-size:38px}}
</style></head><body><header><span class="logo">Tsumugi Bakery</span><span class="menu"></span></header>
<section class="hero"><h1>毎朝焼きたての<br>パンを届けます</h1><p>近所の工房で、小麦と発酵にこだわって焼いています。</p><a class="cta" href="#">今日のパンを見る</a></section>
<section class="items"><div class="item"><div class="ph"></div><b>塩バターロール</b><span>¥220</span></div><div class="item"><div class="ph"></div><b>クロワッサン</b><span>¥280</span></div><div class="item"><div class="ph"></div><b>カンパーニュ</b><span>¥520</span></div><div class="item"><div class="ph"></div><b>メロンパン</b><span>¥240</span></div></section>
</body></html>`;

const server = createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(demo);
});
// 見栄えのため 3000 番を使い、使用中なら空いている番号にする
await new Promise((r) => {
  server.once('error', () => server.listen(0, '127.0.0.1', r));
  server.listen(3000, '127.0.0.1', r);
});
const url = `http://localhost:${server.address().port}/`;

const context = await chromium.launchPersistentContext('', {
  headless: true,
  channel: 'chromium',
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
  locale: 'ja-JP',
  args: [`--disable-extensions-except=${dist}`, `--load-extension=${dist}`, '--lang=ja'],
});
try {
  let [worker] = context.serviceWorkers();
  worker ??= await context.waitForEvent('serviceworker');
  const id = new URL(worker.url()).host;
  const page = await context.newPage();
  await page.goto(`chrome-extension://${id}/emulator.html?url=${encodeURIComponent(url)}`);
  await page.waitForFunction(() => document.querySelectorAll('iframe.viewport').length === 3);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: resolve(root, 'docs/screenshot.png') });
  console.log('saved docs/screenshot.png');
} finally {
  await context.close();
  server.close();
}
