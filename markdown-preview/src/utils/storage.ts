import type { AppSettings, Theme } from '../types';
import { defaultThemeId } from '../themes/presets';

const STORAGE_KEY = 'markdown-preview-settings';

export const defaultSettings: AppSettings = {
  currentThemeId: defaultThemeId,
  customThemes: [],
  fontSize: 16,
  lineHeight: 1.6,
  letterSpacing: 0,
  contentWidth: 'medium',
  showLineNumbers: true,
  showTOC: true,
  fontFamily: 'system',
  showHiddenFiles: false,
};

// ブラウザ環境かChrome拡張環境かを判定
const isExtensionEnvironment = (): boolean => {
  return typeof chrome !== 'undefined' && chrome.storage !== undefined;
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  if (isExtensionEnvironment()) {
    await chrome.storage.local.set({ [STORAGE_KEY]: settings });
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }
};

export const loadSettings = async (): Promise<AppSettings> => {
  try {
    let stored: Partial<AppSettings> | null = null;
    if (isExtensionEnvironment()) {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      stored = result[STORAGE_KEY] as Partial<AppSettings> | null;
    } else {
      const storedJson = localStorage.getItem(STORAGE_KEY);
      stored = storedJson ? (JSON.parse(storedJson) as Partial<AppSettings>) : null;
    }
    // デフォルト設定とマージして、新しいプロパティが欠けている場合に対応
    return stored ? { ...defaultSettings, ...stored } : defaultSettings;
  } catch {
    return defaultSettings;
  }
};

export const saveCustomTheme = async (theme: Theme): Promise<void> => {
  const settings = await loadSettings();
  const existingIndex = settings.customThemes.findIndex((t) => t.id === theme.id);

  if (existingIndex >= 0) {
    settings.customThemes[existingIndex] = theme;
  } else {
    settings.customThemes.push(theme);
  }

  await saveSettings(settings);
};

export const deleteCustomTheme = async (themeId: string): Promise<void> => {
  const settings = await loadSettings();
  settings.customThemes = settings.customThemes.filter((t) => t.id !== themeId);

  if (settings.currentThemeId === themeId) {
    settings.currentThemeId = defaultThemeId;
  }

  await saveSettings(settings);
};

export const exportTheme = (theme: Theme): string => {
  return JSON.stringify(theme, null, 2);
};

export const importTheme = (json: string): Theme | null => {
  try {
    const theme = JSON.parse(json) as Theme;
    // 必須フィールドの検証
    if (!theme.id || !theme.name || !theme.colors) {
      return null;
    }
    // IDを新規生成して重複を避ける
    theme.id = `custom-${Date.now()}`;
    return theme;
  } catch {
    return null;
  }
};
