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

// タスクリスト対応
renderer.listitem = ({ text, task, checked }) => {
  if (task) {
    return `<li class="task-list-item"><input type="checkbox" ${
      checked ? 'checked' : ''
    } disabled />${text}</li>`;
  }
  return `<li>${text}</li>`;
};

// markedの設定
marked.setOptions({
  renderer,
  gfm: true,
  breaks: true,
});

export const parseMarkdown = (content: string): { html: string; toc: TOCItem[] } => {
  // リセット
  tocItems = [];
  headingCounter = 0;
  mermaidCounter = 0;

  // 絵文字ショートコードを変換 (:smile: → 😄)
  const contentWithEmoji = emojify(content);

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
