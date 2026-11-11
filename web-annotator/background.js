// Web Annotator - Background Service Worker
// バックグラウンド処理を管理

// ドメイン単位アノテーション集計の純粋関数を読み込む (issue #24)。
// MV3 の classic service worker なので importScripts が使える。
importScripts('lib/domainAnnotations.js');

// 拡張機能インストール時の処理
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Web Annotator installed');
  } else if (details.reason === 'update') {
    console.log('Web Annotator updated');
  }
});

// ストレージのクリーンアップ（古いデータの削除）
async function cleanupOldData() {
  const MAX_AGE_DAYS = 90; // 90日以上古いデータを削除
  const maxAge = Date.now() - (MAX_AGE_DAYS * 24 * 60 * 60 * 1000);

  chrome.storage.local.get(null, (data) => {
    const keysToRemove = [];

    for (const [url, pageData] of Object.entries(data)) {
      if (pageData && pageData.lastModified && pageData.lastModified < maxAge) {
        // ハイライトと付箋が両方空の場合のみ削除
        if ((!pageData.highlights || pageData.highlights.length === 0) &&
            (!pageData.stickyNotes || pageData.stickyNotes.length === 0)) {
          keysToRemove.push(url);
        }
      }
    }

    if (keysToRemove.length > 0) {
      chrome.storage.local.remove(keysToRemove, () => {
        console.log(`Cleaned up ${keysToRemove.length} old entries`);
      });
    }
  });
}

// 定期的なクリーンアップ（1日ごと）
chrome.alarms.create('cleanup', { periodInMinutes: 1440 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanup') {
    cleanupOldData();
  }
});

// 全ページのアノテーション数を取得するAPI
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getAllAnnotations') {
    chrome.storage.local.get(null, (data) => {
      const annotations = buildAnnotationList(data);
      // 最終更新日時でソート
      annotations.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));
      sendResponse({ annotations: annotations });
    });
    return true; // 非同期レスポンスを示す
  }

  // 同じ hostname の「他ページ」のアノテーション集計を返す (issue #24)。
  // request.currentUrl は content.js と同じく `#` 以下を除去した URL を渡すこと。
  if (request.action === 'getDomainAnnotations') {
    chrome.storage.local.get(null, (data) => {
      const pages = filterDomainAnnotations(buildAnnotationList(data), request.currentUrl);
      sendResponse({ hostname: getHostname(request.currentUrl), pages });
    });
    return true; // 非同期レスポンスを示す
  }

  if (request.action === 'exportAllAsMarkdown') {
    chrome.storage.local.get(null, (data) => {
      let markdown = '# Web Annotator - All Annotations\n\n';
      markdown += `Export Date: ${new Date().toLocaleString()}\n\n`;
      markdown += '---\n\n';

      for (const [url, pageData] of Object.entries(data)) {
        if (pageData && pageData.highlights && pageData.highlights.length > 0) {
          markdown += `## ${pageData.title || 'Untitled'}\n\n`;
          markdown += `URL: ${url}\n\n`;

          markdown += '### Highlights\n\n';
          pageData.highlights.forEach((hl, index) => {
            markdown += `${index + 1}. ${hl.text}\n`;
          });
          markdown += '\n';

          if (pageData.stickyNotes && pageData.stickyNotes.length > 0) {
            markdown += '### Sticky Notes\n\n';
            pageData.stickyNotes.forEach((note, index) => {
              if (note.content) {
                markdown += `${index + 1}. ${note.content}\n`;
              }
            });
            markdown += '\n';
          }

          markdown += '---\n\n';
        }
      }

      sendResponse({ markdown: markdown });
    });
    return true;
  }

  if (request.action === 'clearPageAnnotations') {
    chrome.storage.local.remove(request.url, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});
