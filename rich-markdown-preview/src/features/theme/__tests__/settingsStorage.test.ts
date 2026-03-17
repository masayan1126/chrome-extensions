import { describe, it, expect } from 'vitest';
import { defaultSettings } from '../settingsStorage';

describe('defaultSettings', () => {
  it('currentThemeId がデフォルト値を持つ', () => {
    expect(defaultSettings.currentThemeId).toBe('github-dark');
  });

  it('customThemes が空配列', () => {
    expect(defaultSettings.customThemes).toEqual([]);
  });

  it('fontSize が 16', () => {
    expect(defaultSettings.fontSize).toBe(16);
  });

  it('lineHeight が 1.6', () => {
    expect(defaultSettings.lineHeight).toBe(1.6);
  });

  it('letterSpacing が 0', () => {
    expect(defaultSettings.letterSpacing).toBe(0);
  });

  it('contentWidth が "medium"', () => {
    expect(defaultSettings.contentWidth).toBe('medium');
  });

  it('showLineNumbers が true', () => {
    expect(defaultSettings.showLineNumbers).toBe(true);
  });

  it('showTOC が true', () => {
    expect(defaultSettings.showTOC).toBe(true);
  });

  it('fontFamily が "system"', () => {
    expect(defaultSettings.fontFamily).toBe('system');
  });

  it('showHiddenFiles が false', () => {
    expect(defaultSettings.showHiddenFiles).toBe(false);
  });

  it('すべての期待されるプロパティが存在する', () => {
    const expectedKeys = [
      'currentThemeId',
      'customThemes',
      'fontSize',
      'lineHeight',
      'letterSpacing',
      'contentWidth',
      'showLineNumbers',
      'showTOC',
      'fontFamily',
      'showHiddenFiles',
    ];
    for (const key of expectedKeys) {
      expect(defaultSettings).toHaveProperty(key);
    }
  });
});
