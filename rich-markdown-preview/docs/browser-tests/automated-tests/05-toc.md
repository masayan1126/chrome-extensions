# 05: 目次（TOC）テスト

目次の自動生成、スクロール同期、表示切替を検証します。

## 前提条件

- `test-comprehensive.md` が開かれた状態（複数レベルの見出しを含む）
- タブIDを取得済み

## テストケース

### TC-05-1: 目次の存在確認

**操作:**
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    // TOCコンポーネントの存在を確認
    const tocItems = document.querySelectorAll('[class*="toc"] a, [class*="TOC"] a, nav a');
    const tocTexts = Array.from(tocItems).map(a => a.textContent.trim()).filter(t => t.length > 0);
    JSON.stringify({
      tocItemCount: tocTexts.length,
      sampleItems: tocTexts.slice(0, 10)
    });
  `
})
```

**検証:**
- 目次に見出し（H1〜H6）が含まれていること
- 文書中の見出し数と目次の項目数が一致すること

---

### TC-05-2: 目次からのジャンプ

**操作:**
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    // 目次の「コードブロック」項目をクリック
    const tocLinks = document.querySelectorAll('[class*="toc"] a, nav a');
    const codeLink = Array.from(tocLinks).find(a => a.textContent.includes('コードブロック'));
    if (codeLink) codeLink.click();

    await new Promise(r => setTimeout(r, 500));

    // スクロール位置を確認
    const contentArea = document.querySelector('[class*="overflow-auto"], [class*="overflow-y"]');
    JSON.stringify({
      clicked: !!codeLink,
      scrollTop: contentArea?.scrollTop || 0
    });
  `
})
```

**検証:**
- 「コードブロック」セクションまでスクロールされること
- スクロールが滑らか（smooth scroll）であること

---

### TC-05-3: スクロール位置のハイライト同期

**操作:**
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    // プレビューエリアをスクロール
    const contentArea = document.querySelector('[class*="overflow-auto"], [class*="overflow-y"]');
    if (contentArea) {
      contentArea.scrollTo({ top: contentArea.scrollHeight / 2, behavior: 'instant' });
    }

    await new Promise(r => setTimeout(r, 500));

    // アクティブな目次項目を確認
    const activeTocItem = document.querySelector('[class*="toc"] [class*="active"], [class*="toc"] [class*="font-bold"], [class*="toc"] [class*="text-blue"]');
    JSON.stringify({
      activeItem: activeTocItem?.textContent?.trim() || 'none',
      scrollPosition: contentArea?.scrollTop || 0
    });
  `
})
```

**検証:**
- スクロール位置に対応する見出しが目次内でハイライトされていること

---

### TC-05-4: TOCの非表示

**操作:**
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    // TOCトグルボタンをクリック
    const buttons = document.querySelectorAll('button');
    const tocBtn = Array.from(buttons).find(b => {
      const svg = b.querySelector('svg');
      return svg && b.getAttribute('title')?.includes('目次') ||
             b.textContent.includes('TOC') ||
             b.querySelector('[class*="list"]');
    });
    if (tocBtn) tocBtn.click();

    await new Promise(r => setTimeout(r, 300));

    const tocPanel = document.querySelector('[class*="toc"], [class*="TOC"]');
    JSON.stringify({
      tocVisible: tocPanel ? tocPanel.offsetParent !== null : false,
      buttonClicked: !!tocBtn
    });
  `
})
```

**検証:**
- 目次パネルが非表示になること

---

### TC-05-5: TOCの再表示

**操作:**
同じTOCトグルボタンを再度クリック：
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    const buttons = document.querySelectorAll('button');
    const tocBtn = Array.from(buttons).find(b => {
      const svg = b.querySelector('svg');
      return svg && b.getAttribute('title')?.includes('目次') ||
             b.textContent.includes('TOC') ||
             b.querySelector('[class*="list"]');
    });
    if (tocBtn) tocBtn.click();

    await new Promise(r => setTimeout(r, 300));

    const tocPanel = document.querySelector('[class*="toc"], [class*="TOC"]');
    const tocItems = tocPanel?.querySelectorAll('a');
    JSON.stringify({
      tocVisible: tocPanel ? tocPanel.offsetParent !== null : false,
      itemCount: tocItems?.length || 0
    });
  `
})
```

**検証:**
- 目次パネルが再表示されること
- 目次項目が正しく表示されていること
