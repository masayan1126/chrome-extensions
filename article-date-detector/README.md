# Article Date Detector - Chrome Extension

記事ページを開いた瞬間に公開日・更新日を検出し、鮮度を色分けで表示するChrome拡張機能

## 機能

### 1. 自動日付検出（6段階の検出エンジン）
- JSON-LD 構造化データ
- Open Graph メタタグ
- HTML メタタグ（datePublished, DC.date.issued 等）
- HTML5 time 要素
- Microdata（itemprop="datePublished"）
- CSS ヒューリスティクス（.post-date, .entry-date 等）

### 2. フローティングバッジ
- ページ右上に公開日・更新日を表示
- 5秒後に自動縮小、ホバーで再展開
- 日付要素へのスクロールボタン

### 3. 鮮度の色コーディング
| 色 | 期間 | 意味 |
|----|------|------|
| 🟢 緑 | 1か月以内 | 新しい |
| 🟡 黄 | 1〜6か月 | やや古い |
| 🟠 オレンジ | 6〜12か月 | 古い |
| 🔴 赤 | 1年以上 | 非常に古い |

### 4. デュアルタイムゾーン表示
- ローカル時間（JST等）と UTC を並列表示
- 海外記事でも日付のずれを一目で把握

### 5. ポップアップ詳細表示
- 拡張機能アイコンクリックで検出結果の詳細を確認
- 検出ソース（JSON-LD, Open Graph 等）の表示
- サイトごとの有効/無効切替

## インストール方法

### 開発者モードでインストール

1. Chrome で `chrome://extensions/` を開く
2. 右上の「デベロッパーモード」をオンにする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `article-date-detector` フォルダを選択

### ZIP からインストール

1. `article-date-detector-v1.0.0.zip` を解凍
2. 上記の手順で解凍したフォルダを読み込む

## 使い方

1. 記事ページを開くと、右上にフローティングバッジが自動表示
2. バッジには公開日・更新日と経過時間が表示される
3. 縮小状態ではホバーまたはクリックで再展開
4. ↗ ボタンで記事内の日付要素へスクロール
5. × ボタンでバッジを非表示
6. ツールバーの拡張機能アイコンで詳細情報を確認

## 技術仕様

- Manifest v3
- Chrome Storage API（sync、無効化サイトリスト管理）
- Content Scripts（日付検出 + フローティングUI）
- Service Worker（アイコンバッジ更新）

## ファイル構成

```
article-date-detector/
├── manifest.json          # 拡張機能マニフェスト
├── background.js          # Service Worker
├── content.js             # 日付検出エンジン + フローティングUI
├── content.css            # バッジスタイル
├── popup/
│   ├── popup.html         # ポップアップUI
│   ├── popup.css          # ポップアップスタイル
│   └── popup.js           # ポップアップロジック
├── icons/
│   ├── icon.svg           # ソースアイコン
│   ├── icon16.png         # 16x16 アイコン
│   ├── icon48.png         # 48x48 アイコン
│   └── icon128.png        # 128x128 アイコン
├── _locales/
│   ├── en/messages.json   # 英語メッセージ
│   └── ja/messages.json   # 日本語メッセージ
├── README.md              # このファイル
├── PRIVACY_POLICY.md      # プライバシーポリシー
└── STORE_LISTING.md       # ストア掲載テキスト
```

## データ保存について

- 無効化サイトリストのみ `chrome.storage.sync` に保存
- 記事の日付情報はページ読み込み時に都度検出（保存しない）
- 外部サーバーへの通信は一切なし

## ライセンス

MIT License
