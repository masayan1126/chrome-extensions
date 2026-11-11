# Chrome ウェブストア掲載情報

## 基本情報

| 項目 | 内容 |
|---|---|
| 名前 | Phone Bench |
| カテゴリ | デベロッパー ツール |
| 言語 | 日本語（既定）、英語 |

## 概要（132文字以内）

**日本語**：localhost や公開中のページを、複数の iPhone の画面に並べて同時に確認。機種・向き・Safari 表示を切り替えて見比べられます。

**English**: Preview localhost and live pages on several iPhone screens side by side. Switch models, orientation, and Safari or home-screen mode.

## 詳しい説明（日本語）

作っているページを、iPhone で開いたときの見え方で確かめる拡張機能です。複数の機種を1つのタブに並べるので、画面の大きさによる崩れを一度に見つけられます。

■ 使い方
確認したいページでツールバーのボタンを押すだけ。並んだ iPhone すべてに、そのページが表示されます。localhost:3000 のような開発サーバーの URL もそのまま入力できます。

■ できること
・iPhone 17 Pro Max から iPhone SE（第3世代）まで10機種。最大12台を並べられます
・端末ごとに別の URL を開けます（本番と開発中の画面を並べて比べるなど）
・Safari 表示（アドレスバーとツールバーあり）とホーム画面アプリ表示を切り替え
・縦向き・横向きの切り替え
・スクロールの同期、端末ごとの戻る・進む・再読み込み
・「画面に合わせる」では全端末を同じ倍率で表示するので、画面の大きさの違いもそのまま比べられます
・iPhone の Safari として通信するので、スマートフォン向けのページが返ってきます

■ ご注意
・表示には Chrome の描画エンジンを使います。Safari 固有の描画の違いは再現できないため、最終確認は実機で行ってください
・タッチ操作はマウスのクリックとして届きます

■ プライバシー
開いた URL や設定はブラウザの中にだけ保存し、外部へ送信しません。通信の書き換えは、この拡張機能の画面のタブの中だけで行います。

## Detailed description (English)

See how your page looks on iPhone — on several models at once. Line up devices in one tab and catch layout breaks across screen sizes in a single glance.

HOW TO USE
Click the toolbar button on any page. Every iPhone on the bench opens it. Dev server URLs such as localhost:3000 work as typed.

FEATURES
- 10 models from iPhone 17 Pro Max to iPhone SE (3rd gen), up to 12 devices
- Open a different URL on each device (e.g. production vs. local)
- Safari mode (address bar and toolbar) or home-screen app mode
- Portrait and landscape
- Synced scrolling; back, forward and reload per device
- "Fit to window" uses one zoom level for all devices, so screen sizes stay comparable
- Requests are sent as iPhone Safari, so you get the mobile version of the site

NOTES
- Pages are rendered by Chrome's engine. Safari-specific rendering differences can't be reproduced — do a final check on a real device.
- Touch input arrives as mouse clicks.

PRIVACY
URLs and settings stay in your browser and are never sent anywhere. Request changes apply only inside this extension's own tab.

## 権限の説明（審査用）

| 権限 | 理由 |
|---|---|
| declarativeNetRequestWithHostAccess / ホスト権限 `<all_urls>` | 利用者が入力した任意の URL（localhost を含む）を、拡張機能のタブ内の iframe に iPhone として表示するため。User-Agent の差し替えと、埋め込みを拒むヘッダーの除去を、その拡張機能のタブ ID に限ったセッションルールで行う |
| storage | 端末の並びと設定を保存するため |
| contextMenus | 右クリックメニューから開くため |
| コンテンツスクリプト（全サイト） | 拡張機能のタブの iframe 内でだけ、navigator.userAgent などを iPhone の値にし、iframe 内の移動・スクロールを拡張機能の画面へ知らせるため。それ以外のページでは何もしない |

## 単一用途の説明

Web ページを iPhone の画面サイズと User-Agent で表示し、複数の機種で同時に確認するための開発者ツール。

## 画像

- アイコン：128×128（public/icons/icon-128.png）
- スクリーンショット：1280×800（docs/screenshot.png）
- プロモーション タイル（小）：440×280（store/promo-small-440x280.png）

## URL

- プライバシー ポリシー：https://github.com/masayan1126/chrome-extensions/blob/main/phone-bench/PRIVACY_POLICY.md
- サポート：https://github.com/masayan1126/chrome-extensions/issues

## プライバシーへの取り組み（ダッシュボード入力用・英語）

- 単一用途：Developer tool that shows web pages (including localhost dev servers) at iPhone screen sizes with an iPhone Safari user agent, so developers can check mobile layouts on several iPhone models side by side in one tab.
- リモートコード：使用しない
- データの使用：収集・送信するユーザーデータなし
