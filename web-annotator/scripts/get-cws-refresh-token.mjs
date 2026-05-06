#!/usr/bin/env node
// Chrome Web Store API 用の refresh token を取得する補助スクリプト。
// 詳細は docs/cws-api-setup.md を参照。
//
// 必要な環境変数: CWS_CLIENT_ID, CWS_CLIENT_SECRET
// 出力: refresh token を標準出力に表示し、.env に追記する形のガイドを表示する。
//
// 動作:
//   1. ローカル HTTP サーバを 127.0.0.1:8765 で起動
//   2. Google の認可 URL を表示（ユーザーがブラウザで開く）
//   3. ユーザー承認後、リダイレクトでローカルサーバが authorization code を受信
//   4. code を refresh token に交換して表示

import http from 'node:http';
import { URL } from 'node:url';

const CLIENT_ID = process.env.CWS_CLIENT_ID;
const CLIENT_SECRET = process.env.CWS_CLIENT_SECRET;
const REDIRECT_PORT = 8765;
const REDIRECT_URI = `http://127.0.0.1:${REDIRECT_PORT}`;
const SCOPE = 'https://www.googleapis.com/auth/chromewebstore';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('ERROR: CWS_CLIENT_ID and CWS_CLIENT_SECRET must be set in environment.');
  console.error('See docs/cws-api-setup.md Step 6.');
  process.exit(1);
}

const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
authUrl.searchParams.set('client_id', CLIENT_ID);
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', SCOPE);
authUrl.searchParams.set('access_type', 'offline');
// prompt=consent: 既に同意済みでも refresh token を必ず再発行させる
authUrl.searchParams.set('prompt', 'consent');

console.log('=========================================================');
console.log('Open this URL in your browser (logged in as a Test User):');
console.log('');
console.log(authUrl.toString());
console.log('');
console.log(`Waiting for redirect to ${REDIRECT_URI} ...`);
console.log('=========================================================');

const server = http.createServer(async (req, res) => {
  try {
    const reqUrl = new URL(req.url, REDIRECT_URI);
    const code = reqUrl.searchParams.get('code');
    const error = reqUrl.searchParams.get('error');

    if (error) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`OAuth error: ${error}\nClose this tab and check the terminal.`);
      console.error(`\nOAuth error: ${error}`);
      server.close();
      process.exit(1);
    }

    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('No authorization code in callback. Re-run the script.');
      return;
    }

    // 即座にレスポンスを返してブラウザを閉じやすく
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>Authorization received</h1><p>You can close this tab and return to the terminal.</p>');

    console.log('\nAuthorization code received. Exchanging for refresh token...');

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokenJson = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error('Token exchange failed:', tokenJson);
      server.close();
      process.exit(1);
    }

    if (!tokenJson.refresh_token) {
      console.error('No refresh_token in response. This usually means the consent was already granted.');
      console.error('Try revoking access at https://myaccount.google.com/permissions and re-running.');
      console.error('Response:', tokenJson);
      server.close();
      process.exit(1);
    }

    console.log('');
    console.log('=========================================================');
    console.log('SUCCESS! Add the following to web-annotator/.env :');
    console.log('=========================================================');
    console.log('');
    console.log(`CWS_REFRESH_TOKEN=${tokenJson.refresh_token}`);
    console.log('');
    console.log('Also confirm these are present:');
    console.log(`CWS_CLIENT_ID=${CLIENT_ID}`);
    console.log('CWS_CLIENT_SECRET=********  (the value you already have)');
    console.log('CWS_EXTENSION_ID=<your extension UUID from Developer Dashboard URL>');
    console.log('');
    console.log('=========================================================');

    server.close();
    process.exit(0);
  } catch (e) {
    console.error('Unexpected error:', e);
    server.close();
    process.exit(1);
  }
});

server.listen(REDIRECT_PORT, '127.0.0.1');
