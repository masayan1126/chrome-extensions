# Chrome拡張機能 ストア申請ガイド

Chrome Web Storeへの拡張機能公開に必要な準備と手順をまとめたガイドです。

---

## 目次

1. [事前準備](#1-事前準備)
2. [必要なファイル一覧](#2-必要なファイル一覧)
3. [manifest.json の設定](#3-manifestjson-の設定)
4. [アイコン画像の作成](#4-アイコン画像の作成)
5. [ストア掲載用画像の作成](#5-ストア掲載用画像の作成)
6. [多言語対応（国際化）](#6-多言語対応国際化)
7. [プライバシーポリシーの作成](#7-プライバシーポリシーの作成)
8. [ストア説明文の作成](#8-ストア説明文の作成)
9. [ビルドとパッケージング](#9-ビルドとパッケージング)
10. [申請手順](#10-申請手順)
11. [審査でよくある指摘事項](#11-審査でよくある指摘事項)
12. [更新時の手順](#12-更新時の手順)

---

## 1. 事前準備

### デベロッパーアカウント登録

1. [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/) にアクセス
2. Googleアカウントでログイン
3. **$5の登録料を支払い**（初回のみ、1回限り）
4. デベロッパー情報を入力

### 必要なもの

- Googleアカウント
- クレジットカード（登録料支払い用）
- プライバシーポリシーのURL（公開可能なWebページ）

---

## 2. 必要なファイル一覧

```
your-extension/
├── manifest.json                    # 拡張機能の設定ファイル
├── _locales/                        # 多言語対応
│   ├── ja/
│   │   └── messages.json
│   └── en/
│       └── messages.json
├── icons/                           # アイコン画像（PNG形式必須）
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
├── [その他のソースファイル]
│
└── store-assets/                    # ストア申請用（ZIPには含めない）
    ├── screenshot-1.png             # スクリーンショット 1280x800
    ├── screenshot-2.png
    ├── promo-small-440x280.png      # 小プロモーションタイル（任意）
    ├── promo-large-1400x560.png     # マーキープロモーション（任意）
    ├── store-listing-ja.md          # 日本語説明文
    ├── store-listing-en.md          # 英語説明文
    └── privacy-policy.md            # プライバシーポリシー
```

---

## 3. manifest.json の設定

### 基本構成

```json
{
  "manifest_version": 3,
  "name": "__MSG_extensionName__",
  "description": "__MSG_extensionDescription__",
  "version": "1.0.0",
  "default_locale": "ja",
  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  "action": {
    "default_icon": {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    },
    "default_title": "__MSG_extensionName__",
    "default_popup": "index.html"
  },
  "permissions": [
    // 必要な権限のみ記載
  ]
}
```

### 重要なポイント

| 項目 | 説明 |
|------|------|
| `manifest_version` | 必ず `3` を指定（Manifest V2は非推奨） |
| `name` | 45文字以内 |
| `description` | 132文字以内 |
| `version` | セマンティックバージョニング推奨（例: 1.0.0） |
| `default_locale` | 国際化する場合は必須 |
| `icons` | **PNG形式必須**（SVGは不可） |

### よく使う permissions

```json
"permissions": [
  "storage",           // データの保存
  "activeTab",         // 現在のタブへのアクセス
  "tabs",              // タブ情報の取得
  "notifications",     // 通知の表示
  "contextMenus",      // 右クリックメニュー
  "alarms",            // タイマー/アラーム
  "downloads"          // ダウンロード管理
]
```

### Content Security Policy（CSP）

外部リソースを使用する場合：

```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com"
}
```

---

## 4. アイコン画像の作成

### 必要なサイズ

| サイズ | 用途 |
|--------|------|
| 16x16 | ツールバー、ファビコン |
| 48x48 | 拡張機能管理画面 |
| 128x128 | Chrome Web Store、インストール時 |

### 要件

- **形式**: PNG（SVGは不可）
- **背景**: 透過または塗りつぶし
- **角丸**: 推奨（16px程度の角丸）

### SVGからPNGへの変換方法

#### 方法1: ブラウザベースの変換ツール

```html
<!DOCTYPE html>
<html>
<head>
  <title>SVG to PNG Converter</title>
</head>
<body>
  <canvas id="canvas" style="display:none;"></canvas>
  <script>
    const svgContent = `YOUR_SVG_CONTENT_HERE`;

    function downloadIcon(size) {
      const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = size;
      canvas.height = size;

      const img = new Image();
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);

      img.onload = function() {
        ctx.drawImage(img, 0, 0, size, size);
        canvas.toBlob(function(blob) {
          const link = document.createElement('a');
          link.download = `icon-${size}.png`;
          link.href = URL.createObjectURL(blob);
          link.click();
        }, 'image/png');
      };
      img.src = url;
    }

    // 使用例
    downloadIcon(128);
  </script>
</body>
</html>
```

#### 方法2: ImageMagick（コマンドライン）

```bash
# インストール
brew install imagemagick

# 変換
convert -background none icon.svg -resize 128x128 icon-128.png
convert -background none icon.svg -resize 48x48 icon-48.png
convert -background none icon.svg -resize 16x16 icon-16.png
```

#### 方法3: オンラインツール

- [CloudConvert](https://cloudconvert.com/svg-to-png)
- [SVG to PNG Converter](https://svgtopng.com/)

---

## 5. ストア掲載用画像の作成

### スクリーンショット（必須）

| 項目 | 仕様 |
|------|------|
| サイズ | 1280x800 または 640x400 |
| 形式 | PNG または JPEG |
| 枚数 | 1〜5枚 |

#### 含めるべき内容

1. メイン機能の画面
2. 設定画面
3. 特徴的な機能のデモ
4. ビフォー/アフター（該当する場合）

### プロモーション画像（任意だが推奨）

| 種類 | サイズ | 用途 |
|------|--------|------|
| 小タイル | 440x280 | ストア検索結果 |
| マーキー | 1400x560 | ストアトップページ |

### 画像作成のヒント

- ダークテーマで統一すると見栄えが良い
- 実際の使用シーンを見せる
- テキストは最小限に
- 高解像度で作成

---

## 6. 多言語対応（国際化）

### ディレクトリ構造

```
_locales/
├── ja/
│   └── messages.json
└── en/
    └── messages.json
```

### messages.json の形式

```json
{
  "extensionName": {
    "message": "拡張機能の名前",
    "description": "拡張機能の名前（開発者向けコメント）"
  },
  "extensionDescription": {
    "message": "拡張機能の説明文（132文字以内）",
    "description": "拡張機能の説明"
  }
}
```

### 使用方法

manifest.json や HTML/JS 内で参照：

```json
// manifest.json
"name": "__MSG_extensionName__"
```

```javascript
// JavaScript
chrome.i18n.getMessage("extensionName")
```

---

## 7. プライバシーポリシーの作成

### 必須項目

1. **収集するデータ**（収集しない場合もその旨を明記）
2. **データの使用目的**
3. **データの保存場所**（ローカル/サーバー）
4. **第三者への共有の有無**
5. **連絡先**

### テンプレート

```markdown
# Privacy Policy for [拡張機能名]

Last Updated: [日付]

## Data Collection

This extension does not collect any personal data.

The extension only stores the following information locally:
- [保存する設定項目]

## Data Storage

All data is stored locally using Chrome's storage API.
No data is transmitted to external servers.

## Third-Party Services

[使用する外部サービスがあれば記載]

## Contact

[連絡先]
```

### 公開方法

- GitHub Pages
- 自身のウェブサイト
- Notion（公開ページ）

---

## 8. ストア説明文の作成

### 短い説明（132文字以内）

```
[主な機能]。[特徴1]、[特徴2]、[特徴3]に対応。
```

### 詳細な説明

```markdown
[拡張機能名]は、[主な目的]のためのChrome拡張機能です。

### 主な機能

📖 **[機能1]**
- 詳細説明

🎨 **[機能2]**
- 詳細説明

### 使い方

1. 手順1
2. 手順2
3. 手順3

### プライバシー

- 個人データは収集しません
- すべてのデータはローカルに保存されます
```

---

## 9. ビルドとパッケージング

### ビルド

```bash
npm run build
```

### ZIPファイルの作成

```bash
cd dist
zip -r ../extension.zip .
```

### 除外すべきファイル

- `node_modules/`
- `.git/`
- `store-assets/`
- `*.map` ファイル（ソースマップ）
- テストファイル

### ZIP作成スクリプト例

```bash
#!/bin/bash
# build-extension.sh

npm run build

cd dist

# 不要なファイルを削除
rm -rf *.map

# ZIP作成
zip -r ../extension.zip . -x "*.DS_Store" -x "__MACOSX/*"

echo "Created extension.zip"
```

---

## 10. 申請手順

### Step 1: Developer Dashboardにアクセス

[Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)

### Step 2: 新しいアイテムを追加

1. 「新しいアイテム」をクリック
2. ZIPファイルをアップロード

### Step 3: ストア掲載情報を入力

| 項目 | 内容 |
|------|------|
| 言語 | 日本語、英語など |
| 説明 | 短い説明、詳細な説明 |
| カテゴリ | 生産性向上、開発者ツールなど |
| スクリーンショット | 1〜5枚 |
| プロモーション画像 | 任意 |

### Step 4: プライバシー設定

| 項目 | 回答例 |
|------|--------|
| 単一用途の説明 | [拡張機能が何をするか1文で] |
| 権限の正当性 | [各権限を使う理由] |
| データ使用の開示 | [収集するデータの種類] |
| プライバシーポリシーURL | https://... |

### Step 5: 審査申請

- すべての情報を入力後「審査のために送信」をクリック
- 審査期間: 通常1〜3営業日

---

## 11. 審査でよくある指摘事項

### 1. 権限の過剰要求

❌ 不要な権限を要求している

```json
// NG: 使わない権限を含めている
"permissions": ["tabs", "history", "bookmarks", "storage"]
```

✅ 必要最小限の権限のみ

```json
// OK: 実際に使う権限のみ
"permissions": ["storage"]
```

### 2. 説明と機能の不一致

- 説明文に書いた機能が実装されていない
- 実装されている機能が説明文にない

### 3. アイコン形式の問題

❌ SVG形式のアイコン

```json
"icons": {
  "128": "icon.svg"  // NG
}
```

✅ PNG形式のアイコン

```json
"icons": {
  "128": "icons/icon-128.png"  // OK
}
```

### 4. プライバシーポリシーの問題

- URLが無効
- 内容が不十分
- 拡張機能名と一致しない

### 5. マニフェストの問題

- Manifest V2を使用（V3必須）
- 必須フィールドの欠落

---

## 12. 更新時の手順

### バージョン番号の更新

```json
// manifest.json
"version": "1.0.1"  // インクリメント
```

### 更新手順

1. `manifest.json` の `version` を更新
2. 変更をビルド
3. 新しいZIPを作成
4. Developer Dashboard で「パッケージをアップロード」
5. 変更内容を入力（リリースノート）
6. 審査申請

### バージョニング規則（推奨）

```
MAJOR.MINOR.PATCH

1.0.0 → 1.0.1  # バグ修正
1.0.1 → 1.1.0  # 新機能追加
1.1.0 → 2.0.0  # 破壊的変更
```

---

## チェックリスト

### 申請前

- [ ] manifest.json が Manifest V3
- [ ] アイコンが PNG 形式（16, 48, 128px）
- [ ] 権限が必要最小限
- [ ] プライバシーポリシーURLが有効
- [ ] スクリーンショットが1枚以上
- [ ] 説明文が132文字以内（短い説明）
- [ ] 多言語対応（必要な場合）
- [ ] ビルドが正常に完了
- [ ] ZIPに不要ファイルが含まれていない

### 申請後

- [ ] 審査結果のメール確認
- [ ] 指摘事項への対応（あれば）
- [ ] 公開後の動作確認

---

## 参考リンク

- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Publishing in the Chrome Web Store](https://developer.chrome.com/docs/webstore/publish/)
