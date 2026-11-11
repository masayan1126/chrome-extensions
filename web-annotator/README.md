# Web Annotator - Chrome Extension

Webページにマーカー（ハイライト）と付箋を追加し、Markdownで出力できる注釈ツール

## 機能

### 1. テキストへのマーカー機能
- ドラッグ選択したテキストに色付きハイライトを付与
- 5色から選択可能（黄色、緑、シアン、ピンク、オレンジ）
- ページをリロードしても保持
- Ctrl/Cmd + クリックで削除

### 2. 付箋（コメント）機能
- ページ上の任意位置に付箋を配置
- ドラッグで移動可能
- 内容・位置はリロード後も保持
- 付箋の削除も可能

### 3. マーカー一覧とMarkdown出力
- ポップアップでマーカー・付箋の一覧を表示
- 「Markdownで出力」ボタンでダウンロード
- ファイル名は `<ページタイトル>.md`

### 4. 同じサイトの他ページの気づき表示（v1.2.0）
- 現在のページにアノテーションが無くても、同じドメイン（hostname）の他ページに付箋・マーカーがあればポップアップに一覧表示
- 各ページのマーカー／付箋の件数を表示し、クリックでそのページへ移動（既存タブがあればフォーカス、無ければ新規タブ）
- 「同じドメイン」は hostname 単位で判定（`news.example.com` と `blog.example.com` は別、www 有無も別、http/https は同一扱い）

## インストール方法

### 開発者モードでインストール

1. Chrome で `chrome://extensions/` を開く
2. 右上の「デベロッパーモード」をオンにする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `web-annotator` フォルダを選択

### ZIPからインストール

1. `web-annotator.zip` を解凍
2. 上記の手順で解凍したフォルダを読み込む

## 使い方

### ハイライトを追加
1. テキストをドラッグして選択
2. 右クリックでコンテキストメニューを表示
3. 「ハイライト」をクリック
4. （または）Ctrl/Cmd + Shift + H

### ハイライトを削除
- Ctrl/Cmd キーを押しながらハイライトをクリック
- または、ポップアップの一覧から削除

### 付箋を追加
1. Alt キーを押しながらダブルクリック
2. または、コンテキストメニューから「付箋を追加」

### 付箋を移動
- ヘッダー部分（黄色）をドラッグ

### 付箋を削除
- 付箋の × ボタンをクリック
- または、ポップアップの一覧から削除

### Markdownで出力
1. 拡張機能アイコンをクリックしてポップアップを開く
2. 「Markdownで出力」ボタンをクリック
3. `.md` ファイルが自動ダウンロード

## キーボードショートカット

| ショートカット | 機能 |
|---------------|------|
| Ctrl/Cmd + Shift + H | 選択テキストをハイライト |
| Alt + ダブルクリック | 付箋を追加 |
| Ctrl/Cmd + クリック | ハイライトを削除 |

## 技術仕様

- Manifest v3
- Chrome Storage API（ローカル保存）
- Content Scripts（ページ上の機能）
- Service Worker（バックグラウンド処理）

## ファイル構成

```
web-annotator/
├── manifest.json      # 拡張機能マニフェスト
├── background.js      # Service Worker
├── content.js         # コンテンツスクリプト
├── content.css        # コンテンツ用スタイル
├── popup/
│   ├── popup.html     # ポップアップUI
│   ├── popup.css      # ポップアップスタイル
│   └── popup.js       # ポップアップロジック
├── lib/
│   ├── domainAnnotations.js        # ドメイン単位の集計ロジック（純粋関数、background から importScripts）
│   ├── domainAnnotations.test.cjs  # 上記のテスト
│   └── parseMarkdownList.test.cjs  # インポート分割ロジックのテスト
├── icons/
│   ├── icon16.png     # 16x16 アイコン
│   ├── icon48.png     # 48x48 アイコン
│   └── icon128.png    # 128x128 アイコン
└── README.md          # このファイル
```

## データ保存について

- アノテーションはChromeのローカルストレージに保存
- URLごとにデータを管理
- 90日以上更新がなく、アノテーションが空のデータは自動削除

## アイコンのカスタマイズ

`icons/` フォルダ内のPNGファイルを差し替えることでアイコンを変更できます。
- icon16.png: 16x16 ピクセル
- icon48.png: 48x48 ピクセル
- icon128.png: 128x128 ピクセル

## テスト

ロジックは Node 標準のテストランナーでカバーされています。

```bash
node --test web-annotator/lib/parseMarkdownList.test.cjs
node --test web-annotator/lib/domainAnnotations.test.cjs
```

> `node --test web-annotator/lib/`（ディレクトリ指定）は本体ファイル `domainAnnotations.js` も拾おうとするため、テストファイルは個別パスで指定してください。

`parseMarkdownList` は `popup/popup.js` と `content.js` に二重実装されています（popup と content script は別 context のため module 共有不可）。**片方を修正したら必ずもう一方にも同じ差分を当て、上記テストを実行してください。**

`domainAnnotations.js`（ドメイン単位の集計ロジック）は `background.js` から `importScripts` で読み込まれます。chrome 非依存の純粋関数として実装されており、`domainAnnotations.test.cjs` で検証されます。**zip 同梱対象に必ず含めてください**（含め忘れると Service Worker が `importScripts` で起動失敗します）。

## ライセンス

MIT License
