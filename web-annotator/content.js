// Web Annotator - Content Script
// ハイライトと付箋の機能を提供

(function() {
  'use strict';

  // 現在のページURL（正規化）
  const pageUrl = window.location.href.split('#')[0];

  // データストア
  let highlights = [];
  let stickyNotes = [];

  // カラーパレット（黄色、緑、青、赤）
  const HIGHLIGHT_COLORS = [
    '#fef08a', // 黄色（やわらかい）
    '#86efac', // 緑（やわらかい）
    '#93c5fd', // 青（やわらかい）
    '#fca5a5'  // 赤（やわらかい）
  ];

  // SVGアイコン
  const ICONS = {
    highlight: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
    note: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`
  };

  let currentColorIndex = 0;
  let highlightObserver = null;
  let isRenderingHighlights = false;

  // ============================================
  // 初期化
  // ============================================

  async function init() {
    await loadData();
    renderStickyNotes();
    setupEventListeners();
    createFloatingToolbar();

    // DOMが完全に構築されるまで待機（SPAの初期レンダリング完了を待つ）
    // 複数回に分けてリトライする
    scheduleHighlightRender();
  }

  function scheduleHighlightRender() {
    // 初回: 100ms後
    setTimeout(() => {
      renderHighlights();
      // 2回目: 500ms後（SPAの遅延レンダリング対応）
      setTimeout(() => {
        renderHighlights();
        // 3回目: 1500ms後（非常に遅いSPA対応）
        setTimeout(() => {
          renderHighlights();
          // 監視を開始
          startHighlightObserver();
        }, 1000);
      }, 400);
    }, 100);
  }

  // ============================================
  // ハイライト監視（MutationObserver）
  // ============================================

  function startHighlightObserver() {
    if (highlightObserver) {
      highlightObserver.disconnect();
    }

    highlightObserver = new MutationObserver((mutations) => {
      // レンダリング中は無視
      if (isRenderingHighlights) return;

      // ハイライトが消えていないかチェック
      let needsRerender = false;
      for (const hl of highlights) {
        const existing = document.querySelector(`[data-highlight-id="${hl.id}"]`);
        if (!existing) {
          needsRerender = true;
          break;
        }
      }

      if (needsRerender) {
        console.log('[Web Annotator] Highlights removed, re-rendering...');
        // 少し遅延させて、ページの再レンダリングが完了してから復元
        setTimeout(() => {
          renderHighlights();
        }, 50);
      }
    });

    highlightObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // ============================================
  // データの読み込み・保存
  // ============================================

  async function loadData() {
    return new Promise((resolve) => {
      chrome.storage.local.get([pageUrl], (result) => {
        const data = result[pageUrl] || { highlights: [], stickyNotes: [] };
        highlights = data.highlights || [];
        stickyNotes = data.stickyNotes || [];
        resolve();
      });
    });
  }

  async function saveData() {
    return new Promise((resolve) => {
      chrome.storage.local.set({
        [pageUrl]: {
          highlights: highlights,
          stickyNotes: stickyNotes,
          title: document.title,
          lastModified: Date.now()
        }
      }, resolve);
    });
  }

  // ============================================
  // ハイライト機能
  // ============================================

  function createHighlightId() {
    return 'hl-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  function highlightSelection() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return null;

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();

    if (!selectedText) return null;

    const highlightId = createHighlightId();
    const color = HIGHLIGHT_COLORS[currentColorIndex];

    // XPathを使用して位置情報を保存
    const startXPath = getXPathForNode(range.startContainer);
    const endXPath = getXPathForNode(range.endContainer);

    const highlightData = {
      id: highlightId,
      text: selectedText,
      color: color,
      startXPath: startXPath,
      startOffset: range.startOffset,
      endXPath: endXPath,
      endOffset: range.endOffset,
      createdAt: Date.now()
    };

    // ハイライトを適用
    applyHighlight(range, highlightId, color);

    // データを保存
    highlights.push(highlightData);
    saveData();

    // 選択を解除
    selection.removeAllRanges();

    // ツールバーを非表示
    hideFloatingToolbar();

    return highlightData;
  }

  function applyHighlight(range, highlightId, color) {
    // 複数ノードにまたがる場合は、各テキストノードを個別にハイライト
    const textNodes = getTextNodesInRange(range);

    if (textNodes.length === 0) {
      console.warn('[Web Annotator] No text nodes found in range');
      return;
    }

    textNodes.forEach((textNode, index) => {
      const span = document.createElement('span');
      span.className = 'web-annotator-highlight';
      span.dataset.highlightId = highlightId;
      // 複数ノードの場合、パーツインデックスを付加
      if (textNodes.length > 1) {
        span.dataset.highlightPart = index;
      }
      span.style.backgroundColor = color;
      span.style.cursor = 'pointer';

      // テキストノードの範囲を決定
      let startOffset = 0;
      let endOffset = textNode.textContent.length;

      if (textNode === range.startContainer) {
        startOffset = range.startOffset;
      }
      if (textNode === range.endContainer) {
        endOffset = range.endOffset;
      }

      // 部分的にハイライトする必要がある場合
      if (startOffset > 0 || endOffset < textNode.textContent.length) {
        const nodeRange = document.createRange();
        nodeRange.setStart(textNode, startOffset);
        nodeRange.setEnd(textNode, endOffset);
        try {
          nodeRange.surroundContents(span);
        } catch (e) {
          // フォールバック
          const text = textNode.textContent.substring(startOffset, endOffset);
          span.textContent = text;
          nodeRange.deleteContents();
          nodeRange.insertNode(span);
        }
      } else {
        // テキストノード全体をラップ
        const parent = textNode.parentNode;
        parent.insertBefore(span, textNode);
        span.appendChild(textNode);
      }

      // クリックイベントを追加
      span.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey) {
          removeHighlight(highlightId);
        }
      });
    });
  }

  // 範囲内のテキストノードを取得
  function getTextNodesInRange(range) {
    const textNodes = [];
    const startContainer = range.startContainer;
    const endContainer = range.endContainer;

    // 同じノードの場合
    if (startContainer === endContainer && startContainer.nodeType === Node.TEXT_NODE) {
      return [startContainer];
    }

    // TreeWalkerで範囲内のテキストノードを収集
    const walker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // 空のテキストノードは除外
          if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
          // script/style内は除外
          const parent = node.parentElement;
          if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
            return NodeFilter.FILTER_REJECT;
          }
          // 既存のハイライト内は除外
          if (parent && parent.closest('.web-annotator-highlight')) {
            return NodeFilter.FILTER_REJECT;
          }
          // 範囲内かチェック
          const nodeRange = document.createRange();
          nodeRange.selectNodeContents(node);
          if (range.compareBoundaryPoints(Range.END_TO_START, nodeRange) >= 0) {
            return NodeFilter.FILTER_REJECT; // 範囲より前
          }
          if (range.compareBoundaryPoints(Range.START_TO_END, nodeRange) <= 0) {
            return NodeFilter.FILTER_REJECT; // 範囲より後
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    // startContainerがテキストノードで、まだ含まれていない場合は先頭に追加
    if (startContainer.nodeType === Node.TEXT_NODE && !textNodes.includes(startContainer)) {
      textNodes.unshift(startContainer);
    }

    return textNodes;
  }

  function renderHighlights() {
    isRenderingHighlights = true;
    console.log('[Web Annotator] Rendering highlights:', highlights.length);

    highlights.forEach((hl, index) => {
      try {
        // 既にハイライトされているか確認
        const existing = document.querySelector(`[data-highlight-id="${hl.id}"]`);
        if (existing) {
          console.log(`[Web Annotator] Highlight ${index} already exists`);
          return;
        }

        const startNode = getNodeByXPath(hl.startXPath);
        const endNode = getNodeByXPath(hl.endXPath);

        if (!startNode || !endNode) {
          console.log(`[Web Annotator] Highlight ${index}: XPath not found, trying text search for "${hl.text.substring(0, 30)}..."`);
          findAndHighlightText(hl);
          return;
        }

        const range = document.createRange();
        range.setStart(startNode, Math.min(hl.startOffset, startNode.length || 0));
        range.setEnd(endNode, Math.min(hl.endOffset, endNode.length || 0));

        applyHighlight(range, hl.id, hl.color);
        console.log(`[Web Annotator] Highlight ${index} restored via XPath`);
      } catch (e) {
        console.log(`[Web Annotator] Highlight ${index}: Error, trying text search`, e.message);
        findAndHighlightText(hl);
      }
    });

    // レンダリング完了後にフラグをリセット
    setTimeout(() => {
      isRenderingHighlights = false;
    }, 100);
  }

  function findAndHighlightText(hl) {
    const searchText = hl.text.trim();
    if (!searchText) return;

    // 既にハイライトされているか確認
    const existing = document.querySelector(`[data-highlight-id="${hl.id}"]`);
    if (existing) return;

    // 方法1: 単一テキストノード内で検索
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // 空白のみ、script/style内は除外
          if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
          const parent = node.parentElement;
          if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
            return NodeFilter.FILTER_REJECT;
          }
          // 既存のハイライト内は除外
          if (parent && parent.closest('.web-annotator-highlight')) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node;
    while (node = walker.nextNode()) {
      const index = node.textContent.indexOf(searchText);
      if (index !== -1) {
        try {
          const range = document.createRange();
          range.setStart(node, index);
          range.setEnd(node, index + searchText.length);
          applyHighlight(range, hl.id, hl.color);
          console.log(`[Web Annotator] Highlight restored via text search (full match)`);
          return;
        } catch (e) {
          console.warn('Highlight apply failed:', e);
        }
      }
    }

    // 方法2: 正規化されたテキストで検索（空白を正規化）
    const normalizedSearch = searchText.replace(/\s+/g, ' ');
    const walker2 = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
          const parent = node.parentElement;
          if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent && parent.closest('.web-annotator-highlight')) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    while (node = walker2.nextNode()) {
      const normalizedContent = node.textContent.replace(/\s+/g, ' ');
      const index = normalizedContent.indexOf(normalizedSearch);
      if (index !== -1) {
        try {
          const range = document.createRange();
          // オリジナルのテキストノードで対応する位置を見つける
          let originalIndex = findOriginalIndex(node.textContent, index);
          let originalEndIndex = findOriginalIndex(node.textContent, index + normalizedSearch.length);
          range.setStart(node, originalIndex);
          range.setEnd(node, Math.min(originalEndIndex, node.textContent.length));
          applyHighlight(range, hl.id, hl.color);
          console.log(`[Web Annotator] Highlight restored via normalized text search`);
          return;
        } catch (e) {
          console.warn('Highlight apply (normalized) failed:', e);
        }
      }
    }

    // 方法3: 短いテキスト（最初の30文字）で部分検索
    const shortText = searchText.substring(0, 30);
    const walker3 = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );

    while (node = walker3.nextNode()) {
      const parent = node.parentElement;
      if (parent && parent.closest('.web-annotator-highlight')) continue;

      const index = node.textContent.indexOf(shortText);
      if (index !== -1) {
        try {
          const range = document.createRange();
          const endIndex = Math.min(index + searchText.length, node.textContent.length);
          range.setStart(node, index);
          range.setEnd(node, endIndex);
          applyHighlight(range, hl.id, hl.color);
          console.log(`[Web Annotator] Highlight restored via short text search`);
          return;
        } catch (e) {
          console.warn('Highlight apply (short) failed:', e);
        }
      }
    }

    console.log(`[Web Annotator] Could not find text to highlight: "${searchText.substring(0, 50)}..."`);
  }

  // 正規化されたインデックスをオリジナルのインデックスに変換
  function findOriginalIndex(original, normalizedIndex) {
    let originalIdx = 0;
    let normalizedIdx = 0;
    let inWhitespace = false;

    while (normalizedIdx < normalizedIndex && originalIdx < original.length) {
      if (/\s/.test(original[originalIdx])) {
        if (!inWhitespace) {
          normalizedIdx++;
          inWhitespace = true;
        }
      } else {
        normalizedIdx++;
        inWhitespace = false;
      }
      originalIdx++;
    }

    return originalIdx;
  }

  function removeHighlight(highlightId) {
    // 複数パーツの場合もすべて削除
    const elements = document.querySelectorAll(`[data-highlight-id="${highlightId}"]`);
    elements.forEach(element => {
      const parent = element.parentNode;
      while (element.firstChild) {
        parent.insertBefore(element.firstChild, element);
      }
      parent.removeChild(element);
      parent.normalize();
    });

    highlights = highlights.filter(h => h.id !== highlightId);
    saveData();
  }

  // ============================================
  // 付箋機能
  // ============================================

  function createStickyNoteId() {
    return 'sn-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  function createStickyNote(x, y, content = '', id = null) {
    const noteId = id || createStickyNoteId();

    const note = document.createElement('div');
    note.className = 'web-annotator-sticky-note';
    note.dataset.noteId = noteId;
    note.style.left = x + 'px';
    note.style.top = y + 'px';

    const stickyTitle = chrome.i18n.getMessage('stickyNoteTitle') || 'Note';
    const stickyPlaceholder = chrome.i18n.getMessage('stickyNotePlaceholder') || 'Write a note...';
    const deleteTitle = chrome.i18n.getMessage('delete') || 'Delete';

    note.innerHTML = `
      <div class="web-annotator-sticky-header">
        <span class="web-annotator-sticky-title">${stickyTitle}</span>
        <button class="web-annotator-sticky-delete" title="${deleteTitle}">&times;</button>
      </div>
      <textarea class="web-annotator-sticky-content" placeholder="${stickyPlaceholder}">${content}</textarea>
    `;

    document.body.appendChild(note);

    // ドラッグ機能
    makeDraggable(note);

    // 削除ボタン
    note.querySelector('.web-annotator-sticky-delete').addEventListener('click', () => {
      removeStickyNote(noteId);
    });

    // 内容変更時に保存
    const textarea = note.querySelector('.web-annotator-sticky-content');
    textarea.addEventListener('input', () => {
      updateStickyNoteContent(noteId, textarea.value);
    });

    // 新規作成時のみデータを追加
    if (!id) {
      const noteData = {
        id: noteId,
        x: x,
        y: y,
        content: content,
        createdAt: Date.now()
      };
      stickyNotes.push(noteData);
      saveData();
    }

    return note;
  }

  function makeDraggable(element) {
    const header = element.querySelector('.web-annotator-sticky-header');
    let isDragging = false;
    let startX, startY, initialX, initialY;

    header.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('web-annotator-sticky-delete')) return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialX = element.offsetLeft;
      initialY = element.offsetTop;

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e) {
      if (!isDragging) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      element.style.left = (initialX + dx) + 'px';
      element.style.top = (initialY + dy) + 'px';
    }

    function onMouseUp() {
      if (!isDragging) return;

      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      // 位置を保存
      const noteId = element.dataset.noteId;
      updateStickyNotePosition(noteId, element.offsetLeft, element.offsetTop);
    }
  }

  function renderStickyNotes() {
    stickyNotes.forEach((note) => {
      const existing = document.querySelector(`[data-note-id="${note.id}"]`);
      if (!existing) {
        createStickyNote(note.x, note.y, note.content, note.id);
      }
    });
  }

  function removeStickyNote(noteId) {
    const element = document.querySelector(`[data-note-id="${noteId}"]`);
    if (element) {
      element.remove();
    }

    stickyNotes = stickyNotes.filter(n => n.id !== noteId);
    saveData();
  }

  function updateStickyNoteContent(noteId, content) {
    const note = stickyNotes.find(n => n.id === noteId);
    if (note) {
      note.content = content;
      saveData();
    }
  }

  function updateStickyNotePosition(noteId, x, y) {
    const note = stickyNotes.find(n => n.id === noteId);
    if (note) {
      note.x = x;
      note.y = y;
      saveData();
    }
  }

  // ============================================
  // XPath ユーティリティ
  // ============================================

  function getXPathForNode(node) {
    // テキストノードの場合、テキストノードインデックスも含めたXPathを生成
    let textNodeIndex = -1;
    if (node.nodeType === Node.TEXT_NODE) {
      const parent = node.parentNode;
      let index = 0;
      for (const child of parent.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          if (child === node) {
            textNodeIndex = index;
            break;
          }
          index++;
        }
      }
      node = parent;
    }

    const parts = [];
    while (node && node.nodeType === Node.ELEMENT_NODE) {
      let index = 1;
      let sibling = node.previousSibling;
      while (sibling) {
        if (sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === node.tagName) {
          index++;
        }
        sibling = sibling.previousSibling;
      }
      parts.unshift(`${node.tagName.toLowerCase()}[${index}]`);
      node = node.parentNode;
    }

    let xpath = '/' + parts.join('/');
    // テキストノードインデックスを付加
    if (textNodeIndex >= 0) {
      xpath += `/text()[${textNodeIndex + 1}]`;
    }
    return xpath;
  }

  function getNodeByXPath(xpath) {
    try {
      const result = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      const node = result.singleNodeValue;
      if (node) {
        // テキストノードならそのまま、要素ノードなら最初のテキストノードを探す
        if (node.nodeType === Node.TEXT_NODE) {
          return node;
        }
        // 要素の場合、テキストノードを探す
        for (const child of node.childNodes) {
          if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
            return child;
          }
        }
        return node.firstChild || node;
      }
    } catch (e) {
      console.error('XPath evaluation error:', e);
    }
    return null;
  }

  // ============================================
  // フローティングツールバー（選択時に表示）
  // ============================================

  function createFloatingToolbar() {
    // 既存のツールバーを削除
    const existing = document.getElementById('web-annotator-toolbar');
    if (existing) existing.remove();

    const toolbar = document.createElement('div');
    toolbar.id = 'web-annotator-toolbar';
    toolbar.className = 'web-annotator-toolbar';
    toolbar.style.display = 'none';

    toolbar.innerHTML = `
      <button class="web-annotator-toolbar-btn" data-action="highlight" title="ハイライト (Ctrl+Shift+H)">
        ${ICONS.highlight}
      </button>
      <button class="web-annotator-toolbar-btn" data-action="sticky" title="付箋を追加 (Alt+ダブルクリック)">
        ${ICONS.note}
      </button>
      <div class="web-annotator-toolbar-divider"></div>
      ${HIGHLIGHT_COLORS.map((color, i) => `
        <button class="web-annotator-toolbar-color ${i === currentColorIndex ? 'active' : ''}"
             data-color-index="${i}"
             style="background-color: ${color}"
             title="色を変更"></button>
      `).join('')}
    `;

    document.body.appendChild(toolbar);

    // ボタンのクリックイベント
    toolbar.querySelectorAll('.web-annotator-toolbar-btn').forEach(btn => {
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault(); // 選択解除を防止
        e.stopPropagation();

        const action = btn.dataset.action;
        if (action === 'highlight') {
          highlightSelection();
        } else if (action === 'sticky') {
          const rect = toolbar.getBoundingClientRect();
          createStickyNote(rect.left + window.scrollX, rect.bottom + window.scrollY + 10);
          hideFloatingToolbar();
        }
      });
    });

    // カラー選択
    toolbar.querySelectorAll('.web-annotator-toolbar-color').forEach(option => {
      option.addEventListener('mousedown', (e) => {
        e.preventDefault(); // 選択解除を防止
        e.stopPropagation();
        currentColorIndex = parseInt(option.dataset.colorIndex);
        toolbar.querySelectorAll('.web-annotator-toolbar-color').forEach(o => o.classList.remove('active'));
        option.classList.add('active');
      });
    });
  }

  function showFloatingToolbar(x, y) {
    const toolbar = document.getElementById('web-annotator-toolbar');
    if (toolbar) {
      // 画面外に出ないように調整
      const toolbarWidth = 260;
      const toolbarHeight = 54;

      let posX = x;
      let posY = y - toolbarHeight - 12; // 選択の上に表示

      // 右端チェック
      if (posX + toolbarWidth > window.innerWidth + window.scrollX) {
        posX = window.innerWidth + window.scrollX - toolbarWidth - 10;
      }

      // 左端チェック
      if (posX < window.scrollX + 10) {
        posX = window.scrollX + 10;
      }

      // 上端チェック（選択の下に表示）
      if (posY < window.scrollY) {
        posY = y + 30;
      }

      toolbar.style.left = posX + 'px';
      toolbar.style.top = posY + 'px';
      toolbar.style.display = 'flex';
    }
  }

  function hideFloatingToolbar() {
    const toolbar = document.getElementById('web-annotator-toolbar');
    if (toolbar) {
      toolbar.style.display = 'none';
    }
  }

  // ============================================
  // イベントリスナー
  // ============================================

  function setupEventListeners() {
    // テキスト選択時にツールバーを表示
    document.addEventListener('mouseup', (e) => {
      // ツールバー内のクリックは無視
      const toolbar = document.getElementById('web-annotator-toolbar');
      if (toolbar && toolbar.contains(e.target)) {
        return;
      }

      // 付箋内のクリックは無視
      if (e.target.closest('.web-annotator-sticky-note')) {
        return;
      }

      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed && selection.toString().trim()) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          showFloatingToolbar(
            rect.left + window.scrollX,
            rect.top + window.scrollY
          );
        } else {
          hideFloatingToolbar();
        }
      }, 10);
    });

    // クリックでツールバー非表示（選択解除時）
    document.addEventListener('mousedown', (e) => {
      const toolbar = document.getElementById('web-annotator-toolbar');
      if (toolbar && !toolbar.contains(e.target)) {
        // 少し遅延させて、選択操作と区別
        setTimeout(() => {
          const selection = window.getSelection();
          if (!selection || selection.isCollapsed) {
            hideFloatingToolbar();
          }
        }, 10);
      }
    });

    // ダブルクリックで付箋追加
    document.addEventListener('dblclick', (e) => {
      if (e.altKey) {
        createStickyNote(e.pageX, e.pageY);
      }
    });

    // キーボードショートカット
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + Shift + H でハイライト
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'H' || e.key === 'h')) {
        e.preventDefault();
        highlightSelection();
      }

      // Ctrl/Cmd + Shift + N で付箋追加（マウス位置または画面中央）
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'N' || e.key === 'n')) {
        e.preventDefault();
        createStickyNote(
          window.scrollX + window.innerWidth / 2 - 100,
          window.scrollY + window.innerHeight / 2 - 60
        );
      }

      // Escでツールバー非表示
      if (e.key === 'Escape') {
        hideFloatingToolbar();
      }
    });

    // メッセージリスナー（ポップアップからの通信）
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'getAnnotations') {
        sendResponse({
          highlights: highlights,
          stickyNotes: stickyNotes,
          title: document.title,
          url: pageUrl
        });
      } else if (request.action === 'removeHighlight') {
        removeHighlight(request.highlightId);
        sendResponse({ success: true });
      } else if (request.action === 'removeStickyNote') {
        removeStickyNote(request.noteId);
        sendResponse({ success: true });
      } else if (request.action === 'scrollToHighlight') {
        const element = document.querySelector(`[data-highlight-id="${request.highlightId}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // 一時的にフラッシュ効果
          element.style.animation = 'web-annotator-flash 1s';
          setTimeout(() => {
            element.style.animation = '';
          }, 1000);
        }
        sendResponse({ success: true });
      } else if (request.action === 'highlightSelection') {
        // ポップアップからのハイライト指示
        highlightSelection();
        sendResponse({ success: true });
      }
      return true;
    });
  }

  // 初期化実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
