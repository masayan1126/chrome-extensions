import { useCallback, useEffect, useRef } from 'react';
import type { TOCItem } from '../../shared/types';
import { useAnchorClick } from './useAnchorClick';

export const useHeadingObserver = (
  containerRef: React.RefObject<HTMLDivElement | null>,
  toc: TOCItem[],
  onActiveHeadingChange?: (headingId: string | null) => void,
  highlightedHtml?: string
) => {
  const rafRef = useRef<number | null>(null);

  const handleScrollImmediate = useCallback(() => {
    if (!containerRef.current || !onActiveHeadingChange || toc.length === 0) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const offset = 100;

    const headingElements = toc
      .map((item) => ({ id: item.id, element: document.getElementById(item.id) }))
      .filter((item) => item.element !== null);

    if (headingElements.length === 0) {
      onActiveHeadingChange(null);
      return;
    }

    let activeId: string | null = null;

    for (let i = headingElements.length - 1; i >= 0; i--) {
      const { id, element } = headingElements[i];
      if (element) {
        const rect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        if (rect.top - containerRect.top <= offset) {
          activeId = id;
          break;
        }
      }
    }

    if (activeId === null && scrollTop < offset && headingElements.length > 0) {
      activeId = headingElements[0].id;
    }

    onActiveHeadingChange(activeId);
  }, [containerRef, toc, onActiveHeadingChange]);

  const handleScroll = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      handleScrollImmediate();
    });
  }, [handleScrollImmediate]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    handleScrollImmediate();

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [handleScroll, handleScrollImmediate]);

  useAnchorClick(containerRef, highlightedHtml);
};
