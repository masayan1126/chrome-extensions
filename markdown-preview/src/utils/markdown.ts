import { marked } from 'marked';
import hljs from 'highlight.js';
import { emojify } from 'node-emoji';
import mermaid from 'mermaid';
import type { TOCItem } from '../types';

// Mermaidの初期化
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
});

// highlight.jsのカスタムレンダラー
const renderer = new marked.Renderer();

// 見出しにIDを付与してTOC生成用に使用
let tocItems: TOCItem[] = [];
let headingCounter = 0;

renderer.heading = ({ text, depth }) => {
  const id = `heading-${headingCounter++}`;
  tocItems.push({ id, text, level: depth });
  return `<h${depth} id="${id}">${text}</h${depth}>`;
};

// Mermaidブロック用のカウンター
let mermaidCounter = 0;

// コードブロックのシンタックスハイライト（Mermaid対応）
renderer.code = ({ text, lang }) => {
  // Mermaidダイアグラムの場合
  if (lang === 'mermaid') {
    const id = `mermaid-${mermaidCounter++}`;
    return `<div class="mermaid-container"><pre class="mermaid" id="${id}">${text}</pre></div>`;
  }

  const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
  const highlighted = hljs.highlight(text, { language }).value;
  return `<pre class="hljs"><code class="language-${language}">${highlighted}</code></pre>`;
};

// タスクリスト対応（インライン要素を明示的にパース）
renderer.listitem = ({ text, task, checked }) => {
  const rendered = marked.parseInline(text) as string;
  if (task) {
    return `<li class="task-list-item"><input type="checkbox" ${
      checked ? 'checked' : ''
    } disabled />${rendered}</li>`;
  }
  return `<li>${rendered}</li>`;
};

// markedの設定
marked.setOptions({
  renderer,
  gfm: true,
  breaks: true,
});

// バッククォート内のHTMLタグをエスケープ（markedがHTMLとして解釈するのを防止）
const escapeHtmlInCodeSpans = (content: string): string => {
  return content.replace(/`([^`\n]+)`/g, (match, code) => {
    if (/<[a-zA-Z/][^>]*>/.test(code)) {
      const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<code>${escaped}</code>`;
    }
    return match;
  });
};

// フロントマター（YAML）を除去
const stripFrontmatter = (content: string): string => {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (match) {
    return content.slice(match[0].length);
  }
  return content;
};

// 脚注を処理
const processFootnotes = (content: string): string => {
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
    return `<sup class="footnote-ref"><a href="#fn-${id}" id="fnref-${id}">[${id}]</a></sup>`;
  });

  // 脚注セクションを末尾に追加
  processed += '\n\n---\n\n<section class="footnotes"><ol class="footnotes-list">';
  for (const [id, text] of footnotes) {
    processed += `<li class="footnote-item" id="fn-${id}">${marked.parseInline(text)} <a href="#fnref-${id}" class="footnote-backref">↩</a></li>`;
  }
  processed += '</ol></section>';

  return processed;
};

export const parseMarkdown = (content: string): { html: string; toc: TOCItem[] } => {
  // リセット
  tocItems = [];
  headingCounter = 0;
  mermaidCounter = 0;

  // フロントマターを除去
  let processed = stripFrontmatter(content);

  // バッククォート内のHTMLタグをエスケープ
  processed = escapeHtmlInCodeSpans(processed);

  // 脚注を処理
  processed = processFootnotes(processed);

  // 絵文字ショートコードを変換 (:smile: → 😄)
  const contentWithEmoji = emojify(processed);

  const html = marked.parse(contentWithEmoji) as string;

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

// Mermaidテーマを更新
export const updateMermaidTheme = (isDark: boolean): void => {
  mermaid.initialize({
    startOnLoad: false,
    theme: isDark ? 'dark' : 'default',
    securityLevel: 'loose',
  });
};

export const generateTOCHtml = (toc: TOCItem[]): string => {
  if (toc.length === 0) return '';

  let html = '<nav class="toc"><ul>';
  let prevLevel = 0;

  for (const item of toc) {
    if (item.level > prevLevel) {
      html += '<ul>'.repeat(item.level - prevLevel);
    } else if (item.level < prevLevel) {
      html += '</ul>'.repeat(prevLevel - item.level);
    }
    html += `<li><a href="#${item.id}">${item.text}</a></li>`;
    prevLevel = item.level;
  }

  html += '</ul>'.repeat(prevLevel);
  html += '</ul></nav>';

  return html;
};
