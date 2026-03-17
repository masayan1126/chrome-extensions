import { describe, it, expect } from 'vitest';
import { parseMarkdown } from '../markdown';

describe('parseMarkdown', () => {
  it('h1 見出しが正しい HTML と TOC を生成する', () => {
    const result = parseMarkdown('# Hello');
    expect(result.html).toContain('<h1');
    expect(result.html).toContain('Hello');
    expect(result.toc).toHaveLength(1);
    expect(result.toc[0].level).toBe(1);
    expect(result.toc[0].text).toBe('Hello');
  });

  it('h2 見出しが正しく生成される', () => {
    const result = parseMarkdown('## World');
    expect(result.html).toContain('<h2');
    expect(result.html).toContain('World');
    expect(result.toc).toHaveLength(1);
    expect(result.toc[0].level).toBe(2);
  });

  it('h3-h6 見出しが正しく生成される', () => {
    const content = '### H3\n#### H4\n##### H5\n###### H6';
    const result = parseMarkdown(content);
    expect(result.toc).toHaveLength(4);
    expect(result.toc[0].level).toBe(3);
    expect(result.toc[1].level).toBe(4);
    expect(result.toc[2].level).toBe(5);
    expect(result.toc[3].level).toBe(6);
  });

  it('コードブロックに言語が指定されるとハイライトされる', () => {
    const content = '```javascript\nconst x = 1;\n```';
    const result = parseMarkdown(content);
    expect(result.html).toContain('class="hljs"');
    expect(result.html).toContain('language-javascript');
  });

  it('mermaid コードブロックが mermaid-container でラップされる', () => {
    const content = '```mermaid\ngraph TD;\n  A-->B;\n```';
    const result = parseMarkdown(content);
    expect(result.html).toContain('mermaid-container');
    expect(result.html).toContain('class="mermaid"');
  });

  it('タスクリストがチェックボックスを生成する', () => {
    const content = '- [x] Done\n- [ ] Todo';
    const result = parseMarkdown(content);
    expect(result.html).toContain('type="checkbox"');
    expect(result.html).toContain('checked');
    expect(result.html).toContain('task-list-item');
  });

  it('フロントマターが除去される', () => {
    const content = '---\ntitle: Test\ndate: 2024-01-01\n---\n# Hello';
    const result = parseMarkdown(content);
    expect(result.html).not.toContain('title: Test');
    expect(result.html).toContain('Hello');
  });

  it('絵文字ショートコードが変換される', () => {
    const content = ':smile: :+1:';
    const result = parseMarkdown(content);
    // node-emoji converts :smile: to the emoji character
    expect(result.html).not.toContain(':smile:');
  });

  it('脚注が処理される', () => {
    const content = 'Text with a footnote[^1]\n\n[^1]: This is the footnote';
    const result = parseMarkdown(content);
    expect(result.html).toContain('footnote-ref');
    expect(result.html).toContain('footnotes');
    expect(result.html).toContain('footnote-backref');
  });

  it('空コンテンツは空の html と空の toc を返す', () => {
    const result = parseMarkdown('');
    expect(result.html).toBe('');
    expect(result.toc).toHaveLength(0);
  });

  it('複数回呼び出してもカウンターがリセットされる', () => {
    const result1 = parseMarkdown('# First');
    const result2 = parseMarkdown('# Second');
    expect(result1.toc[0].id).toBe('heading-0');
    expect(result2.toc[0].id).toBe('heading-0');
  });

  it('不明な言語のコードブロックは plaintext としてレンダリングされる', () => {
    const content = '```unknownlang\nsome code\n```';
    const result = parseMarkdown(content);
    expect(result.html).toContain('language-plaintext');
  });
});
