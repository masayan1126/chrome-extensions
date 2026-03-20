import { useState, useCallback, useEffect, useRef } from 'react';
import type { CommentAnchor } from '../../shared/types';
import { findMarkdownLines } from './markdownLineMap';

interface SelectionState {
  anchor: CommentAnchor | null;
  position: { top: number; left: number } | null;
}

export const useTextSelection = (
  containerRef: React.RefObject<HTMLDivElement | null>,
  markdownContent: string,
  reviewMode: boolean,
) => {
  const [selectionState, setSelectionState] = useState<SelectionState>({
    anchor: null,
    position: null,
  });
  const [isCommentFormOpen, setIsCommentFormOpen] = useState(false);

  const isSelecting = useRef(false);
  const reviewModeRef = useRef(reviewMode);
  const isCommentFormOpenRef = useRef(isCommentFormOpen);
  const markdownContentRef = useRef(markdownContent);

  reviewModeRef.current = reviewMode;
  isCommentFormOpenRef.current = isCommentFormOpen;
  markdownContentRef.current = markdownContent;

  const openCommentForm = useCallback(() => {
    setIsCommentFormOpen(true);
  }, []);

  const closeCommentForm = useCallback(() => {
    setIsCommentFormOpen(false);
    setSelectionState({ anchor: null, position: null });
    window.getSelection()?.removeAllRanges();
  }, []);

  useEffect(() => {
    if (!reviewMode) {
      setSelectionState({ anchor: null, position: null });
      setIsCommentFormOpen(false);
    }
  }, [reviewMode]);

  // document レベルでリスナー登録（containerRef.current が後から設定されても動作する）
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (!reviewModeRef.current) return;
      const container = containerRef.current;
      if (!container || !container.contains(e.target as Node)) return;

      isSelecting.current = true;
      if (!isCommentFormOpenRef.current) {
        setSelectionState({ anchor: null, position: null });
      }
    };

    const onMouseUp = () => {
      if (!reviewModeRef.current) return;
      if (!isSelecting.current) return;
      isSelecting.current = false;

      const container = containerRef.current;
      if (!container) return;

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

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

      const { lineStart, lineEnd } = findMarkdownLines(markdownContentRef.current, selectedText);

      const rect = range.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      setSelectionState({
        anchor: {
          selectedText,
          prefix,
          suffix,
          markdownLineStart: lineStart,
          markdownLineEnd: lineEnd,
          nearestHeadingId,
          nearestHeadingText,
        },
        position: {
          top: rect.top - containerRect.top - 40,
          left: rect.left - containerRect.left + rect.width / 2,
        },
      });
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    selectionAnchor: selectionState.anchor,
    selectionPosition: selectionState.position,
    isCommentFormOpen,
    openCommentForm,
    closeCommentForm,
  };
};
