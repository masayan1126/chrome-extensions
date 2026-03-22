import type { ReviewComment } from '../../shared/types';

/**
 * HTML文字列にレビューコメントハイライトを注入する
 * テキスト+prefix/suffix によるコンテキストマッチでコメント位置を再特定
 */
export const applyCommentHighlight = (
  html: string,
  comments: ReviewComment[]
): string => {
  if (!comments.length) return html;

  const unresolvedComments = comments.filter((c) => !c.resolved);
  if (!unresolvedComments.length) return html;

  let result = html;

  for (const comment of unresolvedComments) {
    const typeColorClass = getTypeColorClass(comment.type);
    const wrapTag = (match: string) =>
      `<mark class="review-highlight ${typeColorClass}" data-comment-id="${comment.id}">${match}</mark>`;

    // 改行・連続空白を正規化
    const normalizedText = comment.anchor.selectedText
      .replace(/\s+/g, ' ')
      .trim();

    // 戦略1: 完全一致（HTMLタグ内をスキップ）
    const escapedFull = escapeRegex(normalizedText);
    const fullRegex = new RegExp(`(?![^<]*>)(${escapedFull})`, 'g');
    let matched = false;
    const attempt1 = result.replace(fullRegex, (m) => {
      if (matched) return m;
      matched = true;
      return wrapTag(m);
    });

    if (matched) {
      result = attempt1;
      continue;
    }

    // 戦略2: 先頭30文字でマッチ（テキストがHTMLタグで分断される場合のフォールバック）
    const shortText = normalizedText.length > 30
      ? normalizedText.substring(0, 30)
      : normalizedText;
    const escapedShort = escapeRegex(shortText);
    const shortRegex = new RegExp(`(?![^<]*>)(${escapedShort})`, 'g');
    matched = false;
    const attempt2 = result.replace(shortRegex, (m) => {
      if (matched) return m;
      matched = true;
      return wrapTag(m);
    });

    if (matched) {
      result = attempt2;
    }
  }

  return result;
};

const escapeRegex = (s: string): string =>
  s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getTypeColorClass = (type: ReviewComment['type']): string => {
  switch (type) {
    case 'modify': return 'review-highlight-modify';
    case 'delete': return 'review-highlight-delete';
  }
};
