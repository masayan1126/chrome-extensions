import React, { useMemo, useEffect, useRef, useCallback } from 'react';
import type { Theme, TOCItem, FontFamily } from '../types';
import { parseMarkdown, renderMermaidDiagrams } from '../utils/markdown';
import { generateThemeCSS } from '../utils/themeStyles';
import { getFontOption, loadGoogleFont } from '../utils/fonts';

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

// HTML文字列にハイライトを適用する関数
const applySearchHighlight = (
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

const contentWidthMap = {
  narrow: 'max-w-2xl',
  medium: 'max-w-4xl',
  wide: 'max-w-6xl',
  full: 'max-w-none',
};

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  content,
  theme,
  fontSize,
  lineHeight,
  letterSpacing,
  contentWidth,
  fontFamily,
  onTOCUpdate,
  onActiveHeadingChange,
  searchQuery = '',
  currentMatch = 0,
  onMatchCountChange,
}) => {
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prevMatchCountRef = useRef<number>(0);

  const { html, toc } = useMemo(() => {
    if (!content) return { html: '', toc: [] };
    return parseMarkdown(content);
  }, [content]);

  // 検索クエリに基づいてHTMLにハイライトを適用
  const { html: highlightedHtml, matchCount } = useMemo(() => {
    if (!html || !searchQuery) return { html, matchCount: 0 };
    return applySearchHighlight(html, searchQuery, currentMatch);
  }, [html, searchQuery, currentMatch]);

  // マッチ数の変更を親に通知
  useEffect(() => {
    if (matchCount !== prevMatchCountRef.current) {
      prevMatchCountRef.current = matchCount;
      onMatchCountChange?.(matchCount);
    }
  }, [matchCount, onMatchCountChange]);

  // currentMatchが変わったらスクロール
  useEffect(() => {
    if (matchCount > 0 && containerRef.current) {
      const activeElement = containerRef.current.querySelector('.search-highlight-active');
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentMatch, matchCount, highlightedHtml]);

  const fontOption = useMemo(() => getFontOption(fontFamily), [fontFamily]);

  useEffect(() => {
    loadGoogleFont(fontOption);
  }, [fontOption]);

  useEffect(() => {
    onTOCUpdate(toc);
  }, [toc, onTOCUpdate]);

  // Mermaidダイアグラムをレンダリング
  useEffect(() => {
    if (html) {
      // DOMが更新された後にMermaidをレンダリング
      const timer = setTimeout(() => {
        renderMermaidDiagrams();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [html]);

  useEffect(() => {
    const css = generateThemeCSS(theme);

    if (!styleRef.current) {
      styleRef.current = document.createElement('style');
      document.head.appendChild(styleRef.current);
    }
    styleRef.current.textContent = css;

    return () => {
      if (styleRef.current) {
        document.head.removeChild(styleRef.current);
        styleRef.current = null;
      }
    };
  }, [theme]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current || !onActiveHeadingChange || toc.length === 0) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const offset = 100; // 上部からのオフセット

    // すべての見出し要素を取得
    const headingElements = toc
      .map((item) => ({
        id: item.id,
        element: document.getElementById(item.id),
      }))
      .filter((item) => item.element !== null);

    if (headingElements.length === 0) {
      onActiveHeadingChange(null);
      return;
    }

    // スクロール位置に基づいてアクティブな見出しを特定
    let activeId: string | null = null;

    for (let i = headingElements.length - 1; i >= 0; i--) {
      const { id, element } = headingElements[i];
      if (element) {
        const rect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const relativeTop = rect.top - containerRect.top;

        if (relativeTop <= offset) {
          activeId = id;
          break;
        }
      }
    }

    // 一番上までスクロールしている場合は最初の見出しをアクティブに
    if (activeId === null && scrollTop < offset && headingElements.length > 0) {
      activeId = headingElements[0].id;
    }

    onActiveHeadingChange(activeId);
  }, [toc, onActiveHeadingChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    // 初期状態でも一度実行
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  if (!content) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p>Markdownファイルを選択してください</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`markdown-preview flex-1 overflow-y-auto p-8 ${contentWidthMap[contentWidth]} mx-auto`}
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
