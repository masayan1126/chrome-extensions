# Chrome Web Store API 自動アップロード セットアップガイド

このドキュメントは Web Annotator の zip パッケージを Chrome Web Store API で自動アップロード/公開するための初回セットアップ手順をまとめたものです。

> ⚠️ **重要な制約**: Chrome Web Store API でできるのは **「zip アップロード」と「公開トリガー」のみ**。
> ストア掲載情報の Detailed description（詳細な説明）・スクリーンショット・カテゴリ・サポート URL の更新は **API 非対応** のため、手動更新が必要です。
> それでも、毎リリースごとの zip アップロード作業は自動化できます。

## 全体フロー

```
[初回のみ]
1. Extension ID の確認
2. Google Cloud Project 準備
3. Chrome Web Store API 有効化
4. OAuth 同意画面の設定
5. OAuth Client ID / Secret 作成
6. Refresh Token 取得 (scripts/get-cws-refresh-token.mjs)
7. .env に環境変数を保存

[毎リリース時]
$ node scripts/upload-to-cws.mjs ./web-annotator-v1.X.Y.zip
↓ 自動で:
- access token 取得
- zip アップロード
- 審査用に公開トリガー
- ※ Detailed description は別途 Web UI で手動更新
```

---

## Step 1: Extension ID の確認

Chrome Web Store Developer Dashboard を開き、Web Annotator のアイテムを選択。
URL の最後にある UUID 形式の文字列が Extension ID です。

例:
```
https://chrome.google.com/webstore/devconsole/329b08a0-c72b-41e1-bc65-961abd55d356
                                              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                              これが Extension ID
```

> ※ 公開後の `chromewebstore.google.com/detail/<32 文字英数>` の ID とは別物。
> Developer Dashboard の URL の方が API で使う ID です。

`CWS_EXTENSION_ID` として後で .env に記載します。

---

## Step 2: Google Cloud Project の準備

1. https://console.cloud.google.com/ にアクセス
2. 上部のプロジェクト選択メニュー → 「新しいプロジェクト」 (既存があれば再利用可)
   - 名前例: `chrome-extensions-publishing`
3. 作成完了後、そのプロジェクトを選択した状態にしておく

---

## Step 3: Chrome Web Store API の有効化

1. 左メニュー → 「APIとサービス」 → 「ライブラリ」
2. 検索ボックスで `Chrome Web Store API` を検索
3. 結果の `Chrome Web Store API` をクリック
4. 「有効にする」ボタン

---

## Step 4: OAuth 同意画面の設定

1. 左メニュー → 「APIとサービス」 → 「OAuth 同意画面」
2. **User Type**: `外部 (External)` を選択 → 「作成」
3. アプリ情報:
   - アプリ名: `Web Annotator Publisher` (任意)
   - ユーザーサポートメール: 自分の Gmail
   - デベロッパーの連絡先: 自分の Gmail
4. 保存して次へ
5. **スコープ** 画面はそのまま「保存して次へ」(API 呼び出し時にスコープ指定するため、ここで追加不要)
6. **テストユーザー**: 「ADD USERS」で自分の Google アカウントを追加 (必須)
7. 「保存して次へ」 → 「ダッシュボードに戻る」

> ※ 公開する必要はありません。テストモードのままで API は使用可能です。
> ただし refresh token の有効期限が 7 日 (テストモード) になるので、本番運用するなら「公開ステータス」を本番に切り替えると無期限になります。

---

## Step 5: OAuth Client ID の作成

1. 左メニュー → 「APIとサービス」 → 「認証情報」
2. 「+ 認証情報を作成」 → 「OAuth クライアント ID」
3. **アプリケーションの種類**: `デスクトップアプリ`
4. 名前: `web-annotator-publisher` (任意)
5. 「作成」 → ダイアログで **Client ID** と **Client Secret** が表示
   - 「JSON をダウンロード」しておくと安心
6. 控えた Client ID と Secret を後で .env に書きます

`CWS_CLIENT_ID` / `CWS_CLIENT_SECRET` として保存。

---

## Step 6: Refresh Token の取得

OAuth 認可フローを通して長期有効な refresh token を取得します。
この手順を補助するスクリプトが `scripts/get-cws-refresh-token.mjs` です。

```bash
cd web-annotator

# 環境変数を一時的にセット（.env でも可）
export CWS_CLIENT_ID='YOUR_CLIENT_ID.apps.googleusercontent.com'
export CWS_CLIENT_SECRET='YOUR_CLIENT_SECRET'

node scripts/get-cws-refresh-token.mjs
```

スクリプトの動作:
1. ローカルの `http://127.0.0.1:8765` で短命 HTTP サーバを起動
2. ブラウザで開くべき認可 URL を表示
3. 認可 URL を Cmd+クリックで開き、テストユーザーとして承認
4. リダイレクトでローカルサーバが authorization code を受け取る
5. code を refresh token に交換して画面表示
6. `.env` に追記する形でガイド表示

---

## Step 7: .env を作成

`web-annotator/.env` を作成 (`.gitignore` で git 管理外):

```bash
# Web Annotator → Developer Dashboard URL の UUID
CWS_EXTENSION_ID=329b08a0-c72b-41e1-bc65-961abd55d356

# Step 5 で取得
CWS_CLIENT_ID=xxxxxxxxxxxxxxxx.apps.googleusercontent.com
CWS_CLIENT_SECRET=xxxxxxxxxxxxxxxxxx

# Step 6 で取得
CWS_REFRESH_TOKEN=1//xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**絶対に git にコミットしないでください**。`.gitignore` で除外済みです。

---

## 毎リリース時のアップロード手順

```bash
# 1. zip を生成（または既存のものを使用）
rm -f web-annotator-v1.X.Y.zip
zip -r web-annotator-v1.X.Y.zip _locales background.js content.css content.js manifest.json popup icons/icon16.png icons/icon48.png icons/icon128.png

# 2. API でアップロード + 公開
node scripts/upload-to-cws.mjs ./web-annotator-v1.X.Y.zip

# 3. Detailed description は Web UI で手動更新
#    (STORE_LISTING.md の最新内容を貼り付け)
```

---

## トラブルシューティング

### `invalid_grant` エラー
- Refresh token の有効期限切れ。Step 6 を再実行して再取得。
- OAuth 同意画面が「テストモード」のままだと 7 日で失効。本番モードへの切替を検討。

### `ITEM_NOT_UPDATABLE` エラー
- 直前の更新が「審査中」のまま。Web UI で審査状況を確認し、完了/拒否されてから再アップロード。

### `403 Forbidden`
- Chrome Web Store API が無効化されている → Step 3 を再確認
- OAuth スコープが不足 → Step 6 のスクリプトで `https://www.googleapis.com/auth/chromewebstore` を要求しているか確認

---

## 公式ドキュメント参照

- [Chrome Web Store API](https://developer.chrome.com/docs/webstore/api/)
- [Use the Chrome Web Store Publish API](https://developer.chrome.com/docs/webstore/using-api/)
- [OAuth 2.0 for Mobile & Desktop Apps](https://developers.google.com/identity/protocols/oauth2/native-app)

---

## （将来）GitHub Actions 化

`scripts/upload-to-cws.mjs` を CI で実行する場合、以下の secrets を GitHub に登録します:
- `CWS_EXTENSION_ID`
- `CWS_CLIENT_ID`
- `CWS_CLIENT_SECRET`
- `CWS_REFRESH_TOKEN`

`.github/workflows/release-cws.yml` の最小例:

```yaml
name: Publish to Chrome Web Store

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    if: startsWith(github.event.release.tag_name, 'v')
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Build zip
        working-directory: web-annotator
        run: |
          rm -f web-annotator-*.zip
          zip -r "web-annotator-${{ github.event.release.tag_name }}.zip" \
            _locales background.js content.css content.js manifest.json popup \
            icons/icon16.png icons/icon48.png icons/icon128.png
      - name: Upload to Chrome Web Store
        working-directory: web-annotator
        env:
          CWS_EXTENSION_ID: ${{ secrets.CWS_EXTENSION_ID }}
          CWS_CLIENT_ID: ${{ secrets.CWS_CLIENT_ID }}
          CWS_CLIENT_SECRET: ${{ secrets.CWS_CLIENT_SECRET }}
          CWS_REFRESH_TOKEN: ${{ secrets.CWS_REFRESH_TOKEN }}
        run: node scripts/upload-to-cws.mjs "./web-annotator-${{ github.event.release.tag_name }}.zip"
```

> ※ Detailed description はこの workflow では更新されません。リリース後に Web UI で手動更新してください。
