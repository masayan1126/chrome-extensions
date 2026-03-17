# 03: フォント・テキスト設定テスト

フォント切替、サイズ変更、行間・文字間隔の調整を検証します。

## 前提条件

- Markdownファイルが開かれた状態
- タブIDを取得済み

## テストケース

### TC-03-1: 現在のフォントサイズを取得

**操作:**
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    const preview = document.querySelector('[class*="markdown"]') || document.querySelector('.prose');
    const fontSize = preview ? getComputedStyle(preview).fontSize : 'not found';
    JSON.stringify({ fontSize });
  `
})
```

**検証:**
- 初期フォントサイズ（デフォルト16px）が取得できること

---

### TC-03-2: フォントサイズの拡大

**操作:**
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    // +ボタンを探してクリック
    const buttons = document.querySelectorAll('button');
    const plusBtn = Array.from(buttons).find(b => b.textContent.trim() === '+');
    if (plusBtn) { plusBtn.click(); plusBtn.click(); plusBtn.click(); }

    // 少し待ってからフォントサイズを確認
    await new Promise(r => setTimeout(r, 300));
    const preview = document.querySelector('[class*="markdown"]') || document.querySelector('.prose');
    JSON.stringify({ fontSize: preview ? getComputedStyle(preview).fontSize : 'not found' });
  `
})
```

**検証:**
- フォントサイズが初期値から3px増加していること（例: 16px → 19px）

---

### TC-03-3: フォントサイズの縮小

**操作:**
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    const buttons = document.querySelectorAll('button');
    const minusBtn = Array.from(buttons).find(b => b.textContent.trim() === '-');
    if (minusBtn) { minusBtn.click(); }

    await new Promise(r => setTimeout(r, 300));
    const preview = document.querySelector('[class*="markdown"]') || document.querySelector('.prose');
    JSON.stringify({ fontSize: preview ? getComputedStyle(preview).fontSize : 'not found' });
  `
})
```

**検証:**
- フォントサイズが1px減少していること

---

### TC-03-4: フォントサイズの上限確認

**操作:**
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    const buttons = document.querySelectorAll('button');
    const plusBtn = Array.from(buttons).find(b => b.textContent.trim() === '+');
    // 20回クリックして上限に達するか確認
    for (let i = 0; i < 20; i++) { if (plusBtn) plusBtn.click(); }

    await new Promise(r => setTimeout(r, 300));
    const preview = document.querySelector('[class*="markdown"]') || document.querySelector('.prose');
    JSON.stringify({ fontSize: preview ? getComputedStyle(preview).fontSize : 'not found' });
  `
})
```

**検証:**
- フォントサイズが32pxを超えないこと

---

### TC-03-5: フォントファミリーの切替

**操作:**
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    // フォントドロップダウンを探す
    const selects = document.querySelectorAll('select, [role="listbox"]');
    const fontSelect = selects[0]; // フォント選択UI
    JSON.stringify({
      found: !!fontSelect,
      tagName: fontSelect?.tagName,
      options: fontSelect ? Array.from(fontSelect.options || []).map(o => o.text) : []
    });
  `
})
```

フォントドロップダウンをクリック：
```
mcp__claude-in-chrome__find({
  tabId: <TAB_ID>,
  query: "Noto Sans JP",
  action: "click"
})
```

**検証:**
- フォント切替後、プレビュー内のテキストが選択したフォントで表示されること

---

### TC-03-6: フォント変更のスクリーンショット確認

**操作:**
各フォントに切り替えた後：
```
mcp__claude-in-chrome__get_screenshot({
  tabId: <TAB_ID>
})
```

**検証:**
- フォントの違いがスクリーンショットで視覚的に確認できること
