# Web Annotator v1.1.0 Release Notes

Release date: 2026-05-06
Repository: [masayan1126/chrome-extensions](https://github.com/masayan1126/chrome-extensions) (`web-annotator/`)
Related Issue: [#16](https://github.com/masayan1126/chrome-extensions/issues/16)
Previous version: v1.0.1

---

## Section 1 — GitHub Releases (Developer-facing)

### TL;DR
- **NEW: Bulk text import** — Paste a Markdown / comma / newline-separated list and have every matching occurrence on the page highlighted (or sticky-noted) in one shot.
- **NEW: Auto theme adaptation** — Highlight colors switch automatically between light and dark pages so the underlying text stays readable (WCAG AA against white text on dark backgrounds).
- Backward compatible: existing storage data and existing behavior are preserved.

### Highlights

#### 1. Bulk text import (Issue #16)

A new "Import texts" section in the popup accepts three input formats and applies them in a single batch:

| Format | Example |
|---|---|
| Markdown list | `- foo`<br>`* bar`<br>`1. baz` |
| Comma-separated | `foo, bar, baz`<br>`りんご、みかん、ぶどう` (full-width `、` supported) |
| Newline-separated | `foo`<br>`bar`<br>`baz` |

- Mode toggle: **Highlights** (with color picker) or **Notes** (sticky notes).
- Multi-match: every occurrence on the page is annotated.
- Input: paste into the textarea or pick a `.md` / `.txt` file.
- Sticky notes created via import are anchored to their text via `anchorText` / `anchorXPath` and follow the text on re-render.

#### 2. Auto theme adaptation

- The content script samples the effective background color of `<body>` / `<html>` (with `prefers-color-scheme` as a fallback) and sets `data-web-annotator-theme="light|dark"` on `<html>`.
- Highlight colors are applied as `var(--web-annotator-hl-yellow, #fef08a)` etc. via inline `!important` styles. The CSS variables resolve to:
  - **Light**: `#fef08a` / `#86efac` / `#93c5fd` / `#fca5a5` (existing pastel palette)
  - **Dark**: `#b45309` / `#15803d` / `#1d4ed8` / `#b91c1c` (Tailwind 700-tier; AA against white text)
- A `prefers-color-scheme: change` listener re-evaluates the theme so the highlight palette stays in sync when the OS appearance flips.

### Internal changes

- `content.js`
  - Added: `parseMarkdownList()`, `findAllOccurrences()`, `importHighlights()`, `importStickyNotes()`, `findAnchorPosition()`, `colorToCssValue()`, `parseRgb()`, `effectiveBackgroundColor()`, `relativeLuminance()`, `detectPageTheme()`, `applyTheme()`, `setupThemeListener()`.
  - Modified: `applyHighlight()` now writes `var(--web-annotator-hl-*)` instead of raw hex; `createStickyNote()` accepts optional `anchorText` / `anchorXPath`; `renderStickyNotes()` re-resolves anchored notes' position via `findAnchorPosition()`; floating toolbar swatches use the same CSS-variable colors.
  - New message action: `importTexts` (`{texts, mode, color?}` → `{success, mode, processed, found, added}`).
- `content.css`
  - Added `:root` and `html[data-web-annotator-theme="dark"]` blocks defining `--web-annotator-hl-yellow / -green / -blue / -red`.
- `popup/`
  - `popup.html`: collapsible **Import texts** section with mode toggle, color swatches, textarea, file picker, and run button; new help line.
  - `popup.js`: `parseMarkdownList()` (mirror of content.js), `setupImportListeners()`, `runImport()`; `applyI18n()` now also handles `data-i18n-placeholder`.
  - `popup.css`: ~130 lines of styles for `.import-section` etc.
- `_locales/{en,ja}/messages.json`: Added `importTexts`, `modeHighlight`, `modeNotes`, `color`, `chooseFile`, `runImport`, `importNoText`, `importResult`, `importFailed`, `importFileReadFailed`, `helpImport`.
- `manifest.json`: `version` 1.0.1 → 1.1.0.
- `STORE_LISTING.md`: Updated key features / usage / changelog (English + Japanese).

### Compatibility / migrations

- **Storage schema**: 100% backward compatible. `stickyNote` gains optional `anchorText` / `anchorXPath` fields; existing notes have no anchor data and continue to render at their stored `(x, y)` coordinates. Existing highlights continue to use their stored hex `color`; the runtime maps them to CSS variables on render.
- **DOM contract**: `.web-annotator-highlight` span structure unchanged; `data-wa-color="yellow|green|blue|red"` is now also set when the color is one of the four built-ins.
- No permission changes in `manifest.json`. No new host or runtime permissions.

### Known limitations

- Page-level dark-mode toggles that are not driven by `prefers-color-scheme` are picked up only on initial page load (and on OS-level appearance change). A subsequent in-page toggle will not re-evaluate the theme until the page is reloaded.
- Imported sticky notes are created **per match** — if the same text appears 5 times on the page, 5 separate sticky notes are created (each anchored to its own occurrence).
- Imported text matching skips content inside `<script>`, `<style>`, existing `.web-annotator-highlight`, and existing `.web-annotator-sticky-note` to avoid double-marking and self-matching.
- Comma-separated parsing splits on both half-width `,` and full-width `、`. Texts that intentionally contain a literal comma cannot be distinguished from separators.

### Verification

Manual test plan executed against Wikipedia (light & dark themes) and a generic React docs page:

- ✅ Markdown / comma / newline / mixed list parsing (8/8 inline unit cases via `node -e`)
- ✅ Multi-occurrence highlight, no double-marking
- ✅ Sticky note placed at text right edge, follows text on reload
- ✅ Dark-page highlights use the 700-tier palette and remain legible
- ✅ Existing v1.0.1 highlights/notes continue to render after upgrade
- ✅ Markdown export still includes imported highlights

### Asset

- `web-annotator-v1.1.0.zip` — ready for Chrome Web Store upload.

---

## Section 2 — Chrome Web Store (User-facing, Japanese)

> Detailed Description の末尾、または「最新のお知らせ」セクションに以下を貼り付けてください。

### v1.1.0 の新機能・改善

**🆕 テキスト一括インポート**
気になる文言のリストを貼り付けるだけで、ページ内のすべての該当箇所をまとめてハイライト・付箋登録できるようになりました。

入力形式は3パターン対応：

- **箇条書き**（Markdown）  `- りんご` / `* みかん` / `1. ぶどう`
- **カンマ区切り**  `りんご, みかん, ぶどう`（全角「、」もOK）
- **改行区切り**（マーカー不要、1行1項目）

使い方：
1. 拡張機能アイコンをクリックしてポップアップを開く
2. 「テキストをインポート」を展開
3. 文言リストを貼り付け（または `.md` / `.txt` ファイルを選択）
4. 「ハイライト」または「付箋」を選び、色を指定
5. 「インポート」をクリック → ページ内の該当箇所すべてに一括付与

書籍の引用集、用語集、レビュー対象のキーワード一覧などをページに対して照合したいときに便利です。

**🎨 ダーク／ライトの自動最適化**
ページの背景色を自動で判定し、ハイライト色をテーマに合わせて切り替えるようになりました。
これまでダーク背景・白文字のページではハイライトと文字の色が被って読みにくかった問題を解消し、どんなページでもハイライト箇所の文字がしっかり読めます（WCAG AA 準拠のコントラスト）。

**その他**
- 付箋がテキストに紐付けられるようになり、ページの再描画後もテキスト位置に追従します（インポート機能で利用）。
- 既存のハイライト・付箋データはそのまま引き継がれます。アップデート後の再操作は不要です。

ご意見・不具合報告は GitHub Issues までお寄せください。
https://github.com/masayan1126/chrome-extensions/issues
