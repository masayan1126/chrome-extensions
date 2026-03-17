# 07: コピー機能テスト

Markdownソースコピー、HTMLコピー、コピー後のフィードバック表示を検証します。

## 前提条件

- Markdownファイルが1つ以上開かれた状態
- タブIDを取得済み

## テストケース

### TC-07-1: MDコピーボタンの状態確認

**操作:**
```
mcp__claude-in-chrome__find({
  tabId: <TAB_ID>,
  query: "MDコピー"
})
```

**検証:**
- 「MDコピー」ボタンが表示されていること
- ファイルが開かれている場合、ボタンがクリック可能な状態であること

---

### TC-07-2: MDコピーの実行とフィードバック

**操作:**
```
mcp__claude-in-chrome__find({
  tabId: <TAB_ID>,
  query: "MDコピー",
  action: "click"
})
```

クリック直後のフィードバックを確認：
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    // コピー完了のフィードバックを確認
    await new Promise(r => setTimeout(r, 200));

    const buttons = document.querySelectorAll('button');
    const copyBtn = Array.from(buttons).find(b =>
      b.textContent.includes('コピー') ||
      b.textContent.includes('Copied') ||
      b.textContent.includes('✓') ||
      b.querySelector('[class*="check"]')
    );

    JSON.stringify({
      feedbackText: copyBtn?.textContent?.trim(),
      hasCheckIcon: !!copyBtn?.querySelector('[class*="check"], svg')
    });
  `
})
```

**検証:**
- クリック後にボタン表示が変化すること（チェックマークやテキスト変更）
- 数秒後に元の表示に戻ること

---

### TC-07-3: HTMLコピーの実行

**操作:**
```
mcp__claude-in-chrome__find({
  tabId: <TAB_ID>,
  query: "HTMLコピー",
  action: "click"
})
```

**検証:**
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    await new Promise(r => setTimeout(r, 200));

    const buttons = document.querySelectorAll('button');
    const htmlBtn = Array.from(buttons).find(b =>
      b.textContent.includes('HTML')
    );

    JSON.stringify({
      buttonText: htmlBtn?.textContent?.trim()
    });
  `
})
```

- HTMLコピーボタンクリック後にフィードバックが表示されること

---

### TC-07-4: クリップボード内容の検証

**操作:**
MDコピー後にクリップボードの内容を読み取る：
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    try {
      const text = await navigator.clipboard.readText();
      JSON.stringify({
        clipboardContent: text.substring(0, 200),
        isMarkdown: text.includes('#') || text.includes('```') || text.includes('- ')
      });
    } catch (e) {
      JSON.stringify({ error: e.message });
    }
  `
})
```

**検証:**
- MDコピー後: クリップボードにMarkdownソーステキストが含まれること
- HTMLコピー後: クリップボードにHTML形式のコンテンツが含まれること

> **注意:** クリップボードAPIのパーミッションにより、読み取りが制限される場合がある。その場合はフィードバック表示の確認のみとする。

---

### TC-07-5: フィードバック表示の時間確認

**操作:**
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    // MDコピーボタンをクリック
    const buttons = document.querySelectorAll('button');
    const mdBtn = Array.from(buttons).find(b => b.textContent.includes('MDコピー') || b.textContent.includes('MD'));
    if (mdBtn) mdBtn.click();

    // 即座に状態確認
    await new Promise(r => setTimeout(r, 100));
    const state1 = mdBtn?.textContent?.trim();

    // 3秒後に元に戻っているか確認
    await new Promise(r => setTimeout(r, 3000));
    const state2 = mdBtn?.textContent?.trim();

    JSON.stringify({
      immediateState: state1,
      afterDelayState: state2,
      stateChanged: state1 !== state2
    });
  `
})
```

**検証:**
- コピー直後: ボタン表示がフィードバック状態に変化していること
- 数秒後: ボタン表示が元に戻っていること
