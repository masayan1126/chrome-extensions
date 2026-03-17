import { marked } from 'marked';
import DOMPurify from 'dompurify';

// バッククォート内のHTMLタグをエスケープ（markedがHTMLとして解釈するのを防止）
export const escapeHtmlInCodeSpans = (content: string): string => {
  return content.replace(/`([^`\n]+)`/g, (match, code) => {
    if (/<[a-zA-Z/][^>]*>/.test(code)) {
      const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<code>${escaped}</code>`;
    }
    return match;
  });
};

// フロントマター（YAML）を除去
export const stripFrontmatter = (content: string): string => {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (match) {
    return content.slice(match[0].length);
  }
  return content;
};

// 脚注IDのサニタイズ
const sanitizeId = (id: string): string => id.replace(/[^a-zA-Z0-9_-]/g, '');

// 脚注を処理
export const processFootnotes = (content: string): string => {
  const footnotes = new Map<string, string>();
  const defRegex = /^\[\^([^\]]+)\]:\s*(.+)$/gm;
  let match;
  while ((match = defRegex.exec(content)) !== null) {
    footnotes.set(match[1], match[2]);
  }

  if (footnotes.size === 0) return content;

  // 脚注定義を本文から除去
  let processed = content.replace(/^\[\^([^\]]+)\]:\s*(.+)$/gm, '');

  // インライン参照を上付き文字リンクに変換
  processed = processed.replace(/\[\^([^\]]+)\]/g, (_, id) => {
    const safeId = sanitizeId(id);
    return `<sup class="footnote-ref"><a href="#fn-${safeId}" id="fnref-${safeId}">[${safeId}]</a></sup>`;
  });

  // 脚注セクションを末尾に追加
  processed += '\n\n---\n\n<section class="footnotes"><ol class="footnotes-list">';
  for (const [id, text] of footnotes) {
    const safeId = sanitizeId(id);
    const sanitizedText = DOMPurify.sanitize(marked.parseInline(text) as string);
    processed += `<li class="footnote-item" id="fn-${safeId}">${sanitizedText} <a href="#fnref-${safeId}" class="footnote-backref">\u21a9</a></li>`;
  }
  processed += '</ol></section>';

  return processed;
};
