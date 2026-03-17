import type { ThemeColors } from '../../shared/types';

export type ColorKey = keyof ThemeColors;

export const colorLabels: Record<ColorKey, string> = {
  background: '背景色',
  text: 'テキスト',
  h1: '見出し1 (H1)',
  h2: '見出し2 (H2)',
  h3: '見出し3 (H3)',
  h4: '見出し4 (H4)',
  h5: '見出し5 (H5)',
  h6: '見出し6 (H6)',
  link: 'リンク',
  linkHover: 'リンク(ホバー)',
  codeBackground: 'コードブロック背景',
  codeText: 'コードブロック文字',
  inlineCodeBackground: 'インラインコード背景',
  inlineCodeText: 'インラインコード文字',
  blockquoteBorder: '引用ボーダー',
  blockquoteText: '引用テキスト',
  blockquoteBackground: '引用背景',
  listMarker: 'リストマーカー',
  tableBorder: 'テーブルボーダー',
  tableHeaderBackground: 'テーブルヘッダー背景',
  tableRowEvenBackground: 'テーブル偶数行背景',
  horizontalRule: '水平線',
  bold: '太字',
  italic: '斜体',
};

export const colorGroups: { title: string; keys: ColorKey[] }[] = [
  { title: '一括設定', keys: [] },
  { title: '基本', keys: ['background', 'text'] },
  { title: '見出し', keys: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] },
  { title: 'リンク', keys: ['link', 'linkHover'] },
  { title: 'コード', keys: ['codeBackground', 'codeText', 'inlineCodeBackground', 'inlineCodeText'] },
  { title: '引用', keys: ['blockquoteBorder', 'blockquoteText', 'blockquoteBackground'] },
  { title: 'リスト・テーブル', keys: ['listMarker', 'tableBorder', 'tableHeaderBackground', 'tableRowEvenBackground'] },
  { title: 'その他', keys: ['horizontalRule', 'bold', 'italic'] },
];

// 一括設定で変更する対象のキー
export const accentColorKeys: ColorKey[] = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'link', 'linkHover',
  'blockquoteBorder',
  'listMarker',
  'bold', 'italic',
];

export const textColorKeys: ColorKey[] = [
  'text', 'blockquoteText', 'codeText', 'inlineCodeText',
];

export const backgroundColorKeys: ColorKey[] = [
  'codeBackground', 'inlineCodeBackground', 'blockquoteBackground',
  'tableHeaderBackground', 'tableRowEvenBackground',
];
