import type { FontFamily } from '../types';

export interface FontOption {
  id: FontFamily;
  name: string;
  fontFamily: string;
  googleFont?: string;
}

export const fontOptions: FontOption[] = [
  {
    id: 'system',
    name: 'システムデフォルト',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  },
  {
    id: 'noto-sans-jp',
    name: 'Noto Sans JP',
    fontFamily: '"Noto Sans JP", sans-serif',
    googleFont: 'Noto+Sans+JP:wght@400;500;700',
  },
  {
    id: 'noto-serif-jp',
    name: 'Noto Serif JP',
    fontFamily: '"Noto Serif JP", serif',
    googleFont: 'Noto+Serif+JP:wght@400;500;700',
  },
  {
    id: 'zen-kaku-gothic',
    name: 'Zen Kaku Gothic New',
    fontFamily: '"Zen Kaku Gothic New", sans-serif',
    googleFont: 'Zen+Kaku+Gothic+New:wght@400;500;700',
  },
  {
    id: 'zen-maru-gothic',
    name: 'Zen Maru Gothic',
    fontFamily: '"Zen Maru Gothic", sans-serif',
    googleFont: 'Zen+Maru+Gothic:wght@400;500;700',
  },
  {
    id: 'm-plus-rounded',
    name: 'M PLUS Rounded 1c',
    fontFamily: '"M PLUS Rounded 1c", sans-serif',
    googleFont: 'M+PLUS+Rounded+1c:wght@400;500;700',
  },
];

export const getFontOption = (id: FontFamily): FontOption => {
  return fontOptions.find((f) => f.id === id) || fontOptions[0];
};

export const loadGoogleFont = (fontOption: FontOption): void => {
  if (!fontOption.googleFont) return;

  const linkId = `google-font-${fontOption.id}`;
  if (document.getElementById(linkId)) return;

  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontOption.googleFont)}&display=swap`;
  document.head.appendChild(link);
};
