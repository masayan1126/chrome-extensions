import { describe, it, expect } from 'vitest';
import { isMarkdownFile, getDisambiguatedLabels } from '../fileSystem';

describe('isMarkdownFile', () => {
  it('.md ファイルは true を返す', () => {
    expect(isMarkdownFile('README.md')).toBe(true);
  });

  it('.markdown ファイルは true を返す', () => {
    expect(isMarkdownFile('document.markdown')).toBe(true);
  });

  it('.mdx ファイルは true を返す', () => {
    expect(isMarkdownFile('component.mdx')).toBe(true);
  });

  it('.mkd ファイルは true を返す', () => {
    expect(isMarkdownFile('notes.mkd')).toBe(true);
  });

  it('.MD (大文字) は true を返す', () => {
    expect(isMarkdownFile('README.MD')).toBe(true);
  });

  it('.MARKDOWN (大文字) は true を返す', () => {
    expect(isMarkdownFile('DOC.MARKDOWN')).toBe(true);
  });

  it('.css ファイルは false を返す', () => {
    expect(isMarkdownFile('style.css')).toBe(false);
  });

  it('.js ファイルは false を返す', () => {
    expect(isMarkdownFile('app.js')).toBe(false);
  });

  it('空文字列は false を返す', () => {
    expect(isMarkdownFile('')).toBe(false);
  });

  it('拡張子のみの ".md" は true を返す', () => {
    expect(isMarkdownFile('.md')).toBe(true);
  });

  it('二重拡張子の "file.txt.md" は true を返す', () => {
    expect(isMarkdownFile('file.txt.md')).toBe(true);
  });

  it('.txt ファイルは false を返す', () => {
    expect(isMarkdownFile('file.txt')).toBe(false);
  });
});

describe('getDisambiguatedLabels', () => {
  it('同名ファイルがない場合はファイル名のみ', () => {
    const files = [
      { name: 'README.md', path: 'docs/README.md' },
      { name: 'memo.md', path: 'input/memo.md' },
    ];
    const labels = getDisambiguatedLabels(files);
    expect(labels.get('docs/README.md')).toBe('README.md');
    expect(labels.get('input/memo.md')).toBe('memo.md');
  });

  it('同名ファイルは親ディレクトリで区別', () => {
    const files = [
      { name: 'memo.md', path: 'input/memo.md' },
      { name: 'memo.md', path: 'output/memo.md' },
    ];
    const labels = getDisambiguatedLabels(files);
    expect(labels.get('input/memo.md')).toBe('input/memo.md');
    expect(labels.get('output/memo.md')).toBe('output/memo.md');
  });

  it('親ディレクトリも同名の場合はさらに上位で区別', () => {
    const files = [
      { name: 'memo.md', path: 'a/docs/memo.md' },
      { name: 'memo.md', path: 'b/docs/memo.md' },
    ];
    const labels = getDisambiguatedLabels(files);
    expect(labels.get('a/docs/memo.md')).toBe('a/docs/memo.md');
    expect(labels.get('b/docs/memo.md')).toBe('b/docs/memo.md');
  });

  it('パス情報がないファイル（D&D経由）はファイル名のみ', () => {
    const files = [
      { name: 'memo.md', path: 'memo.md' },
      { name: 'memo.md', path: 'input/memo.md' },
    ];
    const labels = getDisambiguatedLabels(files);
    expect(labels.get('memo.md')).toBe('memo.md');
    expect(labels.get('input/memo.md')).toBe('input/memo.md');
  });

  it('3つ以上の同名ファイルでも正しく区別', () => {
    const files = [
      { name: 'memo.md', path: 'a/memo.md' },
      { name: 'memo.md', path: 'b/memo.md' },
      { name: 'memo.md', path: 'c/memo.md' },
    ];
    const labels = getDisambiguatedLabels(files);
    expect(labels.get('a/memo.md')).toBe('a/memo.md');
    expect(labels.get('b/memo.md')).toBe('b/memo.md');
    expect(labels.get('c/memo.md')).toBe('c/memo.md');
  });

  it('異なるファイル名の組み合わせでも正しく処理', () => {
    const files = [
      { name: 'memo.md', path: 'input/memo.md' },
      { name: 'memo.md', path: 'output/memo.md' },
      { name: 'README.md', path: 'docs/README.md' },
    ];
    const labels = getDisambiguatedLabels(files);
    expect(labels.get('input/memo.md')).toBe('input/memo.md');
    expect(labels.get('output/memo.md')).toBe('output/memo.md');
    expect(labels.get('docs/README.md')).toBe('README.md');
  });
});
