#!/usr/bin/env node
// Chrome Web Store API で zip パッケージをアップロード + 公開する。
// 詳細は docs/cws-api-setup.md を参照。
//
// 使い方:
//   node scripts/upload-to-cws.mjs ./web-annotator-v1.X.Y.zip
//
// 必要な環境変数 (.env または process.env):
//   CWS_EXTENSION_ID
//   CWS_CLIENT_ID
//   CWS_CLIENT_SECRET
//   CWS_REFRESH_TOKEN
//
// オプション環境変数 / フラグ:
//   CWS_PUBLISH_TARGET=default  (default | trustedTesters)
//   CWS_SKIP_PUBLISH=1          (アップロードのみ、公開トリガーをスキップ)
//   --yes / -y                  (ストア掲載情報更新済み確認をスキップ。CI 等で対話できない時用)
//
// ⚠️ Detailed description, screenshots, store listing details は API で更新できないため、
// Web UI での手動更新が必要。**zip アップロード後はストア掲載情報が編集ロックされる** ため、
// 必ず先に Detailed description を更新してから本スクリプトを実行すること。
// 詳細は docs/release-checklist.md 3-A を参照。

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { loadDotenv } from './lib/dotenv.mjs';

loadDotenv(path.join(process.cwd(), '.env'));

// --yes / -y フラグ判定
const SKIP_CONFIRM = process.argv.includes('--yes') || process.argv.includes('-y');

// ---------------------------------------------------------------------------
// 必須環境変数チェック
// ---------------------------------------------------------------------------
const REQUIRED = ['CWS_EXTENSION_ID', 'CWS_CLIENT_ID', 'CWS_CLIENT_SECRET', 'CWS_REFRESH_TOKEN'];
const missing = REQUIRED.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error('ERROR: Missing required environment variables:');
  for (const k of missing) console.error('  - ' + k);
  console.error('See docs/cws-api-setup.md');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// zip ファイルパス引数 (--yes / -y は除外)
// ---------------------------------------------------------------------------
const zipPath = process.argv.slice(2).find(arg => !arg.startsWith('-'));
if (!zipPath) {
  console.error('Usage: node scripts/upload-to-cws.mjs <path/to/zip> [--yes]');
  process.exit(1);
}
if (!fs.existsSync(zipPath)) {
  console.error(`ERROR: zip file not found: ${zipPath}`);
  process.exit(1);
}
const zipBuffer = fs.readFileSync(zipPath);
console.log(`Loaded zip: ${zipPath} (${zipBuffer.byteLength} bytes)`);

// ---------------------------------------------------------------------------
// access token 取得
// ---------------------------------------------------------------------------
async function getAccessToken() {
  console.log('Exchanging refresh token for access token...');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.CWS_CLIENT_ID,
      client_secret: process.env.CWS_CLIENT_SECRET,
      refresh_token: process.env.CWS_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.access_token) {
    console.error('Failed to get access token:', json);
    throw new Error('access_token_exchange_failed');
  }
  return json.access_token;
}

// ---------------------------------------------------------------------------
// zip アップロード
// ---------------------------------------------------------------------------
async function uploadZip(accessToken) {
  const itemId = process.env.CWS_EXTENSION_ID;
  console.log(`Uploading to extension ${itemId} ...`);
  const res = await fetch(
    `https://www.googleapis.com/upload/chromewebstore/v1.1/items/${itemId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'x-goog-api-version': '2',
      },
      body: zipBuffer,
    }
  );
  const json = await res.json();
  console.log('Upload response:', JSON.stringify(json, null, 2));

  if (!res.ok) {
    throw new Error(`Upload HTTP ${res.status}`);
  }
  if (json.uploadState && json.uploadState !== 'SUCCESS') {
    const errors = (json.itemError || []).map(e => `${e.error_code}: ${e.error_detail}`).join('\n  ');
    throw new Error(`Upload state ${json.uploadState}\n  ${errors}`);
  }
  return json;
}

// ---------------------------------------------------------------------------
// 公開
// ---------------------------------------------------------------------------
async function publish(accessToken) {
  if (process.env.CWS_SKIP_PUBLISH === '1') {
    console.log('CWS_SKIP_PUBLISH=1 set, skipping publish step.');
    return null;
  }

  const itemId = process.env.CWS_EXTENSION_ID;
  const target = process.env.CWS_PUBLISH_TARGET || 'default';
  console.log(`Publishing (target=${target}) ...`);

  const res = await fetch(
    `https://www.googleapis.com/chromewebstore/v1.1/items/${itemId}/publish?publishTarget=${encodeURIComponent(target)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'x-goog-api-version': '2',
        'Content-Length': '0',
      },
    }
  );
  const json = await res.json();
  console.log('Publish response:', JSON.stringify(json, null, 2));

  if (!res.ok) {
    throw new Error(`Publish HTTP ${res.status}`);
  }
  // status は string array の可能性あり: ["OK"] / ["NOT_AUTHORIZED"] / ["ITEM_PENDING_REVIEW"] 等
  const statuses = Array.isArray(json.status) ? json.status : [json.status];
  if (!statuses.includes('OK') && !statuses.includes('ITEM_PENDING_REVIEW')) {
    console.warn('WARN: publish returned non-OK status. Check the response above.');
  }
  return json;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// 確認プロンプト: zip アップロード前にストア掲載情報の更新が済んでいるか
// （アップロード後は審査ロックで Detailed description が編集できなくなる）
// ---------------------------------------------------------------------------
async function confirmStoreInfoUpdated() {
  if (SKIP_CONFIRM) {
    console.log('--yes flag: skipping store info confirmation.');
    return;
  }
  if (!process.stdin.isTTY) {
    // 非対話環境（CI など）で --yes 無しは安全のため拒否
    console.error('ERROR: non-interactive environment but --yes was not given.');
    console.error('       Pass --yes to acknowledge that store info has been updated already.');
    process.exit(1);
  }

  console.log('');
  console.log('============================================================');
  console.log('⚠️  IMPORTANT: After this upload, the store listing fields');
  console.log('   (Detailed description / screenshots) will be LOCKED until');
  console.log('   review completes (typically a few days).');
  console.log('');
  console.log('   Have you ALREADY updated the store listing on');
  console.log('   https://chrome.google.com/webstore/devconsole ?');
  console.log('   See docs/release-checklist.md section 3-A.');
  console.log('============================================================');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise(resolve => {
    rl.question('Type "yes" to continue, anything else to abort: ', a => {
      rl.close();
      resolve(a.trim().toLowerCase());
    });
  });
  if (answer !== 'yes' && answer !== 'y') {
    console.log('Aborted. Update store listing first, then re-run.');
    process.exit(0);
  }
}

(async () => {
  try {
    await confirmStoreInfoUpdated();
    const token = await getAccessToken();
    await uploadZip(token);
    await publish(token);
    console.log('');
    console.log('=========================================================');
    console.log('Upload + publish trigger sent successfully.');
    console.log('Note: Detailed description / screenshots are NOT updated by this script.');
    console.log('      They should have been updated BEFORE this upload (see release-checklist.md 3-A).');
    console.log('=========================================================');
  } catch (e) {
    console.error('FAILED:', e.message);
    process.exit(1);
  }
})();
