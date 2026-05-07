# Web Annotator v1.1.1 Release Notes

Release date: 2026-05-07
Repository: [masayan1126/chrome-extensions](https://github.com/masayan1126/chrome-extensions) (`web-annotator/`)
Related PR: [#22](https://github.com/masayan1126/chrome-extensions/pull/22)
Previous version: v1.1.0

---

## Section 1 — GitHub Releases (Developer-facing)

### TL;DR

- **Bug fix**: Bulk text import (`parseMarkdownList`) no longer over-splits Japanese sentences on the full-width comma `、`. Markdown bullet lines and lines containing a sentence terminator are kept as a single annotation; plain comma-separated input is still split as before.
- Backward compatible: `りんご、みかん、ぶどう` and `foo, bar, baz` continue to split into 3 items each.
- 100 % storage-format compatible with v1.1.0.

### Background

A v1.1.0 user reported that pasting a Japanese bullet list of the form

```
- AIによる生成物を理解し、意図をもって選択・検証できることが重要になります。
- AIを単に使うだけでなく、人、AI、そして既存のシステムが連携する最適なワークフローを設計する力。…
```

produced ~30 single-character annotations like `#29 人` `#30 AI` `#31 AI`. Root cause: `parseMarkdownList` treated half-width `,` and full-width `、` as equivalent list separators, but `、` is a *sentence-internal* delimiter in Japanese. This was already noted as a "Known limitation" in v1.1.0; v1.1.1 turns it into proper behavior.

### Fix

`parseMarkdownList` now decides whether to split on comma per-line:

- **No split** if the original line started with a Markdown list marker (`- ` / `* ` / `+ ` / `1.` / `1)`).
- **No split** if the line contains any sentence terminator: `。 . ! ? ！ ？`.
- **Split on `,` and `、`** otherwise — preserving the v1.1.0 use case of `りんご、みかん、ぶどう` (3 items).

Identical patches were applied to both `popup/popup.js` and `content.js` because the popup and the injected content script live in different JS contexts and cannot share a module under MV3.

### Internal changes

- `web-annotator/popup/popup.js`
  - `parseMarkdownList()` gains `hadListMarker` and `hasSentenceTerminator` flags; the existing comma-split branch is gated by `!hadListMarker && !hasSentenceTerminator`.
  - Added `if (typeof document !== 'undefined')` guard around the top-level `DOMContentLoaded` listener so the file can be `require()`'d from Node tests.
  - Added a `module.exports` guard at the end (no-op in browsers).
- `web-annotator/content.js`
  - Same logic change applied to the IIFE-scoped `parseMarkdownList()`. JSDoc updated with the new policy and a pointer to the test file.
- `web-annotator/lib/parseMarkdownList.test.cjs` (new)
  - 10 regression cases run with `node --test`. Covers the reported bug, plain comma-separated lists, code blocks, headings, checkbox markers, English sentence terminators, and `null` / non-string inputs.
- `web-annotator/README.md`
  - Added a "テスト" section documenting how to run the new test and the rule that `popup.js` and `content.js` must stay in sync.
- `web-annotator/STORE_LISTING.md`
  - Added v1.1.1 entries to the English and Japanese Changelog sections.
- `manifest.json`: `version` 1.1.0 → 1.1.1.

### Compatibility / migrations

- **Storage schema**: unchanged. Existing highlights / sticky notes / imported items from v1.1.0 are unaffected.
- **DOM contract**: unchanged.
- **Permissions**: unchanged. No additions to `manifest.json` permissions or host permissions.
- **Behavior change surface area**: only the parsing of newly imported text. Lines that previously got split incorrectly are now kept whole; lines that should have stayed split (`りんご、みかん、ぶどう`, `foo, bar`) still split.

### Verification

- ✅ `node --test web-annotator/lib/parseMarkdownList.test.cjs` — 10 / 10 pass.
- ✅ Manual reproduction confirmed: the originally reported Japanese bullet list now imports as 1 annotation per line; `#29 人` / `#30 AI` no longer appear.
- ✅ Plain comma-separated input (`りんご、みかん、ぶどう`) still splits into 3 items.

### Asset

- `web-annotator-v1.1.1.zip` — ready for Chrome Web Store upload.

---

## Section 2 — Chrome Web Store (User-facing, Japanese)

> Detailed Description の末尾、または「最新のお知らせ」セクションに以下を貼り付けてください。

### v1.1.1 の修正

**🛠 テキスト一括インポートで日本語の自然文が読点ごとに細切れになる不具合を修正**

v1.1.0 のテキスト一括インポートで、`- AIによる生成物を理解し、意図をもって選択・検証できる…` のような日本語の箇条書きを貼り付けると、文中の読点（`、`）でも分割されてしまい、`人` `AI` のような数文字の細切れアノテーションが大量に生成される不具合がありました。

v1.1.1 ではインポート時の分割ルールを次のように改善しました:

- 箇条書きマーカー（`- ` `* ` `1.` など）で始まる行は **1 行 = 1 項目** として扱い、文中の読点では分割しません
- 句点・疑問符・感嘆符（`。 . ! ? ！ ？`）を含む行は自然文とみなし、読点では分割しません
- 上記以外（マーカーなし & 句点なし）は従来通り `,` と `、` の両方で分割します（`りんご、みかん、ぶどう` のようなべた書きの全角リストは引き続き 3 項目として認識）

既存のハイライト・付箋データはそのまま引き継がれます。アップデート後の再操作は不要です。

ご意見・不具合報告は GitHub Issues までお寄せください。
https://github.com/masayan1126/chrome-extensions/issues
