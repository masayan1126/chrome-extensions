// ドメイン単位（hostname）でのアノテーション集計ロジック (issue #24)。
//
// chrome API に依存しない純粋関数のみを置く。
// - background.js からは service worker 起動時に `importScripts('lib/domainAnnotations.js')`
//   で読み込み、グローバル関数として利用する（MV3 の classic service worker）。
// - Node からは末尾の module.exports 経由で require し、lib/domainAnnotations.test.cjs で検証する。
//
// 設計方針 (issue #24):
//   現在ページにアノテーションが無くても、同じ hostname の「他ページ」に付箋/マーカーが
//   存在することに気づけるようにする。「同じドメイン」の判定粒度は hostname 単位
//   （news.example.com と blog.example.com は別、www 有無も別、http/https は同一扱い）。

// URL 文字列から hostname を抽出する。無効な URL は null を返す。
function getHostname(url) {
  try {
    return new URL(url).hostname || null;
  } catch (e) {
    return null;
  }
}

// chrome.storage.local 全体のオブジェクトを、ページ単位の集計配列へ変換する。
// background.js の getAllAnnotations と共通のロジック。
function buildAnnotationList(data) {
  const annotations = [];
  for (const [url, pageData] of Object.entries(data || {})) {
    if (pageData && (pageData.highlights || pageData.stickyNotes)) {
      annotations.push({
        url,
        title: pageData.title || url,
        highlightCount: (pageData.highlights || []).length,
        stickyNoteCount: (pageData.stickyNotes || []).length,
        lastModified: pageData.lastModified
      });
    }
  }
  return annotations;
}

// buildAnnotationList の結果から、currentUrl と同じ hostname の「他ページ」だけを抽出する。
// - currentUrl 自身は除外（完全一致。呼び出し側は content.js と同じく `#` 以下を除去した URL を渡すこと）
// - 実際にアノテーションが 1 件以上あるページのみ（空ページは除外）
// - lastModified 降順（新しい順）でソート
function filterDomainAnnotations(list, currentUrl) {
  const targetHost = getHostname(currentUrl);
  if (!targetHost) return [];
  return (list || [])
    .filter(a =>
      a.url !== currentUrl &&
      getHostname(a.url) === targetHost &&
      ((a.highlightCount || 0) > 0 || (a.stickyNoteCount || 0) > 0)
    )
    .sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));
}

// Node からのテスト用 export（ブラウザ / service worker では module が undefined のため no-op）。
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getHostname, buildAnnotationList, filterDomainAnnotations };
}
