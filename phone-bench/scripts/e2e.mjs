// ビルド済みの dist/ を Chromium に読み込み、実際の iframe 表示まで確かめる。
// 使い方: npm run build && npm run e2e   （スクリーンショットは test-results/ に保存）
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const out = resolve(root, 'test-results');
mkdirSync(out, { recursive: true });

// 埋め込みを拒むヘッダーを返す検証用のサーバー
const server = createServer((req, res) => {
  const ua = req.headers['user-agent'] ?? '';
  const hints = req.headers['sec-ch-ua-mobile'] ?? '(none)';
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  const page = req.url?.startsWith('/second') ? 'second' : 'first';
  res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Test ${page}</title>
<style>body{font:16px system-ui;margin:0;padding:16px}.box{height:2400px;background:linear-gradient(#e0f2f1,#00737f)}
@media (max-width:430px){.only-mobile{display:block}} .only-mobile{display:none;padding:8px;background:#ffe082}</style></head>
<body><h1 id="page">${page}</h1>
<p class="only-mobile">mobile layout</p>
<pre id="info"></pre>
<a id="next" href="/second">next page</a>
<div class="box"></div>
<script>
addEventListener('load', () => setTimeout(() => document.getElementById('info').textContent = JSON.stringify({
  headerUA: ${JSON.stringify(ua)},
  headerMobileHint: ${JSON.stringify(String(hints))},
  jsUA: navigator.userAgent,
  platform: navigator.platform,
  maxTouchPoints: navigator.maxTouchPoints,
  touch: 'ontouchstart' in window,
  innerWidth: innerWidth,
  innerHeight: innerHeight,
  screenWidth: screen.width,
}, null, 1), 100));
</script></body></html>`);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const testUrl = `http://localhost:${port}/`;

const context = await chromium.launchPersistentContext('', {
  headless: true,
  channel: 'chromium',
  viewport: { width: 1600, height: 1000 },
  args: [`--disable-extensions-except=${dist}`, `--load-extension=${dist}`],
});

try {
  let [worker] = context.serviceWorkers();
  worker ??= await context.waitForEvent('serviceworker');
  const extensionId = new URL(worker.url()).host;
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/emulator.html`);
  await page.waitForSelector('.slot');
  assert.equal(await page.locator('.slot').count(), 3, '初回は 3 台並ぶ');
  await page.screenshot({ path: resolve(out, '01-empty.png') });

  await page.fill('#global-url', `localhost:${port}`);
  await page.click('#global-url-form button[type=submit]');
  await page.waitForFunction(() => document.querySelectorAll('iframe.viewport').length === 3);

  const frameInfo = async () => {
    const results = [];
    for (const frame of page.frames()) {
      if (frame === page.mainFrame()) continue;
      const handle = await frame.waitForSelector('#info:not(:empty)', { timeout: 10000 });
      results.push(JSON.parse(await handle.textContent()));
    }
    return results;
  };
  await page.waitForTimeout(800);
  const infos = await frameInfo();
  assert.equal(infos.length, 3);
  for (const info of infos) {
    assert.match(info.headerUA, /iPhone OS/, 'サーバーに届く User-Agent が iPhone');
    assert.equal(info.headerMobileHint, '(none)', 'Client Hints を送らない');
    assert.match(info.jsUA, /iPhone OS/, 'navigator.userAgent が iPhone');
    assert.equal(info.platform, 'iPhone');
    assert.equal(info.maxTouchPoints, 5);
    assert.equal(info.touch, true);
  }
  const widths = infos.map((i) => i.innerWidth).sort((a, b) => a - b);
  assert.deepEqual(widths, [375, 402, 440], '各端末の幅でレイアウトされる');
  for (const info of infos) assert.equal(info.screenWidth, info.innerWidth, 'screen.width も端末の幅');
  console.log('frames:', infos.map((i) => `${i.innerWidth}x${i.innerHeight} screen=${i.screenWidth}`).join(', '));
  await page.screenshot({ path: resolve(out, '02-loaded.png') });

  // iframe 内のリンク移動が、端末ごとの URL 欄に反映される
  const first = page.frames().find((f) => f !== page.mainFrame());
  await first.click('#next');
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll('.slot-url input')).some((i) => i.value.endsWith('/second')),
    null,
    { timeout: 10000 },
  );

  // スクロールの同期
  await page.check('#sync-scroll', { force: true });
  await page.waitForTimeout(300);
  const frames = page.frames().filter((f) => f !== page.mainFrame());
  await frames[1].evaluate(() => window.scrollTo(0, (document.scrollingElement.scrollHeight - innerHeight) / 2));
  await page.waitForTimeout(600);
  const ratios = await Promise.all(
    frames.map((f) => f.evaluate(() => scrollY / (document.scrollingElement.scrollHeight - innerHeight))),
  );
  console.log('scroll ratios:', ratios.map((r) => r.toFixed(2)).join(', '));
  assert.ok(ratios.every((r) => Math.abs(r - 0.5) < 0.05), 'スクロール位置がそろう');

  // 横向き・ホーム画面アプリ表示
  await page.locator('.slot').nth(1).getByRole('button', { name: /縦横|Rotate/ }).click();
  await page.locator('.segmented label').nth(1).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: resolve(out, '03-landscape-standalone.png') });

  // つながらない URL では案内を出す
  const slot = page.locator('.slot').nth(2);
  await slot.locator('.slot-url input').fill('localhost:1');
  await slot.locator('.slot-url input').press('Enter');
  await slot.locator('.screen-failure').waitFor({ state: 'visible', timeout: 8000 });
  await page.screenshot({ path: resolve(out, '04-failure.png') });

  // タイトルが変わった後に、iframe 内のリンクでつながらないページへ移っても案内を出す
  const firstSlot = page.locator('.slot').nth(0);
  const firstFrame = page.frames().find((f) => f !== page.mainFrame() && f.url().endsWith('/second'));
  await firstFrame.evaluate(() => { document.title = 'changed'; });
  await page.waitForTimeout(900);
  await firstFrame.evaluate(() => { location.href = 'http://localhost:1/'; }).catch(() => undefined);
  await firstSlot.locator('.screen-failure').waitFor({ state: 'visible', timeout: 8000 });

  // ほかのタブには影響しない
  const plain = await context.newPage();
  await plain.goto(testUrl);
  const plainInfo = JSON.parse(await (await plain.waitForSelector('#info:not(:empty)')).textContent());
  assert.doesNotMatch(plainInfo.headerUA, /iPhone OS/, '通常のタブの User-Agent はそのまま');
  assert.doesNotMatch(plainInfo.jsUA, /iPhone OS/);

  console.log('E2E OK');
} finally {
  await context.close();
  server.close();
}
