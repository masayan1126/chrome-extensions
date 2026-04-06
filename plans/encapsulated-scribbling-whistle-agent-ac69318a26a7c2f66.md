# タブ表示ロジック調査 - 最終報告

## 調査概要
Chrome拡張「Rich Markdown Preview」のタブ表示ロジックを調査しました。
現在、同名ファイルが開かれたときにファイル名のみ表示されていますが、親ディレクトリ名も含めて表示したいという要件です。

## 調査結果

### 1. タブUIコンポーネントの構成
- **場所**: `/src/features/tabs/`ディレクトリ
- **主要ファイル**:
  - `TabItem.tsx`: 個別のタブアイテムコンポーネント
  - `TabBar.tsx`: タブバー全体を管理するコンポーネント
  - `useTabs.ts`: タブの状態管理フック
  - `useTabOpen.ts`: タブオープン処理
  - `useTabDrag.ts`: タブドラッグ&ドロップ機能

### 2. タブのデータモデル
**`OpenTab`インターフェース** (`/src/shared/types/index.ts`):
```typescript
export interface OpenTab {
  id: string;
  file: FileInfo;        // ← ファイル情報
  content: string;
  isDirty: boolean;
}

export interface FileInfo {
  name: string;          // ← ファイル名のみ
  path: string;          // ← フルパス（重要）
  handle: FileSystemFileHandle | null;
  isMarkdown?: boolean;
}
```

**重要**: パス情報は`tab.file.path`に完全に保持されている

### 3. タブのラベル表示ロジック（重要）
**場所**: `/src/features/tabs/TabBar.tsx` （18-40行目）

#### 現在の実装:
```typescript
// 同名ファイルが複数タブで開かれているファイル名のセットを計算
const duplicateNames = useMemo(() => {
  const nameCounts = new Map<string, number>();
  tabs.forEach((tab) => {
    nameCounts.set(tab.file.name, (nameCounts.get(tab.file.name) ?? 0) + 1);
  });
  return new Set(
    Array.from(nameCounts.entries())
      .filter(([, count]) => count > 1)
      .map(([name]) => name)
  );
}, [tabs]);

const getDisplayLabel = (tab: OpenTab): string => {
  if (!duplicateNames.has(tab.file.name)) {
    return sanitizeFileName(tab.file.name);
  }
  const dirName = getDirName(tab.file);  // ← ここで親ディレクトリを取得
  if (dirName) {
    return sanitizeFileName(`${dirName}/${tab.file.name}`);
  }
  return sanitizeFileName(tab.file.name);
};
```

### 4. ファイルパス処理ユーティリティ
**場所**: `/src/shared/utils/fileSystem.ts`

#### 既存関数:
```typescript
// パス から直親ディレクトリ名を導出する（同名ファイルのタブラベル表示用）
// サイドバー経由: "rootDir/subDir/file.md" → "subDir"
// D&D 経由: ファイル名のみのため undefined を返す
export const getDirName = (file: FileInfo): string | undefined => {
  const parts = file.path.split('/');
  return parts.length >= 2 ? parts[parts.length - 2] : undefined;
};
```

**動作**:
- サイドバー経由のパス（"rootDir/subDir/file.md"）→ "subDir"を返す
- D&D経由のファイル（ファイル名のみ）→ undefinedを返す

### 5. 同名ファイルの検出と区別の仕組み
- **場所**: `TabBar.tsx`の`duplicateNames`計算部分
- **仕組み**: 
  1. すべてのタブのファイル名をカウント
  2. 2以上出現するファイル名を「重複ファイル」として抽出
  3. 重複ファイルの場合のみ、親ディレクトリ名を追加表示

### 6. TabItemコンポーネント
**場所**: `/src/features/tabs/TabItem.tsx`

- `displayLabel`というpropsで受け取ったラベルを表示
- title属性には全パス情報を設定済み:
  ```typescript
  title={sanitizeFileName(tab.file.path) || displayLabel}
  ```
- ホバー時にツールチップで全パスが表示される

## 現在の動作

### シナリオ1: 異なるファイル
- tab.file.name = "README.md", tab.file.name = "INSTALL.md"
- → 表示: "README.md", "INSTALL.md"（ファイル名のみ）

### シナリオ2: 同名ファイル
- tab1.file.path = "docs/README.md", tab2.file.path = "src/README.md"
- → 表示: "docs/README.md", "src/README.md"（親ディレクトリ + ファイル名）

### シナリオ3: D&D経由の同名ファイル（制限あり）
- パスがファイル名のみ（`name::size::lastModified`形式）の場合
- → 表示: "README.md"（親ディレクトリなし）

## 既存ロジックの詳細

### パス情報の保持方法
1. **サイドバー経由（ファイルシステムアクセスAPI）**:
   - フルパス保持: "rootDir/subDir/file.md"
   - D&Dの場合よりも完全なパス情報

2. **D&D経由（File API）**:
   - パス取得不可のため、識別子として使用: `name::size::lastModified`
   - セキュリティ制限による制約

### 現在のラベル表示ロジックの限界
1. 親ディレクトリのみ表示（`getDirName()`）
2. パスに"//"が複数ある場合、最後の部分のみを表示
3. D&D経由ファイルでは親ディレクトリ名が取得できない

## 改善可能な点

### 1. より詳細なパス表示
現在: "docs/README.md"
改善例: "project/docs/README.md" または "…/docs/README.md"

### 2. D&D経由ファイルの改善
- ブラウザセキュリティで制約あり
- ユーザーが意図的に名前をつける仕組み

### 3. タブツールチップ
- 既に全パスがtitle属性に設定済み
- ホバー時に完全なパスが表示されている

## ファイル関連性マップ

```
App.tsx (25行目)
  ↓ useTabs()フック使用
useTabs.ts
  ├─ setTabs, setActiveTabId 状態管理
  ├─ useTabOpen.ts: タブを開く処理
  ├─ useFileWatcher.ts: ファイル変更監視
  └─ useTabRestore.ts: タブ復元

MainContent.tsx (113行目)
  ↓ TabBarコンポーネント実装
TabBar.tsx (重要: タブラベル生成ロジック)
  ├─ duplicateNames: 同名ファイルを検出
  ├─ getDisplayLabel(): ラベル生成関数
  ├─ getDirName(): 親ディレクトリ取得
  └─ sanitizeFileName(): 安全化処理

TabItem.tsx
  ├─ displayLabel: 表示用ラベル
  └─ tab.file.path: 全パス情報

fileSystem.ts
  ├─ getDirName(): パス→親ディレクトリ名
  ├─ sanitizeFileName(): 制御文字除去
  └─ isMarkdownFile(): マークダウン判定

tabDb.ts
  └─ IndexedDB保存（StoredTab: filePath, fileName）
```

## 推奨される改善案

### 案1: 複数段のパス表示（最小限）
- 親ディレクトリ + ファイル名（現在）
→ 祖父ディレクトリ + 親ディレクトリ + ファイル名

### 案2: 省略パス表示
- "…/docs/README.md"のように先頭を省略

### 案3: タブの最大幅を増加
- max-w-48 (192px)を増加させて、より長いパスを表示

### 案4: 競合時のみ詳細表示（推奨）
- 同名ファイルがある場合のみ詳細表示
- 他は相変わらずファイル名のみ表示

