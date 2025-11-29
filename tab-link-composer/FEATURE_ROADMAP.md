# TabLink Composer - 機能ロードマップ

## 競合分析

### 主要競合拡張機能
1. **Copy as Markdown** (yorkxin) - 15k+ users
2. **Tab Copy** (hansifer) - 人気の高機能版
3. **CopyTabTitleUrl** - シンプル版
4. **TABLERONE** - パワーユーザー向け

---

## 現在の機能 ✅

- [x] タブグループ選択（現在のウィンドウ、全ウィンドウ、特定グループ）
- [x] 基本フォーマット（Markdown, Plain, HTML, Title+URL）
- [x] プリセットフォーマット（Notion, Obsidian, Slack, Discord, CSV, Org-mode, Confluence）
- [x] カスタムテンプレート（{title}, {url}）
- [x] 国際化対応（日本語・英語）
- [x] モダンなUI（ダークテーマ #0E0E0E / #5CD6A8）

---

## 優先度: 高 🔴

### 1. キーボードショートカット対応
**重要度**: ★★★★★
**理由**: ほぼ全ての競合が実装。パワーユーザーの必須機能

**実装内容**:
- デフォルトショートカット: `Alt+Shift+C` (カスタマイズ可能)
- 前回使用したフォーマットで即コピー
- manifest.jsonにcommands設定追加
- chrome.commands API使用

**技術的詳細**:
```json
"commands": {
  "_execute_action": {
    "suggested_key": {
      "default": "Alt+Shift+C"
    }
  }
}
```

---

### 2. 高度なテンプレート変数
**重要度**: ★★★★★
**理由**: Tab Copyの最大の強み。差別化に必須

**実装する変数**:

#### 基本変数（既存）
- `{title}` - タブタイトル
- `{url}` - 完全なURL

#### 追加変数（Phase 1）
- `{index}` - タブの連番
- `{host}` - ドメイン名のみ
- `{path}` - URLのパス部分
- `{date}` - 現在の日付
- `{time}` - 現在の時刻
- `{count}` - 総タブ数

#### 追加変数（Phase 2）
- `{favicon}` - ファビコンURL
- `{group}` - タブグループ名
- `{window}` - ウィンドウ番号
- `{protocol}` - プロトコル（https, http）
- `{query}` - クエリパラメータ
- `{hash}` - URLハッシュ

**使用例**:
```
{index}. [{title}]({url}) - {host}
→ 1. [GitHub](https://github.com) - github.com

[{date}] {title} ({host})
→ [2025-11-09] GitHub (github.com)
```

---

### 3. コンテキストメニュー対応
**重要度**: ★★★★☆
**理由**: Copy as Markdownの主要機能。右クリックからのアクセス性

**実装内容**:
- 右クリックメニューに「Copy as Markdown」追加
- サブメニューで各フォーマット選択
- 選択テキストがある場合は「選択範囲をMarkdownでコピー」も表示

**メニュー構造**:
```
📋 Copy Tab Links
  ├─ Markdown
  ├─ Plain Text
  ├─ HTML
  ├─ ─────────
  ├─ Notion
  ├─ Obsidian
  ├─ Slack
  └─ Custom...
```

---

## 優先度: 中 🟡

### 4. タブフィルタリング
**重要度**: ★★★★☆
**理由**: パワーユーザー向け。競合にはない差別化機能

**実装内容**:
- URLパターンでフィルタ（正規表現対応）
- タイトルで検索
- 固定タブのみ/除外
- ドメインでグループ化

**UI案**:
```
[ ] 固定タブのみ
[ ] 重複URLを除外
[_____________] URLフィルタ（正規表現）
```

---

### 5. プレビュー機能
**重要度**: ★★★☆☆
**理由**: コピー前に確認できると安心

**実装内容**:
- コピー前にプレビュー表示
- 編集可能なテキストエリア
- 文字数カウント表示

---

### 6. 履歴機能
**重要度**: ★★★☆☆
**理由**: 過去のコピー履歴から再利用

**実装内容**:
- 最新10件の履歴を保存
- クリックで再コピー
- 履歴クリア機能

---

## 優先度: 低 🟢

### 7. クラウド同期
**重要度**: ★★☆☆☆
**理由**: カスタムテンプレートを複数デバイスで共有

**実装内容**:
- chrome.storage.sync使用
- カスタムテンプレート同期
- 設定の同期

---

### 8. エクスポート/インポート
**重要度**: ★★☆☆☆
**理由**: バックアップと共有

**実装内容**:
- 設定をJSONでエクスポート
- 設定をインポート
- プリセットテンプレート共有

---

### 9. バッチ操作
**重要度**: ★☆☆☆☆
**理由**: 複数ウィンドウを一括処理

**実装内容**:
- 複数ウィンドウを個別ファイルとして保存
- ZIP圧縮してダウンロード

---

## 実装フェーズ

### Phase 1 (v1.1.0) - 必須機能
- [ ] キーボードショートカット
- [ ] 基本テンプレート変数（{index}, {host}, {path}, {date}, {time}, {count}）
- [ ] コンテキストメニュー

### Phase 2 (v1.2.0) - 差別化機能
- [ ] 高度なテンプレート変数（{favicon}, {group}, {window}等）
- [ ] タブフィルタリング
- [ ] プレビュー機能

### Phase 3 (v1.3.0) - 便利機能
- [ ] 履歴機能
- [ ] エクスポート/インポート
- [ ] クラウド同期

---

## 技術的考慮事項

### テンプレート変数の実装
```typescript
interface TemplateVariables {
  title: string;
  url: string;
  index: number;
  host: string;
  path: string;
  date: string;
  time: string;
  count: number;
  favicon?: string;
  group?: string;
  window?: number;
  protocol?: string;
  query?: string;
  hash?: string;
}

function renderTemplate(template: string, vars: TemplateVariables): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return vars[key as keyof TemplateVariables]?.toString() || match;
  });
}
```

### パフォーマンス
- 1000タブ以上でも高速動作
- 非同期処理でUIブロックなし
- 段階的レンダリング

---

## 競合との差別化ポイント

1. ✨ **モダンなUI/UX** - 他の拡張機能より洗練されたデザイン
2. 🎨 **豊富なプリセット** - Notion, Obsidian, Slack等の人気ツール対応
3. 🌏 **多言語対応** - 日本語ネイティブサポート
4. 🚀 **パフォーマンス** - 大量タブでも高速
5. 🔧 **柔軟なカスタマイズ** - 高度なテンプレート変数

---

## ユーザーフィードバック収集

- GitHub Issues
- Chrome Web Storeレビュー
- 使用統計（匿名）の収集検討
