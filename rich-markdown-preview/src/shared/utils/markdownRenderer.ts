import { marked } from 'marked';
import hljs from 'highlight.js';
import mermaid from 'mermaid';
import type { TOCItem } from '../types';

// Mermaidの初期化
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'strict',
});

// highlight.jsのカスタムレンダラー
const renderer = new marked.Renderer();

// 見出しにIDを付与してTOC生成用に使用
export let tocItems: TOCItem[] = [];
export let headingCounter = 0;
export let mermaidCounter = 0;

export const resetCounters = () => {
  tocItems = [];
  headingCounter = 0;
  mermaidCounter = 0;
};

renderer.heading = ({ text, depth }) => {
  const id = `heading-${headingCounter++}`;
  tocItems.push({ id, text, level: depth });
  return `<h${depth} id="${id}">${text}</h${depth}>`;
};

// コードブロックのシンタックスハイライト（Mermaid対応）
renderer.code = ({ text, lang }) => {
  if (lang === 'mermaid') {
    const id = `mermaid-${mermaidCounter++}`;
    return `<div class="mermaid-container"><pre class="mermaid" id="${id}">${text}</pre></div>`;
  }

  const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
  const highlighted = hljs.highlight(text, { language }).value;
  return `<pre class="hljs"><code class="language-${language}">${highlighted}</code></pre>`;
};

// タスクリスト対応（通常関数で this.parser を使いネスト構造を保持）
renderer.listitem = function (token) {
  const body = this.parser.parse(token.tokens);
  if (token.task) {
    return `<li class="task-list-item"><input type="checkbox" ${
      token.checked ? 'checked' : ''
    } disabled />${body}</li>`;
  }
  return `<li>${body}</li>`;
};

// markedの設定
marked.setOptions({
  renderer,
  gfm: true,
  breaks: true,
});
