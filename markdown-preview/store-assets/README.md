# Chrome Web Store 申請ガイド

## 必要なファイル一覧

### アイコン画像（PNG形式に変換が必要）

| ファイル | サイズ | 用途 |
|---------|--------|------|
| `icon-16.svg` | 16x16 | ツールバーアイコン |
| `icon-48.svg` | 48x48 | 拡張機能管理画面 |
| `icon-128.svg` | 128x128 | ストア掲載、インストール時 |

### プロモーション画像（PNG形式に変換が必要）

| ファイル | サイズ | 用途 |
|---------|--------|------|
| `promo-small-440x280.svg` | 440x280 | 小さなプロモーションタイル |
| `promo-marquee-1400x560.svg` | 1400x560 | マーキープロモーション |

### スクリーンショット（1280x800 または 640x400 推奨）

実際のアプリケーション画面のスクリーンショットを1〜5枚用意してください：
1. メイン画面（Markdownプレビュー表示）
2. テーマ設定パネル
3. フォント選択ドロップダウン
4. ダークテーマでのプレビュー
5. ライトテーマでのプレビュー

### 説明文

| ファイル | 内容 |
|---------|------|
| `store-listing-ja.md` | 日本語の説明文 |
| `store-listing-en.md` | 英語の説明文 |
| `privacy-policy.md` | プライバシーポリシー |

## SVGからPNGへの変換

SVGファイルをPNGに変換する方法：

### 方法1: オンラインツール
- [CloudConvert](https://cloudconvert.com/svg-to-png)
- [SVG to PNG Converter](https://svgtopng.com/)

### 方法2: コマンドライン（ImageMagick）
```bash
# ImageMagickをインストール
brew install imagemagick

# 変換
convert -background none icon-128.svg -resize 128x128 icon-128.png
convert -background none icon-48.svg -resize 48x48 icon-48.png
convert -background none icon-16.svg -resize 16x16 icon-16.png
```

### 方法3: Inkscape
```bash
inkscape icon-128.svg --export-type=png --export-filename=icon-128.png
```

## 申請手順

### 1. デベロッパーアカウント登録
1. [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/) にアクセス
2. $5の登録料を支払い（初回のみ）
3. デベロッパーアカウントを作成

### 2. 拡張機能のビルド
```bash
npm run build
```

### 3. ZIPファイルの作成
```bash
cd dist
zip -r ../markdown-preview.zip .
```

### 4. アップロードと設定

1. Developer Dashboard で「New Item」をクリック
2. ZIPファイルをアップロード
3. 以下の情報を入力：

#### 基本情報
- **言語**: 日本語（主要）、英語
- **カテゴリ**: 生産性向上 (Productivity)
- **可視性**: 公開

#### 説明
- `store-listing-ja.md` と `store-listing-en.md` の内容をコピー

#### 画像
- アイコン: 128x128 PNG
- スクリーンショット: 1〜5枚
- プロモーション画像: 440x280（任意）、1400x560（任意）

#### プライバシー
- **単一用途の説明**: Markdownファイルのプレビュー
- **権限の正当性**:
  - `storage`: ユーザーの設定（テーマ、フォントサイズなど）を保存するため
- **ホスト権限**: 不要
- **リモートコード**: なし
- **データ使用の開示**:
  - 個人を特定できる情報は収集しない
  - 位置情報は収集しない
  - 健康情報は収集しない
  - 財務情報は収集しない
  - 認証情報は収集しない
  - ウェブ閲覧履歴は収集しない

#### プライバシーポリシー
- `privacy-policy.md` の内容をホスティングし、URLを入力
- GitHub Pagesや自身のウェブサイトに掲載可能

### 5. 審査申請
- すべての情報を入力したら「Submit for Review」をクリック
- 審査には通常1〜3営業日かかります

## 審査でよく指摘される点

1. **権限の正当性**: 使用する権限の理由を明確に説明
2. **プライバシーポリシー**: 必ず公開URLで提供
3. **スクリーンショット**: 実際の機能を示す高品質な画像
4. **説明文**: 機能を正確に記述、誇大表現を避ける

## 更新時の手順

1. `manifest.json` の `version` を更新
2. ビルドして新しいZIPを作成
3. Developer Dashboard で新バージョンをアップロード
4. 変更内容の説明を入力して申請
