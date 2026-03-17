# 06: タブ管理テスト

タブの開閉、切替、アクティブ状態の管理を検証します。

## 前提条件

- フォルダが開かれ、複数のMarkdownファイルがサイドバーに表示されている状態
- タブIDを取得済み

## テストケース

### TC-06-1: ファイルをタブで開く

**操作:**
サイドバーのファイルをクリック：
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    // サイドバー内のファイルリンクを取得
    const fileItems = document.querySelectorAll('[class*="sidebar"] [class*="file"], [class*="sidebar"] span, [class*="sidebar"] button');
    const mdFiles = Array.from(fileItems).filter(el => el.textContent.endsWith('.md'));
    JSON.stringify({
      fileCount: mdFiles.length,
      files: mdFiles.map(f => f.textContent.trim()).slice(0, 10)
    });
  `
})
```

最初のファイルをクリック：
```
mcp__claude-in-chrome__find({
  tabId: <TAB_ID>,
  query: "<FILE_NAME>.md",
  action: "click"
})
```

**検証:**
- クリックしたファイルが新しいタブとして追加されること

---

### TC-06-2: タブの存在確認

**操作:**
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    // タブバーの全タブを取得
    const tabBar = document.querySelector('[class*="tab-bar"], [class*="tabbar"], [class*="tabs"]');
    const tabs = tabBar?.querySelectorAll('[class*="tab"]') || [];
    const tabNames = Array.from(tabs).map(t => t.textContent.trim());
    const activeTab = Array.from(tabs).find(t =>
      t.classList.contains('active') ||
      t.getAttribute('data-active') === 'true' ||
      getComputedStyle(t).opacity !== '0.5'
    );
    JSON.stringify({
      tabCount: tabNames.length,
      tabNames,
      activeTab: activeTab?.textContent?.trim()
    });
  `
})
```

**検証:**
- タブバーに開いたファイルのタブが表示されていること
- アクティブタブが最後に開いたファイルであること

---

### TC-06-3: タブの切替

**操作:**
2つ以上のタブがある状態で、非アクティブなタブをクリック：
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    const tabs = document.querySelectorAll('[class*="tab-bar"] [class*="tab"], [class*="tabs"] [class*="tab"]');
    if (tabs.length >= 2) {
      // 最初のタブをクリック
      tabs[0].click();
    }

    await new Promise(r => setTimeout(r, 300));

    JSON.stringify({
      clickedTab: tabs[0]?.textContent?.trim(),
      tabCount: tabs.length
    });
  `
})
```

**検証:**
- クリックしたタブがアクティブになること
- プレビュー内容がそのタブのファイルに切り替わること

---

### TC-06-4: タブを閉じる

**操作:**
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    // タブ内の×ボタンを探す
    const tabs = document.querySelectorAll('[class*="tab-bar"] [class*="tab"], [class*="tabs"] [class*="tab"]');
    const initialCount = tabs.length;

    // 最後のタブの×ボタンをクリック
    const lastTab = tabs[tabs.length - 1];
    const closeBtn = lastTab?.querySelector('button, [class*="close"], svg');
    if (closeBtn) closeBtn.click();

    await new Promise(r => setTimeout(r, 300));

    const remainingTabs = document.querySelectorAll('[class*="tab-bar"] [class*="tab"], [class*="tabs"] [class*="tab"]');
    JSON.stringify({
      initialCount,
      remainingCount: remainingTabs.length,
      closedTab: lastTab?.textContent?.trim()
    });
  `
})
```

**検証:**
- タブ数が1つ減ること
- 残りのタブのいずれかがアクティブになること

---

### TC-06-5: 同一ファイルの重複防止

**操作:**
既に開いているファイルをサイドバーから再度クリック：
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    // 現在のタブ数を記録
    const tabsBefore = document.querySelectorAll('[class*="tab-bar"] [class*="tab"], [class*="tabs"] [class*="tab"]');
    const countBefore = tabsBefore.length;
    const activeTabName = Array.from(tabsBefore).find(t =>
      getComputedStyle(t).opacity !== '0.5'
    )?.textContent?.trim();

    JSON.stringify({ countBefore, activeTabName });
  `
})
```

同じファイルをクリック後：
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    const tabsAfter = document.querySelectorAll('[class*="tab-bar"] [class*="tab"], [class*="tabs"] [class*="tab"]');
    JSON.stringify({ countAfter: tabsAfter.length });
  `
})
```

**検証:**
- タブ数が増えないこと（重複してタブが作られないこと）
- 既存のタブがアクティブになること

---

### TC-06-6: 全タブ閉じた後の状態

**操作:**
```
mcp__claude-in-chrome__javascript_tool({
  tabId: <TAB_ID>,
  javascript: `
    // すべてのタブを閉じる
    let tabs = document.querySelectorAll('[class*="tab-bar"] [class*="tab"], [class*="tabs"] [class*="tab"]');
    while (tabs.length > 0) {
      const closeBtn = tabs[0].querySelector('button, [class*="close"], svg');
      if (closeBtn) closeBtn.click();
      await new Promise(r => setTimeout(r, 200));
      tabs = document.querySelectorAll('[class*="tab-bar"] [class*="tab"], [class*="tabs"] [class*="tab"]');
    }

    await new Promise(r => setTimeout(r, 300));
    JSON.stringify({ remainingTabs: tabs.length });
  `
})
```

**検証:**
- 全タブが閉じられ、メインエリアが空の状態に戻ること
