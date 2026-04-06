# Rich Markdown Preview テスト書類作成計画

## Context

Rich Markdown Preview Chrome拡張機能のストアリスティング（store-listing-ja.md）を元に、ユーザー目線の手動テスト仕様書を作成する。さらに、claude-in-chrome MCP ツールを使ったブラウザ自動テストも作成する。

## 成果物

### 1. 手動テスト仕様書
- ファイル: `rich-markdown-preview/docs/manual-test-spec.md`
- 日本語、ユーザー目線、細かすぎない粒度
- テーブル形式で「テスト内容 / 操作手順 / 期待結果」

### 2. 自動ブラウザテスト
- ファイル: `rich-markdown-preview/docs/browser-tests/` 配下
- claude-in-chrome MCP ツールで実行可能なテストスクリプト
- テスト用Markdownファイルも同梱

---

## 手動テスト仕様書の構成（約60件）

| セクション | テスト数 | 概要 |
|-----------|---------|------|
| 初回起動・基本表示 | 3 | アイコン起動、初期状態、ツールバー表示 |
| フォルダ管理 | 7 | フォルダ選択、ツリー表示、隠しファイル、更新 |
| Markdownレンダリング | 8 | GFM、Mermaid、タスクリスト、脚注、emoji等 |
| タブ管理 | 6 | 開く/閉じる/切替/D&D並べ替え |
| テーマ設定 | 7 | プリセット25種、カスタムテーマ、色変更 |
| フォント・テキスト設定 | 6 | 5書体、サイズ、行間、文字間隔、幅 |
| 目次（TOC） | 5 | 自動生成、スクロール同期、トグル |
| 検索機能 | 6 | Cmd+F、マッチ数、ナビゲーション |
| コピー機能 | 4 | MDコピー、HTMLコピー、フィードバック |
| ファイル同期 | 3 | 外部エディタ保存→自動更新 |
| セッション復元 | 4 | フォルダ/タブ/設定の復元 |
| ドラッグ&ドロップ | 3 | ファイルD&D、ドロップゾーン |
| コンテキストメニュー | 4 | 右クリック、パスコピー、ファイル名コピー |

---

## 自動ブラウザテストの設計

### 自動化可能な範囲（約60%）

claude-in-chrome MCP ツールで以下が自動化可能：
- UI表示確認（`read_page` + `find`）
- テーマ切替と検証（`computer` + `javascript_tool`でCSS検証）
- フォントサイズ変更（ボタンクリック + スタイル検証）
- 検索機能（`computer`でCmd+F、テキスト入力、マッチ確認）
- コピーボタンの状態変化（クリック後「コピー完了」表示確認）
- TOC表示/非表示（トグル + 要素状態確認）
- タブ切替/クローズ（クリック操作 + アクティブ状態確認）

### 自動化困難な範囲（約40%）

- **フォルダ選択**: File System Access API はネイティブOSダイアログ → MCP操作不可
- **ファイルD&D（OS→ブラウザ）**: MCP では模倣不可
- **セッション復元**: IndexedDB事前構築が複雑
- **ファイル同期**: ファイルシステムハンドル必要

### ワークアラウンド

**方式A（推奨）**: テスト実行者が手動で1回フォルダを開き、以降は自動テスト
**方式C（補助）**: `javascript_tool` で `DragEvent` を合成し `File` オブジェクトを注入

### 自動テストファイル構成

```
rich-markdown-preview/docs/browser-tests/
├── README.md                    # テスト実行方法
├── test-data/
│   └── test-comprehensive.md    # 全機能網羅テスト用Markdown
└── test-cases/
    ├── 01-initial-state.md      # 初期状態テスト
    ├── 02-theme.md              # テーマテスト
    ├── 03-font-settings.md      # フォント設定テスト
    ├── 04-search.md             # 検索テスト
    ├── 05-toc.md                # TOCテスト
    ├── 06-tabs.md               # タブ管理テスト
    └── 07-copy.md               # コピー機能テスト
```

各テストケースは以下の形式：
- 前提条件
- MCP ツール操作手順（`find`, `computer`, `javascript_tool` 等の具体的な呼び出し）
- 検証方法と期待結果

### テスト実行フロー

1. テスト実行者が拡張機能を開く
2. 手動でテストフォルダを選択（1回のみ）
3. `tabs_context_mcp` でタブIDを取得
4. 各テストケースを順次実行
5. 結果をスクリーンショット + DOM検証で記録

---

## 重要ファイル

| ファイル | 用途 |
|---------|------|
| `store-assets/store-listing-ja.md` | 機能一覧（テストケースの根拠） |
| `src/App.tsx` | アプリ全体構造 |
| `src/MainContent.tsx` | メインUI統合コンポーネント |
| `src/features/sidebar/Sidebar.tsx` | フォルダ管理UI |
| `src/shared/types/index.ts` | 設定値の型定義 |

## 検証方法

1. 手動テスト仕様書: ドキュメントを読んでテスト実行可能か確認
2. 自動テスト: claude-in-chrome で実際に実行して動作確認
