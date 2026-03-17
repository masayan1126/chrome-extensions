# 04: 検索機能テスト

検索パネルの起動、テキスト検索、マッチナビゲーションを検証します。

## 前提条件

- `test-comprehensive.md` が開かれた状態（「テスト」という単語が複数回含まれる）
- タブIDを取得済み

## テストケース

### TC-04-1: 検索パネルの起動（Cmd+F）

**操作:**
```
mcp__claude-in-chrome__shortcuts_execute({
  tabId: <TAB_ID>,
  shortcut: "Meta+f"
})
```

**検証:**
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    // 検索バーの表示を確認
    const searchInput = document.querySelector('input[type="text"][placeholder*="検索"], input[type="search"]');
    JSON.stringify({
      searchBarVisible: !!searchInput,
      focused: document.activeElement === searchInput
    });
  `
})
```
- 検索パネルが表示されること
- テキスト入力欄にフォーカスがあること

---

### TC-04-2: テキスト検索とマッチ数表示

**操作:**
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    const searchInput = document.querySelector('input[type="text"]');
    if (searchInput) {
      // React の onChange を発火させるため nativeInputValueSetter を使用
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      ).set;
      nativeInputValueSetter.call(searchInput, 'テスト');
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    await new Promise(r => setTimeout(r, 500));

    // マッチ数の表示を確認
    const matchInfo = document.body.innerText.match(/\\d+\\s*\\/\\s*\\d+/);
    JSON.stringify({ matchInfo: matchInfo?.[0] || 'not found' });
  `
})
```

**検証:**
- マッチ数が「X / Y」形式で表示されること（Yは5以上を期待）

---

### TC-04-3: マッチ箇所のハイライト確認

**操作:**
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    const highlights = document.querySelectorAll('mark, [class*="highlight"], [style*="background"]');
    const searchHighlights = Array.from(highlights).filter(el =>
      el.textContent.includes('テスト')
    );
    JSON.stringify({
      highlightCount: searchHighlights.length,
      firstHighlight: searchHighlights[0]?.textContent?.substring(0, 50)
    });
  `
})
```

**検証:**
- 「テスト」に該当する箇所がハイライト表示されていること

---

### TC-04-4: 次のマッチへ移動（Enter）

**操作:**
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    const searchInput = document.querySelector('input[type="text"]');
    if (searchInput) {
      searchInput.focus();
      searchInput.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter', bubbles: true
      }));
    }

    await new Promise(r => setTimeout(r, 300));

    const matchInfo = document.body.innerText.match(/\\d+\\s*\\/\\s*\\d+/);
    JSON.stringify({ currentMatch: matchInfo?.[0] || 'not found' });
  `
})
```

**検証:**
- マッチ位置が「1 / Y」から「2 / Y」に変わること
- 表示が対応するマッチ箇所にスクロールすること

---

### TC-04-5: 前のマッチへ移動（Shift+Enter）

**操作:**
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    const searchInput = document.querySelector('input[type="text"]');
    if (searchInput) {
      searchInput.focus();
      searchInput.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter', shiftKey: true, bubbles: true
      }));
    }

    await new Promise(r => setTimeout(r, 300));

    const matchInfo = document.body.innerText.match(/\\d+\\s*\\/\\s*\\d+/);
    JSON.stringify({ currentMatch: matchInfo?.[0] || 'not found' });
  `
})
```

**検証:**
- マッチ位置が1つ前に戻ること

---

### TC-04-6: 検索パネルを閉じる（Escape）

**操作:**
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Escape', bubbles: true
    }));

    await new Promise(r => setTimeout(r, 300));

    const searchInput = document.querySelector('input[type="text"]');
    const isVisible = searchInput && searchInput.offsetParent !== null;
    const highlights = document.querySelectorAll('mark, [class*="highlight"]');
    JSON.stringify({
      searchBarVisible: isVisible,
      remainingHighlights: highlights.length
    });
  `
})
```

**検証:**
- 検索パネルが非表示になること
- ハイライトが解除されること

---

### TC-04-7: 検索結果なしのケース

**操作:**
検索パネルを開いた後：
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    const searchInput = document.querySelector('input[type="text"]');
    if (searchInput) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      ).set;
      nativeInputValueSetter.call(searchInput, 'zzzzxxxxxnoexist');
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    await new Promise(r => setTimeout(r, 500));

    const matchInfo = document.body.innerText.match(/\\d+\\s*\\/\\s*\\d+/);
    JSON.stringify({ matchInfo: matchInfo?.[0] || 'not found' });
  `
})
```

**検証:**
- マッチ数が「0 / 0」と表示されること
