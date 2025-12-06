# Chrome Web Store 申請ガイド

## 必要なファイル一覧

### 1. アイコン (完了)
- `public/icon-16.png` - 16x16px
- `public/icon-48.png` - 48x48px
- `public/icon-128.png` - 128x128px

### 2. プロモーション用タイル画像 (SVG作成済み - PNG変換必要)
| サイズ | ファイル | 必須 |
|--------|----------|------|
| 440x280 | `store/promotional/tile_440x280.svg` | 必須 |
| 920x680 | `store/promotional/tile_920x680.svg` | 任意 |

**PNG変換方法:**
1. ブラウザでSVGファイルを開く
2. スクリーンショットを撮るか、オンラインSVG→PNGコンバーターを使用
3. 推奨: https://svgtopng.com/ または https://cloudconvert.com/svg-to-png

### 3. スクリーンショット (1280x800 または 640x400)
ファイル: `store/screenshots/screenshot_mockup.html`

**スクリーンショット撮影手順:**
1. Chromeで `screenshot_mockup.html` を開く
2. DevTools (F12) を開く
3. デバイスツールバー (Ctrl+Shift+M) を有効化
4. サイズを 1280x800 に設定
5. 各セクションのスクリーンショットを撮影
6. 以下の4枚を作成:
   - `screenshot_1_main.png` - メインインターフェース
   - `screenshot_2_flowchart.png` - フローチャート例
   - `screenshot_3_export.png` - エクスポートダイアログ
   - `screenshot_4_colors.png` - カラーカスタマイズ

## ストア掲載情報

### 拡張機能名
**英語:** Canvas Whiteboard
**日本語:** Canvas Whiteboard

### 短い説明 (132文字以内)
**英語:** Draw shapes and connect them with arrows on any webpage. Perfect for brainstorming, diagrams, and visual note-taking.

**日本語:** Webページ上で図形を描き矢印で接続。ブレインストーミング、図解、ビジュアルノートに最適。

### 詳細説明
- 英語: `store/description_en.txt`
- 日本語: `store/description_ja.txt`

### カテゴリ
**推奨:** Productivity (生産性)

### 言語
- English
- Japanese (日本語)

## プライバシーポリシー
ファイル: `store/privacy_policy.txt`

Chrome Web Storeの申請時に、プライバシーポリシーのURLを入力する必要があります。
以下のいずれかの方法でホスティング:
1. GitHub Gistに公開
2. GitHub Pages
3. 自身のウェブサイト

## 権限の正当化 (申請時に必要)

| 権限 | 理由 |
|------|------|
| storage | ホワイトボードのデータと設定をローカルに保存するため |
| activeTab | ユーザーがアクションした時に現在のタブにホワイトボードを表示するため |
| scripting | Webページにホワイトボードキャンバスを挿入するため |

**注意:** `host_permissions` は削除済み。`activeTab` で十分なため、審査が早くなります。

## 申請チェックリスト

- [ ] 128x128 アイコンを確認
- [ ] 440x280 プロモーションタイル画像を準備 (PNG)
- [ ] スクリーンショット 1-5枚を準備 (1280x800)
- [ ] 詳細説明文を確認
- [ ] 短い説明文を確認 (132文字以内)
- [ ] プライバシーポリシーをホスティング
- [ ] 拡張機能をZIPパッケージ化
- [ ] 開発者アカウントに登録料 $5 を支払い済み

## ZIPパッケージ作成

```bash
cd canvas-whiteboard
npm run build
cd dist
zip -r ../canvas-whiteboard.zip .
```

## 申請URL
https://chrome.google.com/webstore/devconsole
