# 02: テーマテスト

テーマ切替、カラー適用、ダーク/ライト判定を検証します。

## 前提条件

- 拡張機能起動済み、Markdownファイルが1つ以上開かれていること
- タブIDを取得済み

## テストケース

### TC-02-1: テーマパネルを開く

**操作:**
```
mcp__claude-in-chrome__find({
  tabId: <TAB_ID>,
  query: "GitHub Dark",
  action: "click"
})
```

**検証:**
- テーマパネルが開き、テーマ一覧が表示されること

---

### TC-02-2: ダークテーマへの切替（Dracula）

**操作:**
```
mcp__claude-in-chrome__find({
  tabId: <TAB_ID>,
  query: "Dracula",
  action: "click"
})
```

**検証（CSS確認）:**
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    const root = document.querySelector('[class*="h-screen"]');
    const bg = root?.style?.backgroundColor || getComputedStyle(root).backgroundColor;
    JSON.stringify({ backgroundColor: bg });
  `
})
```
- 背景色がDraculaテーマの暗い背景色（#282a36付近）に変わること

---

### TC-02-3: ライトテーマへの切替（GitHub Light）

**操作:**
テーマボタンをクリックしてパネルを開く
```
mcp__claude-in-chrome__find({
  tabId: <TAB_ID>,
  query: "GitHub Light",
  action: "click"
})
```

**検証:**
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    const root = document.querySelector('[class*="h-screen"]');
    const bg = root?.style?.backgroundColor || getComputedStyle(root).backgroundColor;
    JSON.stringify({ backgroundColor: bg });
  `
})
```
- 背景色が明るい色に変わること

---

### TC-02-4: テーマ切替後のスクリーンショット比較

**操作:**
テーマを切り替えた後：
```
mcp__claude-in-chrome__get_screenshot({
  tabId: <TAB_ID>
})
```

**検証:**
- 見出し・テキスト・コードブロックの色がテーマに応じて変化していること

---

### TC-02-5: テーマパネルを閉じる

**操作:**
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    // ESCキーでパネルを閉じる
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    'done';
  `
})
```

**検証:**
- テーマパネルが閉じること

---

### TC-02-6: 複数テーマの色検証

テーマを順次切り替えて背景色を確認する包括テスト：

**操作:**
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    const root = document.querySelector('[class*="h-screen"]');
    JSON.stringify({
      backgroundColor: root?.style?.backgroundColor,
      textColor: getComputedStyle(root).color
    });
  `
})
```

**検証:**
- 各テーマで背景色とテキスト色が異なること
- ダークテーマでは暗い背景＋明るい文字
- ライトテーマでは明るい背景＋暗い文字
