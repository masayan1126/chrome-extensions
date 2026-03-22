import { useEffect } from 'react';
import type { ReviewComment } from '../../shared/types';

const HIGHLIGHT_ATTR = 'data-comment-id';

const typeClassMap: Record<ReviewComment['type'], string> = {
  modify: 'review-highlight review-highlight-modify',
  delete: 'review-highlight review-highlight-delete',
};

/**
 * DOM操作ベースのコメントハイライトフック
 *
 * useEffect のみでハイライトを適用する。
 * - comments が変わったとき（追加・削除・解決）
 * - renderedHtml が変わったとき（コンテンツ変更・検索ハイライト変更）
 * にのみ再適用する。MutationObserver・setInterval は使わない。
 */
export const useCommentHighlight = (
  containerRef: React.RefObject<HTMLDivElement | null>,
  comments: ReviewComment[],
  renderedHtml: string,
) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const unresolvedComments = comments.filter((c) => !c.resolved);

    // DOM更新直後に適用（useEffect は React の DOM commit 後に実行される）
    clearHighlights(container);
    for (const comment of unresolvedComments) {
      applyHighlight(container, comment);
    }

  }, [containerRef, comments, renderedHtml]);
};

/** 既存のコメントハイライトを除去し、テキストノードを正規化 */
const clearHighlights = (container: HTMLElement) => {
  const marks = container.querySelectorAll(`mark[${HIGHLIGHT_ATTR}]`);
  marks.forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) {
      parent.insertBefore(mark.firstChild, mark);
    }
    parent.removeChild(mark);
    parent.normalize();
  });
};

/** 1つのコメントに対してDOM上でハイライトを適用 */
const applyHighlight = (container: HTMLElement, comment: ReviewComment) => {
  const searchText = comment.anchor.selectedText.replace(/\s+/g, ' ').trim();
  if (!searchText) return;

  // テキストノードを収集して連結テキストを構築
  const textEntries: { node: Text; globalStart: number }[] = [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let fullText = '';
  let current: Node | null;

  while ((current = walker.nextNode())) {
    textEntries.push({ node: current as Text, globalStart: fullText.length });
    fullText += current.textContent || '';
  }

  // マッチ位置を検索
  let matchIdx = fullText.indexOf(searchText);
  let matchLen = searchText.length;

  if (matchIdx < 0) {
    const shortText = searchText.substring(0, Math.min(40, searchText.length));
    matchIdx = fullText.indexOf(shortText);
    matchLen = shortText.length;
    if (matchIdx < 0) return;
  }

  const matchEnd = matchIdx + matchLen;

  // 影響するテキストノードを特定
  const toWrap: { node: Text; localStart: number; localEnd: number }[] = [];
  for (const entry of textEntries) {
    const nodeLen = entry.node.data.length;
    const nodeEnd = entry.globalStart + nodeLen;

    if (entry.globalStart >= matchEnd || nodeEnd <= matchIdx) continue;

    toWrap.push({
      node: entry.node,
      localStart: Math.max(0, matchIdx - entry.globalStart),
      localEnd: Math.min(nodeLen, matchEnd - entry.globalStart),
    });
  }

  if (toWrap.length === 0) return;

  const className = typeClassMap[comment.type];

  for (let i = toWrap.length - 1; i >= 0; i--) {
    const { node, localStart, localEnd } = toWrap[i];

    try {
      let targetNode: Text = node;

      if (localEnd < node.data.length) {
        node.splitText(localEnd);
      }
      if (localStart > 0) {
        targetNode = node.splitText(localStart);
      }

      const mark = document.createElement('mark');
      mark.className = className;
      mark.setAttribute(HIGHLIGHT_ATTR, comment.id);
      targetNode.parentNode?.insertBefore(mark, targetNode);
      mark.appendChild(targetNode);
    } catch (e) {
      console.error('[CommentHighlight] Failed to highlight:', e);
    }
  }
};
