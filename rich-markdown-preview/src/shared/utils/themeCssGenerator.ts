import type { Theme } from '../types';
import { safeColor, ensureBoldContrast } from './colorUtils';

export const generateThemeCSS = (theme: Theme): string => {
  const c = theme.colors;
  const fb = theme.isDark ? '#1a1a2e' : '#ffffff'; // fallback background
  const ft = theme.isDark ? '#eaeaea' : '#333333'; // fallback text
  const fl = theme.isDark ? '#64b5f6' : '#1976d2'; // fallback link
  const boldColor = ensureBoldContrast(c.bold, c.text, theme.isDark);

  return `
    .rich-markdown-preview {
      background-color: ${safeColor(c.background, fb)};
      color: ${safeColor(c.text, ft)};
    }

    .rich-markdown-preview h1 { color: ${safeColor(c.h1, ft)}; }
    .rich-markdown-preview h2 { color: ${safeColor(c.h2, ft)}; border-bottom-color: ${safeColor(c.h2, ft)}40; }
    .rich-markdown-preview h3 { color: ${safeColor(c.h3, ft)}; border-left-color: ${safeColor(c.h3, ft)}; }
    .rich-markdown-preview h4 { color: ${safeColor(c.h4, ft)}; }
    .rich-markdown-preview h5 { color: ${safeColor(c.h5, ft)}; }
    .rich-markdown-preview h6 { color: ${safeColor(c.h6, ft)}; }

    .rich-markdown-preview a { color: ${safeColor(c.link, fl)}; }
    .rich-markdown-preview a:hover { color: ${safeColor(c.linkHover, fl)}; }

    .rich-markdown-preview pre {
      background-color: ${safeColor(c.codeBackground, fb)};
      color: ${safeColor(c.codeText, ft)};
    }

    .rich-markdown-preview code:not(pre code) {
      background-color: ${safeColor(c.inlineCodeBackground, fb)};
      color: ${safeColor(c.inlineCodeText, ft)};
    }

    .rich-markdown-preview blockquote {
      border-left-color: ${safeColor(c.blockquoteBorder, fl)};
      color: ${safeColor(c.blockquoteText, ft)};
      background-color: ${safeColor(c.blockquoteBackground, fb)};
    }

    .rich-markdown-preview ul > li::marker,
    .rich-markdown-preview ol > li::marker {
      color: ${safeColor(c.listMarker, fl)};
    }

    .rich-markdown-preview table {
      border-color: ${safeColor(c.tableBorder, ft)};
    }

    .rich-markdown-preview th {
      background-color: ${safeColor(c.tableHeaderBackground, fb)};
      border-color: ${safeColor(c.tableBorder, ft)};
    }

    .rich-markdown-preview td {
      border-color: ${safeColor(c.tableBorder, ft)};
    }

    .rich-markdown-preview tr:nth-child(even) {
      background-color: ${safeColor(c.tableRowEvenBackground, fb)};
    }

    .rich-markdown-preview hr {
      background-color: ${safeColor(c.horizontalRule, ft)};
      border-color: ${safeColor(c.horizontalRule, ft)};
    }

    .rich-markdown-preview strong, .rich-markdown-preview b {
      color: ${safeColor(boldColor, ft)};
    }

    .rich-markdown-preview em, .rich-markdown-preview i {
      color: ${safeColor(c.italic, ft)};
    }

    .rich-markdown-preview .task-list-item input[type="checkbox"] {
      accent-color: ${safeColor(c.link, fl)};
    }

    .rich-markdown-preview .footnote-ref a {
      color: ${safeColor(c.link, fl)};
    }

    .rich-markdown-preview .footnote-backref {
      color: ${safeColor(c.link, fl)};
    }
  `;
};
