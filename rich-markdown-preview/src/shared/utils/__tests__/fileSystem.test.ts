import { describe, it, expect } from 'vitest';
import { isMarkdownFile } from '../fileSystem';

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
