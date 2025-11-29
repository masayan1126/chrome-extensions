import { describe, it, expect } from 'vitest';
import { buildLine, joinLines, composeText } from '@/utils/format';

describe('フォーマットユーティリティ', () => {
  it('Markdown行を生成できる', () => {
    const line = buildLine({ id: 1, title: 'サイト', url: 'https://example.com' }, { kind: 'markdown' });
    expect(line).toBe('[サイト](https://example.com)');
  });

  it('HTML行を生成できる', () => {
    const line = buildLine({ id: 1, title: 'A&B', url: 'https://exa.com?a=1&b=2' }, { kind: 'html' });
    expect(line).toBe('<a href="https://exa.com?a=1&amp;b=2">A&amp;B</a>');
  });

  it('プレーン行を生成できる', () => {
    const line = buildLine({ id: 1, title: 'タイトル', url: 'https://a' }, { kind: 'plain' });
    expect(line).toBe('タイトル https://a');
  });

  it('複数行を結合できる', () => {
    const text = joinLines(['a', 'b']);
    expect(text).toBe('a\nb');
  });

  it('タイトルと改行+URLの行を生成できる', () => {
    const line = buildLine({ id: 1, title: 'タイトル', url: 'https://a' }, { kind: 'title_newline_url' });
    expect(line).toBe('タイトル\nhttps://a');
  });

  it('タイトル+改行+URLの複数アイテムを空行で結合できる', () => {
    const lines = [
      buildLine({ id: 1, title: 'A', url: 'https://a' }, { kind: 'title_newline_url' }),
      buildLine({ id: 2, title: 'B', url: 'https://b' }, { kind: 'title_newline_url' }),
    ];
    const text = composeText(lines, { kind: 'title_newline_url' });
    expect(text).toBe('A\nhttps://a\n\nB\nhttps://b');
  });
});


