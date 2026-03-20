export interface ThemeColors {
  // 基本色
  background: string;
  text: string;

  // 見出し
  h1: string;
  h2: string;
  h3: string;
  h4: string;
  h5: string;
  h6: string;

  // リンク
  link: string;
  linkHover: string;

  // コードブロック
  codeBackground: string;
  codeText: string;
  inlineCodeBackground: string;
  inlineCodeText: string;

  // 引用
  blockquoteBorder: string;
  blockquoteText: string;
  blockquoteBackground: string;

  // リスト
  listMarker: string;

  // テーブル
  tableBorder: string;
  tableHeaderBackground: string;
  tableRowEvenBackground: string;

  // その他
  horizontalRule: string;
  bold: string;
  italic: string;
}

export interface Theme {
  id: string;
  name: string;
  isDark: boolean;
  colors: ThemeColors;
}

export interface FileInfo {
  name: string;
  path: string;
  handle: FileSystemFileHandle | null;
  isMarkdown?: boolean;
}

export interface DirectoryInfo {
  name: string;
  handle: FileSystemDirectoryHandle;
  files: FileInfo[];
  directories: DirectoryInfo[];
  isExpanded: boolean;
}

export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export type FontFamily =
  | 'system'
  | 'noto-sans-jp'
  | 'noto-serif-jp'
  | 'zen-kaku-gothic'
  | 'zen-maru-gothic'
  | 'm-plus-rounded';

export interface AppSettings {
  currentThemeId: string;
  customThemes: Theme[];
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  contentWidth: 'narrow' | 'medium' | 'wide' | 'full';
  showLineNumbers: boolean;
  showTOC: boolean;
  fontFamily: FontFamily;
  showHiddenFiles: boolean;
}

export interface OpenTab {
  id: string;
  file: FileInfo;
  content: string;
  isDirty: boolean;
}

/** コメントのアンカー情報 */
export interface CommentAnchor {
  selectedText: string;
  prefix: string;
  suffix: string;
  markdownLineStart: number;
  markdownLineEnd: number;
  nearestHeadingId: string | null;
  nearestHeadingText: string | null;
}

/** レビューコメント */
export interface ReviewComment {
  id: string;
  filePath: string;
  anchor: CommentAnchor;
  comment: string;
  type: 'modify' | 'delete' | 'add' | 'question';
  createdAt: string;
  updatedAt: string;
  resolved: boolean;
}
