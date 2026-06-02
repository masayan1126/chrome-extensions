# Web Annotator v1.2.0 Release Notes

Release date: 2026-06-02
Repository: [masayan1126/chrome-extensions](https://github.com/masayan1126/chrome-extensions) (`web-annotator/`)
Related issue: [#24](https://github.com/masayan1126/chrome-extensions/issues/24)
Related PR: [#25](https://github.com/masayan1126/chrome-extensions/pull/25)
Previous version: v1.1.1

---

## Section 1 — GitHub Releases (Developer-facing)

### TL;DR

- **NEW**: 同じドメイン（hostname）の「他ページ」に付箋・マーカーがあると、ポップアップ下部に一覧表示する「気づき」機能を追加（issue #24）。現在ページにアノテーションが無くても、同じサイトの別ページの存在に気づける。
- 一覧の各項目はマーカー／付箋の件数を表示し、クリックでそのページを開く（既存タブがあればフォーカス、無ければ新規タブ）。
- 「同じドメイン」は **hostname 単位**（`news.example.com` と `blog.example.com` は別、www 有無も別、http/https は同一扱い）。
- **storage スキーマ・権限ともに変更なし**。v1.1.1 のデータは無改修でそのまま対象になる。

### Background

issue #24:
> 特定のページだけでなく、ドメイン全体で付箋やマーカーを表示できるようにしたい。今見ているページには付箋がついていないが、実は同じドメインの他のページについていることがある。

従来アノテーションは「完全URL」をキーに `chrome.storage.local` へ保存され、ポップアップは現在ページ分しか表示しなかった。そのため、同じサイトの別ページに残した付箋・マーカーの存在に気づけなかった。

マーカーは XPath + テキストオフセットでそのページの DOM に固定されており、別ページの異なる DOM へ「同じマーカーを再現」することは技術的に困難。そこで本リリースでは **他ページのアノテーションを現在ページに重ねて描画するのではなく、「件数 + リンクの一覧」として気づきを与える** 方式を採用した。

### Feature

- ポップアップに常時表示セクション「このサイトの他のページ」を追加（既存の Highlights / Notes タブはそのまま）。
- 同じ hostname の他ページ（現在ページ自身は除外、アノテーション 1 件以上）を `lastModified` 降順で表示。0 件のときはセクションごと非表示。
- 表示上限は 20 ページ。超過分は「他 N ページ」と表示。
- `chrome://` などの特殊ページではセクションを非表示。

### Internal changes

- `web-annotator/lib/domainAnnotations.js`（新規）
  - chrome 非依存の純粋関数 3 つ: `getHostname()` / `buildAnnotationList()` / `filterDomainAnnotations()`。
  - `background.js` から `importScripts('lib/domainAnnotations.js')` で読み込む（MV3 classic service worker）。末尾に Node テスト用 `module.exports` ガード。
- `web-annotator/background.js`
  - 先頭に `importScripts('lib/domainAnnotations.js')`。
  - 新メッセージアクション `getDomainAnnotations`（`currentUrl` を受け取り、同 hostname の他ページ集計を返す）を追加。
  - 既存 `getAllAnnotations` を `buildAnnotationList()` 共通化でリファクタ（挙動不変）。
- `web-annotator/popup/popup.js`
  - `loadDomainAnnotations()` / `renderDomainPages()` / `handleDomainClick()` を追加し、`init()` と `setupEventListeners()` に結線。
  - `currentUrl` は content.js と同じく `#` 以下を除去して渡し、現在ページ自身の除外を確実化。
  - 既存 `escapeHtml` でユーザー由来データ（URL / タイトル）をエスケープ。`tabs.query({url})` 失敗時は新規タブ作成へフォールバック。
- `web-annotator/popup/popup.html`: `#domainSection` を `</main>` 直後・import セクションの前に追加。
- `web-annotator/popup/popup.css`: `.domain-section` / `.domain-item` / `.domain-meta` 等を追加（`.list-item` / `.badge` / `.empty-message` を流用）。
- `web-annotator/_locales/{en,ja}/messages.json`: `domainOtherPages` / `domainPageCounts` / `domainMore` を追加。
- `web-annotator/lib/domainAnnotations.test.cjs`（新規）: `node --test` で 14 ケース。
- `manifest.json`: `version` 1.1.1 → 1.2.0。
- `README.md` / `STORE_LISTING.md` / `docs/release-checklist.md`: 機能追記、Changelog 追加、zip 同梱対象に `lib/domainAnnotations.js` を追加。

### Compatibility / migrations

- **Storage schema**: 変更なし。v1.1.1 までのハイライト・付箋・インポート項目はそのまま対象になる。
- **Permissions**: 変更なし。`getDomainAnnotations` / `tabs.create` / `tabs.update` / `tabs.query({url})` はいずれも既存の `host_permissions: <all_urls>` で動作し、`tabs` 権限の追加は不要。
- **DOM contract**: 変更なし。他ページのマーカーは現在ページに描画しない（一覧表示のみ）。
- **意図的な挙動**: hostname のみで比較するため、`http://example.com` と `https://example.com` は同一ドメイン扱いで両方一覧化される。

### Verification

- ✅ `node --test web-annotator/lib/domainAnnotations.test.cjs` — 14 / 14 pass。
- ✅ `node --test web-annotator/lib/parseMarkdownList.test.cjs` — 10 / 10 pass（リグレッション）。
- ✅ JS 構文チェック（`node --check`）と全 JSON パース、`version=1.2.0` を確認。
- ⏳ 手動確認（要ブラウザ）: 同 hostname の複数ページにアノテーションを作成 → アノテーション無しの同サイト別ページでポップアップを開き、一覧表示 → クリックで遷移 → 別 hostname では非表示 → `chrome://` で非表示。

### Asset

- `web-annotator-v1.2.0.zip` — Chrome Web Store アップロード用。`lib/domainAnnotations.js` を含む。

---

## Section 2 — Chrome Web Store (User-facing, Japanese)

> Detailed Description の末尾、または「最新のお知らせ」セクションに以下を貼り付けてください。

### v1.2.0 の新機能

**🔍 同じサイトの他のページにある付箋・マーカーに気づけるように**

これまでは、いま開いているページに付けた付箋・マーカーだけがポップアップに表示されていました。そのため「このページには何も付けていないけれど、実は同じサイトの別ページに付箋を残していた」というケースで、その存在に気づけませんでした。

v1.2.0 では、ポップアップに **「このサイトの他のページ」** という一覧が追加されました。

- いま開いているページにアノテーションが無くても、**同じサイト（ドメイン）の他のページ**に付箋・マーカーがあれば一覧で表示します
- 各ページのマーカー・付箋の件数がひと目で分かります
- 項目をクリックすると、そのページを開きます（すでに開いていればそのタブに切り替え）

「同じサイト」はホスト名単位で判定します（例: `news.example.com` と `blog.example.com` は別サイト扱い）。

既存のハイライト・付箋データはそのまま引き継がれます。アップデート後の特別な操作は不要です。

ご意見・不具合報告は GitHub Issues までお寄せください。
https://github.com/masayan1126/chrome-extensions/issues
