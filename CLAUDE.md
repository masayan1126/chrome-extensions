## 開発ライフサイクル（Anthropic公式スキル構成）

| # | フェーズ | スキル / コマンド | 補足 |
|---|---|---|---|
| ① | 要件定義 | `doc-coauthoring` | 仕様書を `docs/` 配下に Markdown で作成 |
| ①' | Issue 更新 | `gh issue edit <N> --title ... --body ...` | 確定要件でタイトル・説明を上書き |
| ② | 設計 | `feature-dev` | Discovery → Architecture フェーズ |
| ③ | デザイン | `frontend-design` | 新UIコンポーネントが必要な場合のみ |
| ④ | 実装 | `feature-dev` | コーディング・ビルド・テスト。完了後に `manifest.json` バージョン更新 → zip 再作成必須 |
| ⑤ | コミット/PR | `commit-commands:commit-push-pr` | semantic commit |
| ⑥ | レビュー | `pr-review-toolkit:review-pr` | code / errors / types を並列実行 |
| ⑦ | ドキュメント | `claude-md-management:revise-claude-md` / `internal-comms` | CLAUDE.md 更新 + リリースノート作成（`docs/release-notes-vX.Y.Z.md`） |

## ガードレール（全工程横断）
- `hookify` — 不要なふるまいの防止
- `security-guidance@claude-plugins-official` — ファイル編集時に自動でセキュリティ警告（XSS・インジェクション等）
- `claude-md-management:revise-claude-md` — 各フェーズ完了後に CLAUDE.md を更新

## ビルド・テスト・リリース準備
1. `public/manifest.json` の `version` を更新
2. `npm run build` — TypeScript コンパイル + Vite ビルド
3. `npm run test` — Vitest（73テスト）
4. `rm -f rich-markdown-preview.zip && zip -r rich-markdown-preview.zip dist/` — zip 再作成（`dist/` のみ。`public/` を含めるとマニフェスト重複エラーになる）

## リリースノート
- `internal-comms` スキルで作成（GitHub Releases 向け + Chrome ストア向けの2種類）
- 保存先: `docs/release-notes-vX.Y.Z.md`
- GitHub Releases 向け: 技術的変更内容・影響範囲・既知の制限を Markdown で記載
- Chrome ストア向け: 一般ユーザー向けに平易な日本語で記載

## GitHub CLI
- Issue クローズ: `gh issue close <N> --repo masayan1126/chrome-extensions`
- Issue 更新: `gh issue edit <N> --repo masayan1126/chrome-extensions --title ... --body ...`