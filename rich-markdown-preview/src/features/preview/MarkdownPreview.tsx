import React, { useMemo, useEffect, useRef, useCallback, useState } from 'react';
import type { Theme, TOCItem, FontFamily, ReviewComment, CommentAnchor } from '../../shared/types';
import { parseMarkdown, renderMermaidDiagrams } from '../../shared/utils/markdown';
import { applySearchHighlight, contentWidthMap } from './searchHighlight';
import { useCommentHighlight } from '../review/useCommentHighlight';
import { useHeadingObserver } from './useHeadingObserver';
import { useThemeStyle } from './useThemeStyle';
import { CommentForm } from '../review/CommentForm';
import { CommentTooltip } from '../review/CommentTooltip';
import { findMarkdownLines } from '../review/markdownLineMap';
import { EmptyState } from './EmptyState';

interface MarkdownPreviewProps {
  content: string;
  theme: Theme;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  contentWidth: 'narrow' | 'medium' | 'wide' | 'full';
  fontFamily: FontFamily;
  onTOCUpdate: (toc: TOCItem[]) => void;
  onActiveHeadingChange?: (headingId: string | null) => void;
  searchQuery?: string;
  currentMatch?: number;
  onMatchCountChange?: (count: number) => void;
  filePath?: string;
  comments?: ReviewComment[];
  reviewMode?: boolean;
  onAddComment?: (comment: ReviewComment) => void;
  onUpdateComment?: (comment: ReviewComment) => void;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  content, theme, fontSize, lineHeight, letterSpacing, contentWidth, fontFamily,
  onTOCUpdate, onActiveHeadingChange, searchQuery = '', currentMatch = 0, onMatchCountChange,
  filePath, comments = [], reviewMode = false, onAddComment, onUpdateComment,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prevMatchCountRef = useRef<number>(0);

  // テキスト選択状態（useTextSelectionフックを廃止し直接管理）
  const [selectionAnchor, setSelectionAnchor] = useState<CommentAnchor | null>(null);
  const [selectionPosition, setSelectionPosition] = useState<{ top: number; left: number } | null>(null);
  const [isCommentFormOpen, setIsCommentFormOpen] = useState(false);

  const { html, toc } = useMemo(() => {
    if (!content) return { html: '', toc: [] };
    return parseMarkdown(content);
  }, [content]);

  const { html: highlightedHtml, matchCount } = useMemo(() => {
    if (!html || !searchQuery) return { html, matchCount: 0 };
    return applySearchHighlight(html, searchQuery, currentMatch);
  }, [html, searchQuery, currentMatch]);

  useCommentHighlight(containerRef, comments, highlightedHtml);

  useEffect(() => {
    if (matchCount !== prevMatchCountRef.current) {
      prevMatchCountRef.current = matchCount;
      onMatchCountChange?.(matchCount);
    }
  }, [matchCount, onMatchCountChange]);

  useEffect(() => {
    if (matchCount > 0 && containerRef.current) {
      const activeElement = containerRef.current.querySelector('.search-highlight-active');
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentMatch, matchCount, highlightedHtml]);

  const { fontOption } = useThemeStyle(theme, fontFamily);

  useEffect(() => { onTOCUpdate(toc); }, [toc, onTOCUpdate]);

  useEffect(() => {
    if (html) {
      const timer = setTimeout(() => { renderMermaidDiagrams(); }, 0);
      return () => clearTimeout(timer);
    }
  }, [html]);

  useHeadingObserver(containerRef, toc, onActiveHeadingChange, highlightedHtml);

  // レビューモードOFF時にクリア
  useEffect(() => {
    if (!reviewMode) {
      setSelectionAnchor(null);
      setSelectionPosition(null);
      setIsCommentFormOpen(false);
    }
  }, [reviewMode]);

  // React onMouseUp — addEventListener 不要で確実に発火する
  const handleContainerMouseUp = useCallback(() => {
    if (!reviewMode || isCommentFormOpen) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const container = containerRef.current;
    if (!container) return;

    const range = selection.getRangeAt(0);
    if (!container.contains(range.commonAncestorContainer)) return;

    const selectedText = selection.toString().trim();
    if (!selectedText || selectedText.length < 2) return;

    // prefix / suffix
    const fullText = container.textContent || '';
    const startOffset = fullText.indexOf(selectedText);
    const prefix = startOffset > 0
      ? fullText.substring(Math.max(0, startOffset - 30), startOffset)
      : '';
    const endOffset = startOffset + selectedText.length;
    const suffix = fullText.substring(endOffset, Math.min(fullText.length, endOffset + 30));

    // nearest heading
    let nearestHeadingId: string | null = null;
    let nearestHeadingText: string | null = null;
    let el: Element | null = range.startContainer instanceof Element
      ? range.startContainer
      : range.startContainer.parentElement;
    while (el && container.contains(el)) {
      if (/^H[1-6]$/i.test(el.tagName) && el.id) {
        nearestHeadingId = el.id;
        nearestHeadingText = el.textContent;
        break;
      }
      let sibling = el.previousElementSibling;
      while (sibling) {
        if (/^H[1-6]$/i.test(sibling.tagName) && sibling.id) {
          nearestHeadingId = sibling.id;
          nearestHeadingText = sibling.textContent;
          break;
        }
        sibling = sibling.previousElementSibling;
      }
      if (nearestHeadingId) break;
      el = el.parentElement;
    }

    const { lineStart, lineEnd } = findMarkdownLines(content, selectedText);

    const rect = range.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    setSelectionAnchor({
      selectedText,
      prefix,
      suffix,
      markdownLineStart: lineStart,
      markdownLineEnd: lineEnd,
      nearestHeadingId,
      nearestHeadingText,
    });
    setSelectionPosition({
      top: rect.top - containerRect.top - 40,
      left: rect.left - containerRect.left + rect.width / 2,
    });
  }, [reviewMode, isCommentFormOpen, content]);

  const handleContainerMouseDown = useCallback(() => {
    if (!reviewMode) return;
    if (!isCommentFormOpen) {
      setSelectionAnchor(null);
      setSelectionPosition(null);
    }
  }, [reviewMode, isCommentFormOpen]);

  const closeCommentForm = useCallback(() => {
    setIsCommentFormOpen(false);
    setSelectionAnchor(null);
    setSelectionPosition(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  const handleSaveComment = useCallback((comment: ReviewComment) => {
    if (comment.createdAt === comment.updatedAt) {
      onAddComment?.(comment);
    } else {
      onUpdateComment?.(comment);
    }
    closeCommentForm();
  }, [onAddComment, onUpdateComment, closeCommentForm]);

  if (!content) return <EmptyState />;

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={containerRef}
        className={`rich-markdown-preview h-full overflow-y-auto p-8 ${contentWidthMap[contentWidth]} mx-auto`}
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: lineHeight,
          letterSpacing: `${letterSpacing}em`,
          fontFamily: fontOption.fontFamily,
        }}
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        onMouseDown={handleContainerMouseDown}
        onMouseUp={handleContainerMouseUp}
      />

      {selectionAnchor && selectionPosition && !isCommentFormOpen && (
        <div
          className="absolute z-50"
          style={{
            top: `${selectionPosition.top}px`,
            left: `${selectionPosition.left}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <button
            onClick={() => setIsCommentFormOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg shadow-lg hover:bg-blue-500 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            コメント追加
          </button>
        </div>
      )}

      {isCommentFormOpen && selectionAnchor && selectionPosition && filePath && (
        <CommentForm
          anchor={selectionAnchor}
          filePath={filePath}
          position={selectionPosition}
          onSave={handleSaveComment}
          onCancel={closeCommentForm}
        />
      )}

      <CommentTooltip comments={comments} containerRef={containerRef} />
    </div>
  );
};
