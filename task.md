# Article Date Detector リリースタスク

## 現在の状況

| 項目 | 状態 |
|------|------|
| 拡張機能コード | ✅ 完了 |
| manifest.json (v1.0.0) | ✅ 完了 |
| i18n対応 (en/ja) | ✅ 完了 |
| アイコン (16/48/128px) | ✅ 完了 |
| ZIPパッケージ | ✅ 完了 (16KB) |
| README.md | ✅ 完了 |
| PRIVACY_POLICY.md | ✅ 完了 (英語+日本語) |
| STORE_LISTING.md | ✅ 完了 (英語+日本語) |

---

## Chrome Web Store 公開に必要な残タスク

### 1. スクリーンショットの作成（必須）
- **最低1枚、最大5枚** (1280x800 または 640x400)
- STORE_LISTING.md に記載の4パターンを推奨:
  1. ニュース記事で緑色バッジが展開表示されている画面
  2. 赤色バッジで「1年以上前」と表示されている画面
  3. 拡張機能ポップアップの詳細表示画面
  4. バッジが縮小された状態の画面

### 2. プロモーション画像の作成（推奨）
- **Small Promo Tile**: 440x280px（ストア掲載に推奨）
- **Marquee Promo Tile**: 1400x560px（任意、フィーチャー掲載用）

### 3. プライバシーポリシーの公開URL用意（必須）
- PRIVACY_POLICY.md を公開URLでホスティングする必要あり
- 方法の候補:
  - GitHub Pages で公開
  - GitHub リポジトリのファイルを直接参照
  - 個人サイト・ブログに設置

### 4. Chrome Web Store デベロッパーアカウント（必須）
- 未登録の場合: [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/) で登録
- 初回登録費: $5（一度のみ）

### 5. Chrome Web Store への申請・提出
- デベロッパーダッシュボードから新しいアイテムを追加
- 提出時に入力する情報:
  - ZIPファイルのアップロード
  - ストア掲載テキスト（STORE_LISTING.md の内容）
  - スクリーンショット
  - プロモ画像
  - プライバシーポリシーURL
  - カテゴリ: Productivity
  - 言語: English, Japanese
- 審査期間: 通常数日〜1週間程度

---

## 参考: 他の拡張機能のリリース実績

| 拡張機能 | バージョン | リリース文書 | スクリーンショット |
|---------|-----------|------------|----------------|
| web-annotator | v1.0.1 | README + PRIVACY_POLICY + STORE_LISTING | screenshot_1280x800.jpg あり |
| canvas-whiteboard | v1.0.1 | README + PRIVACY_POLICY + STORE_LISTING | なし |
| article-date-detector | v1.0.0 | README + PRIVACY_POLICY + STORE_LISTING | **未作成** |
