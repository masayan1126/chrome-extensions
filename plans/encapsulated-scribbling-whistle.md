# 同名ファイルタブのパス表示改善

## Context
Issue #10 の修正で同名ファイルを別タブで開けるようになったが、タブにファイル名しか表示されないため、どのファイルか区別できない。VS Code のように最小限のパス情報を表示して曖昧さを解消する。

## 現状の問題
- `getDirName()` は直親ディレクトリ名のみ返す（`"a/b/memo.md"` → `"b"`）
- 親ディレクトリ名も同じ場合（例: `x/docs/memo.md` と `y/docs/memo.md`）は区別不能
- D&D経由のファイルはパス情報がないため `undefined` を返す

## 修正方針: VS Code 式の最小曖昧解消

### 修正ファイル
1. **`rich-markdown-preview/src/shared/utils/fileSystem.ts`** — `getDirName` を拡張 or 新関数追加
2. **`rich-markdown-preview/src/features/tabs/TabBar.tsx`** — `getDisplayLabel` のロジックを改善

### アルゴリズム
同名ファイル群に対して、各ファイルを区別するために必要な最小限のパスセグメントを計算する:

1. 同名ファイル群を抽出（既存の `duplicateNames` ロジック）
2. 各ファイルのパスセグメントを逆順に比較
3. 全ファイルが一意になる最小セグメント数を各ファイルごとに決定
4. 例:
   - `input/memo.md` → `input/memo.md`
   - `output/memo.md` → `output/memo.md`
   - `a/docs/memo.md` と `b/docs/memo.md` → `a/docs/memo.md` と `b/docs/memo.md`

### 実装詳細

#### `fileSystem.ts` に新関数追加
```typescript
// 同名ファイル群に対して、区別に必要な最小パスラベルを計算
export const getDisambiguatedLabels = (
  files: { name: string; path: string }[]
): Map<string, string> => { ... }
```

#### `TabBar.tsx` の変更
- `duplicateNames` の代わりに `getDisambiguatedLabels` を使って各タブのラベルを一括計算
- `getDisplayLabel` を簡略化（Map から引くだけ）

### テスト
- 既存テストの確認・更新
- 新関数 `getDisambiguatedLabels` のユニットテスト追加

## 検証方法
1. `npm run build` でビルド成功確認
2. `npm run test` でテスト通過確認
3. ブラウザで同名ファイルを複数開いてタブ表示を確認
