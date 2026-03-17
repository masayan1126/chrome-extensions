import React, { useMemo, useEffect, useRef } from 'react';
import type { Theme, TOCItem, FontFamily } from '../../shared/types';
import { parseMarkdown, renderMermaidDiagrams } from '../../shared/utils/markdown';
import { applySearchHighlight, contentWidthMap } from './searchHighlight';
import { useHeadingObserver } from './useHeadingObserver';
import { useThemeStyle } from './useThemeStyle';
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
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  content, theme, fontSize, lineHeight, letterSpacing, contentWidth, fontFamily,
  onTOCUpdate, onActiveHeadingChange, searchQuery = '', currentMatch = 0, onMatchCountChange,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prevMatchCountRef = useRef<number>(0);

  const { html, toc } = useMemo(() => {
    if (!content) return { html: '', toc: [] };
    return parseMarkdown(content);
  }, [content]);

  const { html: highlightedHtml, matchCount } = useMemo(() => {
    if (!html || !searchQuery) return { html, matchCount: 0 };
    return applySearchHighlight(html, searchQuery, currentMatch);
  }, [html, searchQuery, currentMatch]);

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

  if (!content) return <EmptyState />;

  return (
    <div
      ref={containerRef}
      className={`rich-markdown-preview flex-1 overflow-y-auto p-8 ${contentWidthMap[contentWidth]} mx-auto`}
      style={{
        fontSize: `${fontSize}px`,
        lineHeight: lineHeight,
        letterSpacing: `${letterSpacing}em`,
        fontFamily: fontOption.fontFamily,
      }}
      dangerouslySetInnerHTML={{ __html: highlightedHtml }}
    />
  );
};
