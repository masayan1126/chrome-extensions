# リファクタリング計画: 全ソースファイルを100行以内に収める

## Context
rich-markdown-preview の src 配下に100行を超えるファイルが17個ある（テスト除く15個）。保守性向上のため、全ファイルを100行以内に分割する。

## 対象ファイル一覧（テスト除く15ファイル）

| # | ファイル | 現行行数 | 分割数 |
|---|---------|---------|-------|
| 1 | `features/theme/presets.ts` | 783 | →10 |
| 2 | `features/theme/ThemePanel.tsx` | 389 | →4 |
| 3 | `features/sidebar/Sidebar.tsx` | 344 | →4 |
| 4 | `features/toolbar/Toolbar.tsx` | 328 | →4 |
| 5 | `features/preview/MarkdownPreview.tsx` | 268 | →4 |
| 6 | `App.tsx` | 258 | →3 |
| 7 | `features/tabs/useTabs.ts` | 248 | →3 |
| 8 | `features/sidebar/directoryStorage.ts` | 211 | →3 |
| 9 | `features/tabs/tabStorage.ts` | 194 | →3 |
| 10 | `shared/utils/themeStyles.ts` | 166 | →3 |
| 11 | `shared/utils/markdown.ts` | 159 | →3 |
| 12 | `features/tabs/TabBar.tsx` | 143 | →3 |
| 13 | `features/sidebar/useFileSystem.ts` | 143 | →2 |
| 14 | `features/search/SearchBar.tsx` | 120 | →2 |
| 15 | `shared/utils/fileSystem.ts` | 112 | →2 |

---

## 実装フェーズ（依存関係順）

### フェーズ1: 末端ユーティリティ（並行可能）

#### 1-A. `presets.ts` (783行) → `presets/` ディレクトリ (10ファイル)
テーマをビジュアルファミリー別に分割。`presets.ts` → `presets/index.ts` でimportパス維持。

| ファイル | テーマ | 想定行数 |
|---------|-------|---------|
| `presets/githubThemes.ts` | github-light, github-dark | ~65 |
| `presets/classicThemes.ts` | one-light, one-dark, solarized-light | ~97 |
| `presets/materialThemes.ts` | material-light, paper, monokai | ~97 |
| `presets/catppuccinThemes.ts` | catppuccin-latte, catppuccin-mocha | ~65 |
| `presets/ayuThemes.ts` | ayu-light, ayu-dark, ayu-mirage | ~97 |
| `presets/natureThemes.ts` | everforest-light, everforest-dark, rose-pine-dawn, rose-pine | ~97 |
| `presets/darkClassicThemes.ts` | nord, dracula, gruvbox-dark | ~97 |
| `presets/tokyoThemes.ts` | tokyo-night, night-owl | ~65 |
| `presets/retroThemes.ts` | synthwave-84, palenight, cobalt2 | ~97 |
| `presets/index.ts` | 集約 + `defaultThemeId` | ~25 |

#### 1-B. `themeStyles.ts` (166行) → 3ファイル + re-export
| ファイル | 内容 | 想定行数 |
|---------|------|---------|
| `shared/utils/colorUtils.ts` | isValidColor, safeColor, ensureBoldContrast | ~25 |
| `shared/utils/themeCssGenerator.ts` | generateThemeCSS | ~90 |
| `shared/utils/defaultThemeColors.ts` | createDefaultThemeColors | ~60 |
| `shared/utils/themeStyles.ts` | re-export のみ | ~10 |

#### 1-C. `markdown.ts` (159行) → 3ファイル
**注意**: `tocItems`, `headingCounter`, `mermaidCounter` はモジュールスコープ変数。`markdownRenderer.ts` からexportし、`markdown.ts` でリセットする。

| ファイル | 内容 | 想定行数 |
|---------|------|---------|
| `shared/utils/markdownRenderer.ts` | renderer定義, mermaid初期化, marked設定, tocItems/counter export | ~60 |
| `shared/utils/markdownPreprocess.ts` | escapeHtmlInCodeSpans, stripFrontmatter, sanitizeId, processFootnotes | ~55 |
| `shared/utils/markdown.ts` | parseMarkdown, renderMermaidDiagrams | ~40 |

#### 1-D. `fileSystem.ts` (112行) → 2ファイル
| ファイル | 内容 | 想定行数 |
|---------|------|---------|
| `shared/utils/directoryReader.ts` | readDirectory | ~80 |
| `shared/utils/fileSystem.ts` | 残り + readDirectory re-export | ~45 |

### フェーズ2: ストレージ系

#### 2-A. `directoryStorage.ts` (211行) → 3ファイル
| ファイル | 内容 | 想定行数 |
|---------|------|---------|
| `features/sidebar/directoryDb.ts` | 型定義, DB定数, openDB | ~40 |
| `features/sidebar/directorySave.ts` | saveDirectoryToStorage, clearDirectoryStorage | ~50 |
| `features/sidebar/directoryRestore.ts` | loadDirectoryFromStorage, hasStoredDirectory, restoreDirectoryWithPermission | ~80 |

`directoryStorage.ts` は削除。`useFileSystem.ts` のimportを更新。

#### 2-B. `tabStorage.ts` (194行) → 3ファイル
| ファイル | 内容 | 想定行数 |
|---------|------|---------|
| `features/tabs/tabDb.ts` | 型定義, DB定数, openDB | ~50 |
| `features/tabs/tabSave.ts` | saveTabsToStorage, clearTabsStorage | ~55 |
| `features/tabs/tabRestore.ts` | loadTabsFromStorage | ~75 |

`tabStorage.ts` は削除。`useTabs.ts` のimportを更新。

### フェーズ3: フック系

#### 3-A. `useTabs.ts` (248行) → 3ファイル
| ファイル | 内容 | 想定行数 |
|---------|------|---------|
| `features/tabs/useFileWatcher.ts` | startWatchingTab, stopWatchingTab, 監視useEffect群 | ~65 |
| `features/tabs/useTabRestore.ts` | 初期化復元useEffect + 変更時保存useEffect | ~55 |
| `features/tabs/useTabs.ts` | state, openTab, closeTab, selectTab等 + 上記フック統合 | ~95 |

#### 3-B. `useFileSystem.ts` (143行) → 2ファイル
| ファイル | 内容 | 想定行数 |
|---------|------|---------|
| `features/sidebar/useDirectoryInit.ts` | 初期化useEffect + restoreStoredDirectory | ~55 |
| `features/sidebar/useFileSystem.ts` | state, openDirectory, toggleDirectory, refreshDirectory | ~80 |

### フェーズ4: UIコンポーネント

#### 4-A. `ThemePanel.tsx` (389行) → 4ファイル
| ファイル | 内容 | 想定行数 |
|---------|------|---------|
| `features/theme/themeConstants.ts` | colorLabels, colorGroups, accentColorKeys等, ColorKey型 | ~60 |
| `features/theme/ThemeEditor.tsx` | 編集モードUI（テーマ名、カラーグループ、ColorPicker） | ~95 |
| `features/theme/ThemeList.tsx` | プリセット一覧 + カスタムテーマ一覧 | ~95 |
| `features/theme/ThemePanel.tsx` | 外枠 + state + ハンドラ + ThemeEditor/ThemeList切替 | ~85 |

#### 4-B. `Sidebar.tsx` (344行) → 4ファイル
| ファイル | 内容 | 想定行数 |
|---------|------|---------|
| `features/sidebar/icons.tsx` | FileIcon, FolderIcon, ChevronIcon | ~45 |
| `features/sidebar/DirectoryTree.tsx` | DirectoryTree (React.memo) | ~70 |
| `features/sidebar/contextMenuItems.ts` | getContextMenuItems関数 | ~75 |
| `features/sidebar/Sidebar.tsx` | メインコンポーネント | ~90 |

#### 4-C. `Toolbar.tsx` (328行) → 4ファイル
| ファイル | 内容 | 想定行数 |
|---------|------|---------|
| `features/toolbar/CopyButtons.tsx` | MD/HTMLコピーボタン + state | ~80 |
| `features/toolbar/FontDropdown.tsx` | フォント選択ドロップダウン | ~55 |
| `features/toolbar/TextSettingsDropdown.tsx` | 行間・文字間隔設定 | ~70 |
| `features/toolbar/Toolbar.tsx` | レイアウト統合 | ~65 |

#### 4-D. `MarkdownPreview.tsx` (268行) → 4ファイル
| ファイル | 内容 | 想定行数 |
|---------|------|---------|
| `features/preview/searchHighlight.ts` | applySearchHighlight, contentWidthMap | ~30 |
| `features/preview/useHeadingObserver.ts` | スクロール監視 + 脚注クリック処理 | ~80 |
| `features/preview/useThemeStyle.ts` | テーマCSS適用 + フォント読み込み | ~35 |
| `features/preview/MarkdownPreview.tsx` | メインコンポーネント | ~75 |

#### 4-E. `TabBar.tsx` (143行) → 3ファイル
| ファイル | 内容 | 想定行数 |
|---------|------|---------|
| `features/tabs/useTabDrag.ts` | ドラッグ&ドロップロジック | ~60 |
| `features/tabs/TabItem.tsx` | 個別タブ要素 | ~55 |
| `features/tabs/TabBar.tsx` | タブバー外枠 | ~30 |

#### 4-F. `SearchBar.tsx` (120行) → 2ファイル
| ファイル | 内容 | 想定行数 |
|---------|------|---------|
| `features/search/SearchInput.tsx` | 検索入力フィールド | ~35 |
| `features/search/SearchBar.tsx` | メイン + ナビゲーション | ~80 |

### フェーズ5: ルートコンポーネント

#### 5-A. `App.tsx` (258行) → 3ファイル
| ファイル | 内容 | 想定行数 |
|---------|------|---------|
| `src/useAppHandlers.ts` | 設定変更ハンドラ群7個 | ~55 |
| `src/MainContent.tsx` | メインコンテンツエリアJSX | ~80 |
| `src/App.tsx` | フック統合 + レイアウト | ~80 |

---

## 注意点
- `presets.ts` → `presets/` ディレクトリ化: `import from './presets'` は `presets/index.ts` に解決される
- `markdown.ts` のモジュールスコープ変数: `markdownRenderer.ts` から `export let` で公開し、`markdown.ts` でリセット
- `themeStyles.ts`, `fileSystem.ts` は re-export ファイルとして残し、外部importパスを維持
- `directoryStorage.ts`, `tabStorage.ts` は削除し、import先を直接更新
- `features/theme/index.ts`, `features/tabs/index.ts` の re-export は変更不要（公開APIは同じ）

## 検証方法
1. `npm run build` でビルドエラーがないことを確認
2. `npm run test` で既存テストが全てパスすることを確認
3. 全ファイルが100行以内であることを `wc -l` で確認
4. Chrome拡張としてロードし、主要機能（テーマ切替、ファイル開く、検索、タブ操作）が動作することを確認
5. `manifest.json` の version を更新
6. zip を再作成
