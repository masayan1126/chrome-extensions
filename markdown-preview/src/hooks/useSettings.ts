import { useState, useEffect, useCallback } from 'react';
import type { AppSettings, Theme } from '../types';
import { loadSettings, saveSettings, defaultSettings } from '../utils/storage';
import { presetThemes, defaultThemeId } from '../themes/presets';

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const loaded = await loadSettings();
      setSettings(loaded);
      setIsLoading(false);
    };
    load();
  }, []);

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...updates };
      saveSettings(newSettings);
      return newSettings;
    });
  }, []);

  const getCurrentTheme = useCallback((): Theme => {
    const allThemes = [...presetThemes, ...settings.customThemes];
    return allThemes.find((t) => t.id === settings.currentThemeId) || presetThemes.find((t) => t.id === defaultThemeId)!;
  }, [settings.currentThemeId, settings.customThemes]);

  const setCurrentTheme = useCallback(
    (themeId: string) => {
      updateSettings({ currentThemeId: themeId });
    },
    [updateSettings]
  );

  const addCustomTheme = useCallback(
    (theme: Theme) => {
      const newThemes = [...settings.customThemes, theme];
      updateSettings({ customThemes: newThemes, currentThemeId: theme.id });
    },
    [settings.customThemes, updateSettings]
  );

  const updateCustomTheme = useCallback(
    (theme: Theme) => {
      const newThemes = settings.customThemes.map((t) => (t.id === theme.id ? theme : t));
      updateSettings({ customThemes: newThemes });
    },
    [settings.customThemes, updateSettings]
  );

  const deleteCustomTheme = useCallback(
    (themeId: string) => {
      const newThemes = settings.customThemes.filter((t) => t.id !== themeId);
      const updates: Partial<AppSettings> = { customThemes: newThemes };
      if (settings.currentThemeId === themeId) {
        updates.currentThemeId = defaultThemeId;
      }
      updateSettings(updates);
    },
    [settings.customThemes, settings.currentThemeId, updateSettings]
  );

  return {
    settings,
    isLoading,
    updateSettings,
    getCurrentTheme,
    setCurrentTheme,
    addCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
    allThemes: [...presetThemes, ...settings.customThemes],
  };
};
