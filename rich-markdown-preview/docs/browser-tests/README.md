# Rich Markdown Preview ブラウザ自動テスト

claude-in-chrome MCP ツールを使用した自動テストスイートです。

## 前提条件

1. Rich Markdown Preview 拡張機能が Chrome にインストール済み
2. claude-in-chrome MCP サーバーが接続済み

## テスト実行の流れ

### Step 1: dev server の起動

```
cd rich-markdown-preview && npm run dev
```

`chrome-extension://` ページは他の拡張機能からアクセスできないため、Vite dev server（localhost）上でテストします。

### Step 2: タブの準備

```
mcp__claude-in-chrome__tabs_context_mcp
mcp__claude-in-chrome__tabs_create_mcp
mcp__claude-in-chrome__navigate({ url: "http://localhost:5173/", tabId: <TAB_ID> })
```

### Step 3: テスト用Markdownの注入

JavaScript で `DragEvent` を合成し、Markdown コンテンツを `File` オブジェクトとして注入します。

### Step 4: テストケース実行

`automated-tests/` 配下の各テストを順次実行します。

| ファイル | テスト対象 | 自動化率 |
|---------|-----------|---------|
| `01-initial-state.md` | 初期状態の検証 | 100% |
| `02-theme.md` | テーマ切替と検証 | 90% |
| `03-font-settings.md` | フォント・テキスト設定 | 90% |
| `04-search.md` | 検索機能 | 95% |
| `05-toc.md` | 目次機能 | 90% |
| `06-tabs.md` | タブ管理 | 80% |
| `07-copy.md` | コピー機能 | 70% |

## 自動化が困難な操作

以下の操作はMCPツールでは実行できないため、手動テストが必要です。

| 操作 | 理由 |
|------|------|
| フォルダ選択 | File System Access API のネイティブOSダイアログ |
| OS→ブラウザのファイルD&D | ネイティブドラッグイベントの発火が困難 |
| 完全なセッション復元 | IndexedDB の事前構築が複雑 |
| ファイル同期（外部エディタ→拡張） | ファイルシステムハンドルが必要 |

## テスト結果の記録

各テストケースの実行後、`get_screenshot` でスクリーンショットを取得して結果を記録できます。
