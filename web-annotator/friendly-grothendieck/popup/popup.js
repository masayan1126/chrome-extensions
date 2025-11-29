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
