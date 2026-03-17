import { useState, useEffect, useCallback, useMemo } from 'react';
import type { AppSettings, Theme } from '../../shared/types';
import { loadSettings, saveSettings, defaultSettings } from './settingsStorage';
import { presetThemes, defaultThemeId } from './presets';

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
    let newSettings: AppSettings | null = null;
    setSettings((prev) => {
      newSettings = { ...prev, ...updates };
      return newSettings;
    });
    if (newSettings) {
      try {
        await saveSettings(newSettings);
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    }
  }, []);

  const allThemes = useMemo(
    () => [...presetThemes, ...settings.customThemes],
    [settings.customThemes]
  );

  const currentTheme = useMemo(() => {
    return allThemes.find((t) => t.id === settings.currentThemeId)
      || presetThemes.find((t) => t.id === defaultThemeId)
      || presetThemes[0];
  }, [allThemes, settings.currentThemeId]);

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
    currentTheme,
    setCurrentTheme,
    addCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
    allThemes,
  };
};
