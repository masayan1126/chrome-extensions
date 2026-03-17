import type { AppSettings } from '../../shared/types';
import { defaultThemeId } from './presets';

const STORAGE_KEY = 'rich-markdown-preview-settings';

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
