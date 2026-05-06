// Web Annotator - Popup Script
// ポップアップUIの制御

document.addEventListener('DOMContentLoaded', init);

let currentTab = null;
let annotations = {
  highlights: [],
  stickyNotes: [],
  title: '',
  url: ''
};

// i18n helper function
function i18n(key, substitutions) {
  return chrome.i18n.getMessage(key, substitutions) || key;
}

// Apply i18n to all elements with data-i18n attribute
function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const message = i18n(key);
    if (message) {
      el.textContent = message;
    }
  });
  // textarea などプレースホルダ専用
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const message = i18n(key);
    if (message) el.setAttribute('placeholder', message);
  });
}

// 入力テキストを抽出する（箇条書き / カンマ区切り / 改行区切りの3パターン対応）
// 注意: popup と content script は別 context のため module 共有不可。
// content.js の parseMarkdownList と同じ実装を保つこと（片方修正時は両方修正）。
function parseMarkdownList(text) {
  if (!text || typeof text !== 'string') return [];
  const lines = text.split(/\r?\n/);
  const results = [];
  let inCodeBlock = false;

  for (const rawLine of lines) {
    if (/^\s*```/.test(rawLine)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    let line = rawLine.trim();
    if (!line) continue;
    if (/^#{1,6}\s/.test(line)) continue;

    const listMatch = line.match(/^(?:[-*+]|\d+[.)])\s+(.+)$/);
    if (listMatch) line = listMatch[1].trim();

    line = line.replace(/^\[[ xX]\]\s+/, '').trim();
    if (!line) continue;

    if (/[,、]/.test(line)) {
      line.split(/[,、]/).forEach(part => {
        const t = part.trim();
        if (t) results.push(t);
      });
    } else {
      results.push(line);
    }
  }

  return results;
}

async function init() {
  // Apply i18n translations
  applyI18n();

  // 現在のタブを取得
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  // ページタイトルを表示
  document.getElementById('pageTitle').textContent = tab.title || tab.url;

  // アノテーションを取得
  await loadAnnotations();

  // イベントリスナーを設定
  setupEventListeners();
}

async function loadAnnotations() {
  // 特殊なページかチェック
  if (currentTab.url.startsWith('chrome://') ||
      currentTab.url.startsWith('chrome-extension://') ||
      currentTab.url.startsWith('about:')) {
    document.getElementById('highlightList').innerHTML =
      `<p class="empty-message">${i18n('notAvailable')}</p>`;
    document.getElementById('stickyList').innerHTML =
      `<p class="empty-message">${i18n('notAvailable')}</p>`;
    document.getElementById('exportBtn').disabled = true;
    return;
  }

  try {
    const response = await chrome.tabs.sendMessage(currentTab.id, { action: 'getAnnotations' });
    if (response) {
      annotations = response;
      renderHighlights();
      renderStickyNotes();
      updateCounts();
    }
  } catch (error) {
    console.error('Failed to load annotations:', error);
    document.getElementById('highlightList').innerHTML =
      `<p class="empty-message">${i18n('pleaseReload')}<br><small>${i18n('reloadNote')}</small></p>`;
    document.getElementById('stickyList').innerHTML =
      `<p class="empty-message">${i18n('pleaseReload')}</p>`;
  }
}

function renderHighlights() {
  const container = document.getElementById('highlightList');

  if (!annotations.highlights || annotations.highlights.length === 0) {
    container.innerHTML = `<p class="empty-message">${i18n('noHighlights')}</p>`;
    return;
  }

  container.innerHTML = annotations.highlights.map((hl, index) => `
    <div class="list-item" data-highlight-id="${hl.id}">
      <div class="list-item-header">
        <div class="color-indicator" style="background-color: ${hl.color}"></div>
        <span class="list-item-index">#${index + 1}</span>
      </div>
      <div class="list-item-text">${escapeHtml(hl.text)}</div>
      <div class="list-item-actions">
        <button class="action-btn scroll" data-action="scroll" data-id="${hl.id}">
          ${i18n('goTo')}
        </button>
        <button class="action-btn delete" data-action="delete-highlight" data-id="${hl.id}">
          ${i18n('delete')}
        </button>
      </div>
    </div>
  `).join('');
}

function renderStickyNotes() {
  const container = document.getElementById('stickyList');

  if (!annotations.stickyNotes || annotations.stickyNotes.length === 0) {
    container.innerHTML = `<p class="empty-message">${i18n('noNotes')}</p>`;
    return;
  }

  container.innerHTML = annotations.stickyNotes.map((note, index) => `
    <div class="list-item" data-note-id="${note.id}">
      <div class="list-item-header">
        <div class="color-indicator" style="background-color: #1e1e1e; border: 1px solid rgba(255,255,255,0.2);"></div>
        <span class="list-item-index">#${index + 1}</span>
      </div>
      <div class="list-item-text">${escapeHtml(note.content) || i18n('emptyNote')}</div>
      <div class="list-item-actions">
        <button class="action-btn delete" data-action="delete-sticky" data-id="${note.id}">
          ${i18n('delete')}
        </button>
      </div>
    </div>
  `).join('');
}

function updateCounts() {
  document.getElementById('highlightCount').textContent =
    annotations.highlights ? annotations.highlights.length : 0;
  document.getElementById('stickyCount').textContent =
    annotations.stickyNotes ? annotations.stickyNotes.length : 0;
}

function setupEventListeners() {
  // タブ切り替え
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      switchTab(tabName);
    });
  });

  // リスト内のアクションボタン
  document.getElementById('highlightList').addEventListener('click', handleListAction);
  document.getElementById('stickyList').addEventListener('click', handleListAction);

  // エクスポートボタン
  document.getElementById('exportBtn').addEventListener('click', exportAsMarkdown);

  // 全削除ボタン
  document.getElementById('clearBtn').addEventListener('click', clearAllAnnotations);

  // インポート関連
  setupImportListeners();
}

function setupImportListeners() {
  const fileBtn = document.getElementById('importFileBtn');
  const fileInput = document.getElementById('importFile');
  const runBtn = document.getElementById('importRunBtn');
  const textarea = document.getElementById('importTextarea');
  const colorRow = document.getElementById('importColorRow');
  const modeRadios = document.querySelectorAll('input[name="importMode"]');

  if (!fileBtn || !runBtn || !textarea) return;

  // ファイル選択 → textarea へ流し込み
  fileBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      textarea.value = String(reader.result || '');
    };
    reader.onerror = () => {
      console.error('[Web Annotator] File read failed', reader.error);
      const detail = reader.error ? `: ${reader.error.name}` : '';
      showToast((i18n('importFileReadFailed') || 'File read failed') + detail);
    };
    reader.readAsText(file, 'utf-8');
    fileInput.value = ''; // 同じファイルを再選択できるようにリセット
  });

  // モード切り替え（sticky の場合は色選択を非表示）
  const updateColorVisibility = () => {
    const mode = document.querySelector('input[name="importMode"]:checked').value;
    colorRow.style.display = mode === 'highlight' ? '' : 'none';
  };
  modeRadios.forEach(r => r.addEventListener('change', updateColorVisibility));
  updateColorVisibility();

  // 色選択
  colorRow.querySelectorAll('.import-color-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      colorRow.querySelectorAll('.import-color-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
    });
  });

  // 実行
  runBtn.addEventListener('click', runImport);
}

async function runImport() {
  const textarea = document.getElementById('importTextarea');
  const colorRow = document.getElementById('importColorRow');

  const raw = textarea.value;
  const texts = parseMarkdownList(raw);

  if (texts.length === 0) {
    showToast(i18n('importNoText') || 'No list items found');
    return;
  }

  const mode = document.querySelector('input[name="importMode"]:checked').value;
  const activeSwatch = colorRow.querySelector('.import-color-swatch.active');
  const color = activeSwatch ? activeSwatch.dataset.color : '#fef08a';

  // chrome:// などはスキップ
  if (currentTab.url.startsWith('chrome://') ||
      currentTab.url.startsWith('chrome-extension://') ||
      currentTab.url.startsWith('about:')) {
    showToast(i18n('notAvailable'));
    return;
  }

  try {
    const response = await chrome.tabs.sendMessage(currentTab.id, {
      action: 'importTexts',
      texts,
      mode,
      color
    });

    if (!response || response.success === false) {
      const errMsg = response && response.error ? `: ${response.error}` : '';
      showToast((i18n('importFailed') || 'Import failed') + errMsg);
      return;
    }

    const failed = response.failed || 0;
    let msg = i18n('importResult', [String(response.found), String(response.added)]) ||
      `Found ${response.found} / Added ${response.added}`;
    if (failed > 0) {
      const failedSuffix = i18n('importPartialFailure', [String(failed)]) || ` (${failed} failed)`;
      msg += failedSuffix;
    }
    showToast(msg);

    await loadAnnotations();
  } catch (e) {
    // sendMessage 失敗の典型ケース: content script 未注入 / tab 消失 / content 内例外の rethrow
    console.error('[Web Annotator] Import failed:', e);
    const detail = e && e.message ? `: ${e.message}` : '';
    showToast((i18n('importFailed') || 'Import failed') + detail);
  }
}

function switchTab(tabName) {
  // タブボタンの状態を更新
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // タブコンテンツの表示を更新
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `${tabName}-tab`);
  });
}

async function handleListAction(e) {
  const button = e.target.closest('.action-btn');
  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;

  switch (action) {
    case 'scroll':
      await chrome.tabs.sendMessage(currentTab.id, {
        action: 'scrollToHighlight',
        highlightId: id
      });
      break;

    case 'delete-highlight':
      if (confirm(i18n('confirmDeleteHighlight'))) {
        await chrome.tabs.sendMessage(currentTab.id, {
          action: 'removeHighlight',
          highlightId: id
        });
        await loadAnnotations();
        showToast(i18n('highlightDeleted'));
      }
      break;

    case 'delete-sticky':
      if (confirm(i18n('confirmDeleteNote'))) {
        await chrome.tabs.sendMessage(currentTab.id, {
          action: 'removeStickyNote',
          noteId: id
        });
        await loadAnnotations();
        showToast(i18n('noteDeleted'));
      }
      break;
  }
}

function exportAsMarkdown() {
  if (!annotations.highlights || annotations.highlights.length === 0) {
    showToast(i18n('noHighlightsToExport'));
    return;
  }

  const title = sanitizeFilename(annotations.title || 'Untitled');
  let markdown = `# ${annotations.title || 'Untitled'}\n\n`;
  markdown += `URL: ${annotations.url}\n\n`;
  markdown += `Export Date: ${new Date().toLocaleString()}\n\n`;
  markdown += `---\n\n`;
  markdown += `## Highlights\n\n`;

  annotations.highlights.forEach((hl, index) => {
    markdown += `${index + 1}. ${hl.text}\n`;
  });

  if (annotations.stickyNotes && annotations.stickyNotes.length > 0) {
    markdown += `\n## Notes\n\n`;
    annotations.stickyNotes.forEach((note, index) => {
      if (note.content) {
        markdown += `${index + 1}. ${note.content}\n`;
      }
    });
  }

  // ダウンロード
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title}.md`;
  a.click();
  URL.revokeObjectURL(url);

  showToast(i18n('markdownDownloaded'));
}

async function clearAllAnnotations() {
  const highlightCount = annotations.highlights ? annotations.highlights.length : 0;
  const stickyCount = annotations.stickyNotes ? annotations.stickyNotes.length : 0;

  if (highlightCount === 0 && stickyCount === 0) {
    showToast(i18n('noAnnotationsToDelete'));
    return;
  }

  if (!confirm(i18n('confirmClearAll', [String(highlightCount), String(stickyCount)]))) {
    return;
  }

  // バックグラウンドスクリプトに削除を依頼
  await chrome.runtime.sendMessage({
    action: 'clearPageAnnotations',
    url: annotations.url
  });

  // ページをリロード
  await chrome.tabs.reload(currentTab.id);

  showToast(i18n('allAnnotationsDeleted'));

  // ポップアップを閉じる
  setTimeout(() => window.close(), 1000);
}

// ユーティリティ関数
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function sanitizeFilename(name) {
  return name.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100);
}

function showToast(message) {
  // 既存のトーストを削除
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 2500);
}
