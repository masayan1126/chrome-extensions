import type { ThemeColors } from '../types';

export const createDefaultThemeColors = (isDark: boolean): ThemeColors => {
  if (isDark) {
    return {
      background: '#1a1a2e',
      text: '#eaeaea',
      h1: '#4fc3f7',
      h2: '#81d4fa',
      h3: '#80cbc4',
      h4: '#a5d6a7',
      h5: '#ce93d8',
      h6: '#ffab91',
      link: '#64b5f6',
      linkHover: '#42a5f5',
      codeBackground: '#0f0f1a',
      codeText: '#eaeaea',
      inlineCodeBackground: '#2d2d44',
      inlineCodeText: '#f48fb1',
      blockquoteBorder: '#4fc3f7',
      blockquoteText: '#b0b0b0',
      blockquoteBackground: '#0f0f1a',
      listMarker: '#4fc3f7',
      tableBorder: '#333355',
      tableHeaderBackground: '#0f0f1a',
      tableRowEvenBackground: '#1e1e36',
      horizontalRule: '#333355',
      bold: '#ffffff',
      italic: '#eaeaea',
    };
  }

  return {
    background: '#ffffff',
    text: '#333333',
    h1: '#1976d2',
    h2: '#1e88e5',
    h3: '#43a047',
    h4: '#fb8c00',
    h5: '#8e24aa',
    h6: '#5d4037',
    link: '#1976d2',
    linkHover: '#1565c0',
    codeBackground: '#f5f5f5',
    codeText: '#333333',
    inlineCodeBackground: '#e8e8e8',
    inlineCodeText: '#c62828',
    blockquoteBorder: '#1976d2',
    blockquoteText: '#666666',
    blockquoteBackground: '#f5f5f5',
    listMarker: '#1976d2',
    tableBorder: '#dddddd',
    tableHeaderBackground: '#f5f5f5',
    tableRowEvenBackground: '#fafafa',
    horizontalRule: '#dddddd',
    bold: '#111111',
    italic: '#333333',
  };
};
