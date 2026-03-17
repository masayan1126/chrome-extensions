import { describe, it, expect } from 'vitest';
import { presetThemes, defaultThemeId } from '../presets';
import type { ThemeColors } from '../../../shared/types';

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

describe('presetThemes', () => {
  it('すべてのテーマのIDがユニークである', () => {
    const ids = presetThemes.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('すべてのテーマにすべての ThemeColors プロパティがある', () => {
    for (const theme of presetThemes) {
      for (const key of allThemeColorKeys) {
        expect(theme.colors).toHaveProperty(key);
        expect(typeof theme.colors[key]).toBe('string');
        expect(theme.colors[key].length).toBeGreaterThan(0);
      }
    }
  });

  it('すべてのテーマに id, name, isDark が存在する', () => {
    for (const theme of presetThemes) {
      expect(typeof theme.id).toBe('string');
      expect(theme.id.length).toBeGreaterThan(0);
      expect(typeof theme.name).toBe('string');
      expect(theme.name.length).toBeGreaterThan(0);
      expect(typeof theme.isDark).toBe('boolean');
    }
  });

  it('defaultThemeId が presetThemes に存在する', () => {
    const found = presetThemes.find((t) => t.id === defaultThemeId);
    expect(found).toBeDefined();
  });

  it('ライトテーマとダークテーマの両方が含まれる', () => {
    const lightThemes = presetThemes.filter((t) => !t.isDark);
    const darkThemes = presetThemes.filter((t) => t.isDark);
    expect(lightThemes.length).toBeGreaterThan(0);
    expect(darkThemes.length).toBeGreaterThan(0);
  });
});
