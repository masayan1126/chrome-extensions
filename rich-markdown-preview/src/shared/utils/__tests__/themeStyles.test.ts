import { describe, it, expect } from 'vitest';
import { generateThemeCSS, createDefaultThemeColors } from '../themeStyles';
import type { Theme, ThemeColors } from '../../types';

const allThemeColorKeys: (keyof ThemeColors)[] = [
  'background', 'text',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'link', 'linkHover',
  'codeBackground', 'codeText',
  'inlineCodeBackground', 'inlineCodeText',
  'blockquoteBorder', 'blockquoteText', 'blockquoteBackground',
  'listMarker',
  'tableBorder', 'tableHeaderBackground', 'tableRowEvenBackground',
  'horizontalRule', 'bold', 'italic',
];

describe('generateThemeCSS', () => {
  const darkTheme: Theme = {
    id: 'test-dark',
    name: 'Test Dark',
    isDark: true,
    colors: createDefaultThemeColors(true),
  };

  const lightTheme: Theme = {
    id: 'test-light',
    name: 'Test Light',
    isDark: false,
    colors: createDefaultThemeColors(false),
  };

  it('空でない文字列を返す', () => {
    const css = generateThemeCSS(darkTheme);
    expect(css.length).toBeGreaterThan(0);
  });

  it('.rich-markdown-preview セレクタを含む', () => {
    const css = generateThemeCSS(darkTheme);
    expect(css).toContain('.rich-markdown-preview');
  });

  it('.rich-markdown-preview h1 セレクタを含む', () => {
    const css = generateThemeCSS(darkTheme);
    expect(css).toContain('.rich-markdown-preview h1');
  });

  it('.rich-markdown-preview a セレクタを含む', () => {
    const css = generateThemeCSS(darkTheme);
    expect(css).toContain('.rich-markdown-preview a');
  });

  it('ダークテーマとライトテーマで異なる CSS を生成する', () => {
    const darkCSS = generateThemeCSS(darkTheme);
    const lightCSS = generateThemeCSS(lightTheme);
    expect(darkCSS).not.toEqual(lightCSS);
  });

  it('テーマの背景色が CSS に含まれる', () => {
    const css = generateThemeCSS(darkTheme);
    expect(css).toContain(darkTheme.colors.background);
  });
});

describe('createDefaultThemeColors', () => {
  it('isDark=true はダークカラーを返す (背景が暗い)', () => {
    const colors = createDefaultThemeColors(true);
    expect(colors.background).toBe('#1a1a2e');
  });

  it('isDark=false はライトカラーを返す (背景が明るい)', () => {
    const colors = createDefaultThemeColors(false);
    expect(colors.background).toBe('#ffffff');
  });

  it('isDark=true ですべての ThemeColors プロパティが存在する', () => {
    const colors = createDefaultThemeColors(true);
    for (const key of allThemeColorKeys) {
      expect(colors).toHaveProperty(key);
      expect(typeof colors[key]).toBe('string');
      expect(colors[key].length).toBeGreaterThan(0);
    }
  });

  it('isDark=false ですべての ThemeColors プロパティが存在する', () => {
    const colors = createDefaultThemeColors(false);
    for (const key of allThemeColorKeys) {
      expect(colors).toHaveProperty(key);
      expect(typeof colors[key]).toBe('string');
      expect(colors[key].length).toBeGreaterThan(0);
    }
  });
});
