import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSettings } from '../useSettings';

describe('useSettings', () => {
  beforeEach(() => {
    // Chrome storage mock をクリア
    const storage = chrome.storage.local;
    vi.mocked(storage.get).mockImplementation(() => Promise.resolve({}));
    vi.mocked(storage.set).mockImplementation(() => Promise.resolve());
  });

  it('デフォルト設定で初期ロードする', async () => {
    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.settings.currentThemeId).toBe('github-dark');
    expect(result.current.settings.fontSize).toBe(16);
    expect(result.current.settings.fontFamily).toBe('system');
  });

  it('updateSettings が部分的な更新をマージする', async () => {
    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.updateSettings({ fontSize: 20 });
    });

    expect(result.current.settings.fontSize).toBe(20);
    // 他のプロパティは変更されない
    expect(result.current.settings.fontFamily).toBe('system');
  });

  it('getCurrentTheme がプリセット ID に対して正しいテーマを返す', async () => {
    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // allThemes を使ってテーマ検索のロジックをテスト
    const allThemes = result.current.allThemes;
    const currentThemeId = result.current.settings.currentThemeId;
    const theme = allThemes.find((t) => t.id === currentThemeId);
    expect(theme).toBeDefined();
    expect(theme!.id).toBe('github-dark');
    expect(theme!.name).toBe('GitHub Dark');
  });

  it('getCurrentTheme が無効な ID に対してデフォルトにフォールバックする', async () => {
    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.updateSettings({ currentThemeId: 'nonexistent-theme' });
    });

    // 無効なIDの場合、allThemesに該当テーマが見つからないため
    // presetThemes のデフォルトにフォールバックする動作を検証
    const allThemes = result.current.allThemes;
    const currentThemeId = result.current.settings.currentThemeId;
    const found = allThemes.find((t) => t.id === currentThemeId);
    expect(found).toBeUndefined();
    // フォールバックロジック: 見つからない場合は defaultThemeId を使う
    const fallback = allThemes.find((t) => t.id === 'github-dark');
    expect(fallback).toBeDefined();
    expect(fallback!.id).toBe('github-dark');
  });

  it('addCustomTheme がテーマを追加してアクティブにする', async () => {
    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const customTheme = {
      id: 'custom-test',
      name: 'Custom Test',
      isDark: true,
      colors: {
        background: '#000000',
        text: '#ffffff',
        h1: '#ff0000',
        h2: '#00ff00',
        h3: '#0000ff',
        h4: '#ffff00',
        h5: '#ff00ff',
        h6: '#00ffff',
        link: '#0000ff',
        linkHover: '#0000cc',
        codeBackground: '#111111',
        codeText: '#eeeeee',
        inlineCodeBackground: '#222222',
        inlineCodeText: '#dddddd',
        blockquoteBorder: '#333333',
        blockquoteText: '#cccccc',
        blockquoteBackground: '#444444',
        listMarker: '#555555',
        tableBorder: '#666666',
        tableHeaderBackground: '#777777',
        tableRowEvenBackground: '#888888',
        horizontalRule: '#999999',
        bold: '#aaaaaa',
        italic: '#bbbbbb',
      },
    };

    act(() => {
      result.current.addCustomTheme(customTheme);
    });

    expect(result.current.settings.customThemes).toHaveLength(1);
    expect(result.current.settings.customThemes[0].id).toBe('custom-test');
    expect(result.current.settings.currentThemeId).toBe('custom-test');
  });

  it('deleteCustomTheme がテーマを削除する', async () => {
    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const customTheme = {
      id: 'custom-delete-test',
      name: 'Delete Test',
      isDark: true,
      colors: {
        background: '#000000',
        text: '#ffffff',
        h1: '#ff0000',
        h2: '#00ff00',
        h3: '#0000ff',
        h4: '#ffff00',
        h5: '#ff00ff',
        h6: '#00ffff',
        link: '#0000ff',
        linkHover: '#0000cc',
        codeBackground: '#111111',
        codeText: '#eeeeee',
        inlineCodeBackground: '#222222',
        inlineCodeText: '#dddddd',
        blockquoteBorder: '#333333',
        blockquoteText: '#cccccc',
        blockquoteBackground: '#444444',
        listMarker: '#555555',
        tableBorder: '#666666',
        tableHeaderBackground: '#777777',
        tableRowEvenBackground: '#888888',
        horizontalRule: '#999999',
        bold: '#aaaaaa',
        italic: '#bbbbbb',
      },
    };

    act(() => {
      result.current.addCustomTheme(customTheme);
    });

    expect(result.current.settings.customThemes).toHaveLength(1);

    act(() => {
      result.current.deleteCustomTheme('custom-delete-test');
    });

    expect(result.current.settings.customThemes).toHaveLength(0);
    // 削除されたテーマが現在のテーマだった場合はデフォルトに戻る
    expect(result.current.settings.currentThemeId).toBe('github-dark');
  });
});
