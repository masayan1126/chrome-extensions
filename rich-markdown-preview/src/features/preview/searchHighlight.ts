export const contentWidthMap = {
  narrow: 'max-w-2xl',
  medium: 'max-w-4xl',
  wide: 'max-w-6xl',
  full: 'max-w-none',
};

// HTML文字列にハイライトを適用する関数
export const applySearchHighlight = (
  html: string,
  query: string,
  currentIndex: number
): { html: string; matchCount: number } => {
  if (!query) return { html, matchCount: 0 };

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // HTMLタグ内の文字をマッチしないようにする（負の先読みを使用）
  const regex = new RegExp(`(?![^<]*>)(${escapedQuery})`, 'gi');

  let matchCount = 0;
  const highlightedHtml = html.replace(regex, (match) => {
    const isActive = matchCount === currentIndex;
    const result = `<mark class="search-highlight${isActive ? ' search-highlight-active' : ''}" data-match-index="${matchCount}">${match}</mark>`;
    matchCount++;
    return result;
  });

  return { html: highlightedHtml, matchCount };
};
