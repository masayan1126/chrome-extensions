import { useCallback } from 'react';
import type { Theme, FontFamily } from './shared/types';

interface AppHandlersParams {
  updateSettings: (settings: Partial<{ fontSize: number; fontFamily: FontFamily; lineHeight: number; letterSpacing: number }>) => void;
  customThemes: Theme[];
  addCustomTheme: (theme: Theme) => void;
  updateCustomTheme: (theme: Theme) => void;
}

export const useAppHandlers = ({
  updateSettings,
  customThemes,
  addCustomTheme,
  updateCustomTheme,
}: AppHandlersParams) => {
  const handleFontSizeChange = useCallback(
    (size: number) => { updateSettings({ fontSize: size }); },
    [updateSettings]
  );

  const handleFontFamilyChange = useCallback(
    (fontFamily: FontFamily) => { updateSettings({ fontFamily }); },
    [updateSettings]
  );

  const handleLineHeightChange = useCallback(
    (lineHeight: number) => { updateSettings({ lineHeight }); },
    [updateSettings]
  );

  const handleLetterSpacingChange = useCallback(
    (letterSpacing: number) => { updateSettings({ letterSpacing }); },
    [updateSettings]
  );

  const handleSaveCustomTheme = useCallback(
    (theme: Theme) => {
      const existingTheme = customThemes.find((t) => t.id === theme.id);
      if (existingTheme) {
        updateCustomTheme(theme);
      } else {
        addCustomTheme(theme);
      }
    },
    [customThemes, addCustomTheme, updateCustomTheme]
  );

  return {
    handleFontSizeChange,
    handleFontFamilyChange,
    handleLineHeightChange,
    handleLetterSpacingChange,
    handleSaveCustomTheme,
  };
};
