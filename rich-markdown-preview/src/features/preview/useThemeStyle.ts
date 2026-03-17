import { useMemo, useEffect, useRef } from 'react';
import type { Theme, FontFamily } from '../../shared/types';
import { generateThemeCSS } from '../../shared/utils/themeStyles';
import { getFontOption, loadGoogleFont } from '../../shared/utils/fonts';

export const useThemeStyle = (theme: Theme, fontFamily: FontFamily) => {
  const styleRef = useRef<HTMLStyleElement | null>(null);

  const fontOption = useMemo(() => getFontOption(fontFamily), [fontFamily]);

  useEffect(() => {
    loadGoogleFont(fontOption);
  }, [fontOption]);

  useEffect(() => {
    const css = generateThemeCSS(theme);

    if (!styleRef.current) {
      styleRef.current = document.createElement('style');
      document.head.appendChild(styleRef.current);
    }
    styleRef.current.textContent = css;

    return () => {
      if (styleRef.current) {
        document.head.removeChild(styleRef.current);
        styleRef.current = null;
      }
    };
  }, [theme]);

  return { fontOption };
};
