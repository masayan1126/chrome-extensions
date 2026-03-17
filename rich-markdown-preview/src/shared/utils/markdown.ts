import { marked } from 'marked';
import { emojify } from 'node-emoji';
import mermaid from 'mermaid';
import DOMPurify from 'dompurify';
import type { TOCItem } from '../types';
import { tocItems, resetCounters } from './markdownRenderer';
import { escapeHtmlInCodeSpans, stripFrontmatter, processFootnotes } from './markdownPreprocess';

// Ensure renderer is initialized (side effect import)
import './markdownRenderer';

export const parseMarkdown = (content: string): { html: string; toc: TOCItem[] } => {
  // リセット
  resetCounters();

  // フロントマターを除去
  let processed = stripFrontmatter(content);

  // バッククォート内のHTMLタグをエスケープ
  processed = escapeHtmlInCodeSpans(processed);

  // 脚注を処理
  processed = processFootnotes(processed);

  // 絵文字ショートコードを変換 (:smile: → 😄)
  const contentWithEmoji = emojify(processed);

  const rawHtml = marked.parse(contentWithEmoji) as string;
  const html = DOMPurify.sanitize(rawHtml, {
    ADD_TAGS: ['details', 'summary', 'mark', 'input'],
    ADD_ATTR: ['open', 'id', 'class', 'type', 'checked', 'disabled', 'data-match-index', 'data-footnote-id'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'ontoggle'],
  });

  return {
    html,
    toc: [...tocItems],
  };
};

// Mermaidダイアグラムをレンダリング
export const renderMermaidDiagrams = async (): Promise<void> => {
  try {
    await mermaid.run({
      querySelector: '.mermaid',
    });
  } catch (error) {
    console.error('Mermaid rendering error:', error);
  }
};
