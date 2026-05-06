# Web Annotator リリースチェックリスト

毎リリース時にこのファイルを開いて、上から順に消化してください。
**順序が重要です** — 特に Chrome Web Store の zip アップロード前に説明文を更新する点。

---

## 0. 事前準備 — 一度だけセットアップ

- [ ] `web-annotator/.env` が存在し、`CWS_EXTENSION_ID` / `CWS_CLIENT_ID` / `CWS_CLIENT_SECRET` / `CWS_REFRESH_TOKEN` が全て埋まっている
  - 未セットアップなら [`docs/cws-api-setup.md`](./cws-api-setup.md) Step 1〜7 を先に実施
- [ ] `gh` (GitHub CLI) が認証済み (`gh auth status`)

---

## 1. 機能完成 → コミット〜PR

- [ ] 実装完了、`feature-dev` フローでコード確認済み
- [ ] `manifest.json` の `version` を bump（例: `1.1.0` → `1.2.0`）
- [ ] `web-annotator-v<X.Y.Z>.zip` を再生成
  ```bash
  cd web-annotator
  rm -f web-annotator-v*.zip
  zip -r web-annotator-v<X.Y.Z>.zip \
    _locales background.js content.css content.js manifest.json popup \
    icons/icon16.png icons/icon48.png icons/icon128.png
  ```
- [ ] `STORE_LISTING.md` の Key Features / How to Use / Changelog を新バージョン用に更新
- [ ] `docs/release-notes-v<X.Y.Z>.md` を `internal-comms` スキルで作成
- [ ] semantic commit → push → PR 作成
- [ ] `pr-review-toolkit:review-pr` でレビュー（Critical 指摘ゼロまで修正）
- [ ] PR マージ → `git pull --ff-only origin main`

---

## 2. GitHub Release 作成

- [ ] タグ + Release を作成し zip を添付
  ```bash
  cd web-annotator
  gh release create v<X.Y.Z> \
    web-annotator-v<X.Y.Z>.zip \
    --repo masayan1126/chrome-extensions \
    --title "v<X.Y.Z> — <要約>" \
    --notes-file docs/release-notes-v<X.Y.Z>.md
  ```
- [ ] Issue が `Closes #N` で自動クローズされたか確認

---

## 3. Chrome Web Store 反映 — ⚠ **順序厳守** ⚠

**zip をアップロードすると審査キューに入り、ストア掲載情報の編集が数日ロックされます。先に説明文を更新してください。**

### 3-A. ストア掲載情報を先に更新（Web UI 手動）

- [ ] https://chrome.google.com/webstore/devconsole にログイン
- [ ] Web Annotator を選択
- [ ] **「ストア掲載情報」** タブを開く
- [ ] 「詳細な説明（英語）」を `STORE_LISTING.md` の **Detailed Description (English)** + Changelog (English) に置き換え
  - 注: Chrome Web Store 説明欄は **Markdown 非対応**。`**bold**` や `## heading` は文字としてそのまま表示される
  - 視認性のためには空行 + `===` などの ASCII 装飾に置き換えると見やすい
- [ ] 言語切替で日本語タブ → 「詳細な説明（日本語）」を **Detailed Description (Japanese)** + 更新履歴 (日本語) に置き換え
- [ ] （任意）スクリーンショット差し替え（新機能のスクショがあれば）
- [ ] **「項目を保存」** ボタンを押す（まだ「公開」は押さない！）
- [ ] 保存完了を確認したら次へ

### 3-B. zip アップロード + 公開トリガー（API）

- [ ] 直前に `git pull` で main 最新化
- [ ] zip アップロード:
  ```bash
  cd web-annotator
  node scripts/upload-to-cws.mjs ./web-annotator-v<X.Y.Z>.zip
  ```
- [ ] 出力に `uploadState: "SUCCESS"` と `status: ["OK"]` が出ることを確認
- [ ] エラーの場合は `docs/cws-api-setup.md` のトラブルシューティング参照
  - 404: Extension ID が違う or アカウント権限なし
  - invalid_grant: refresh token が期限切れ → 再取得

### 3-C. 反映確認

- [ ] Developer Dashboard で「審査ステータス」が `審査中` または `公開済み` になっているか
- [ ] 数日以内にストア（https://chromewebstore.google.com/detail/<EXTENSION_ID>）に新バージョンが表示されるか確認

---

## 4. 後始末

- [ ] `web-annotator-v<X.Y.Z>.zip` を git に commit（リポジトリ内に最新版を保持する運用の場合）
- [ ] 古い `web-annotator-v<X.Y.Z-1>.zip` を `git rm`（GitHub Releases に履歴があるので不要）
- [ ] `claude-md-management:revise-claude-md` で CLAUDE.md に新規学びがあれば反映

---

## 失敗事例（教訓）

### v1.1.0 リリース時 (2026-05-06)
- ❌ ストア掲載情報の更新前に zip を API でアップロードしてしまった
- 結果: 審査中ロックで Detailed description が編集不可になり、新機能の説明が古いままで審査に入った
- 教訓: **3-A を先に必ず実行する** → このチェックリストはその学びから整備された
