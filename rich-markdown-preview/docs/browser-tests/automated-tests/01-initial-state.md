# 01: 初期状態テスト

拡張機能の初期表示とUI要素の存在を検証します。

## 前提条件

- 拡張機能が起動済み
- `tabs_context_mcp` でタブIDを取得済み

## テストケース

### TC-01-1: ツールバーの表示確認

**操作:**
```
mcp__claude-in-chrome__find({
  tabId: <TAB_ID>,
  query: "Rich Markdown Preview"
})
```

**検証:**
- 「Rich Markdown Preview」テキストが画面内に存在すること

---

### TC-01-2: コピーボタンの存在確認

**操作:**
```
mcp__claude-in-chrome__find({
  tabId: <TAB_ID>,
  query: "MDコピー"
})
```
```
mcp__claude-in-chrome__find({
  tabId: <TAB_ID>,
  query: "HTMLコピー"
})
```

**検証:**
- 「MDコピー」ボタンが存在すること
- 「HTMLコピー」ボタンが存在すること

---

### TC-01-3: フォントサイズボタンの存在確認

**操作:**
```
mcp__claude-in-chrome__read_page({
  tabId: <TAB_ID>,
  selector: "button"
})
```

**検証:**
- フォントサイズの「+」「-」ボタンが存在すること

---

### TC-01-4: テーマボタンの存在確認

**操作:**
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    const buttons = document.querySelectorAll('button');
    const themeBtn = Array.from(buttons).find(b =>
      b.textContent.includes('GitHub Dark') ||
      b.textContent.includes('テーマ')
    );
    JSON.stringify({
      found: !!themeBtn,
      text: themeBtn?.textContent?.trim()
    });
  `
})
```

**検証:**
- テーマボタンが存在し、現在のテーマ名が表示されていること

---

### TC-01-5: サイドバーの表示確認

**操作:**
```
mcp__claude-in-chrome__find({
  tabId: <TAB_ID>,
  query: "フォルダを開く"
})
```

**検証:**
- フォルダ未選択の場合「フォルダを開く」ボタンが表示されること
- フォルダ選択済みの場合はファイルツリーが表示されること

---

### TC-01-6: 全体レイアウトのスクリーンショット

**操作:**
```
mcp__claude-in-chrome__get_screenshot({
  tabId: <TAB_ID>
})
```

**検証:**
- ツールバー（上部）、サイドバー（左）、メインコンテンツ（右）の3カラムレイアウトが正しく表示されていること
