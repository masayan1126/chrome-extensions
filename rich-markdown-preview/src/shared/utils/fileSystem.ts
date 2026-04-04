import type { FileInfo } from '../types';

const MARKDOWN_EXTENSIONS = ['.md', '.markdown', '.mdx', '.mkd'];

// path から直親ディレクトリ名を導出する（同名ファイルのタブラベル表示用）
// サイドバー経由: "rootDir/subDir/file.md" → "subDir"
// D&D 経由: ファイル名のみのため undefined を返す
export const getDirName = (file: FileInfo): string | undefined => {
  const parts = file.path.split('/');
  return parts.length >= 2 ? parts[parts.length - 2] : undefined;
};

// ファイル名のサニタイズ（Unicodeの方向制御文字や制御文字を除去）
export const sanitizeFileName = (name: string): string => {
  return name.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069\u0000-\u001F]/g, '');
};

export const isMarkdownFile = (name: string): boolean => {
  const lowerName = name.toLowerCase();
  return MARKDOWN_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
};

export const selectDirectory = async (): Promise<FileSystemDirectoryHandle | null> => {
  try {
    const handle = await window.showDirectoryPicker({
      mode: 'read',
    });
    return handle;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return null;
    }
    throw error;
  }
};

export { readDirectory } from './directoryReader';

export const readFileContent = async (handle: FileSystemFileHandle): Promise<string> => {
  const file = await handle.getFile();
  return await file.text();
};

export const getFileLastModified = async (handle: FileSystemFileHandle): Promise<number> => {
  const file = await handle.getFile();
  return file.lastModified;
};
