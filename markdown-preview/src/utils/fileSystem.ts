import type { DirectoryInfo, FileInfo } from '../types';

const MARKDOWN_EXTENSIONS = ['.md', '.markdown', '.mdx', '.mkd'];

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
    // ユーザーがキャンセルした場合
    if (error instanceof DOMException && error.name === 'AbortError') {
      return null;
    }
    throw error;
  }
};

export const readDirectory = async (
  handle: FileSystemDirectoryHandle,
  depth: number = 0,
  maxDepth: number = 5,
  showHiddenFiles: boolean = false,
  isInsideHiddenDir: boolean = false
): Promise<DirectoryInfo> => {
  const files: FileInfo[] = [];
  const directories: DirectoryInfo[] = [];

  // 隠しディレクトリ内かつshowHiddenFiles時はすべてのファイル・ディレクトリを表示
  const showAllContents = showHiddenFiles && isInsideHiddenDir;

  if (depth >= maxDepth) {
    return {
      name: handle.name,
      handle,
      files,
      directories,
      isExpanded: depth === 0,
    };
  }

  for await (const entry of handle.values()) {
    if (entry.kind === 'file') {
      const isMd = isMarkdownFile(entry.name);

      // 通常モード: マークダウンファイルのみ表示
      // 隠しディレクトリ内: すべてのファイルを表示
      if (showAllContents || isMd) {
        // showHiddenFilesがfalseの場合、ドットで始まるファイルはスキップ
        if (!showHiddenFiles && entry.name.startsWith('.')) {
          continue;
        }
        files.push({
          name: entry.name,
          path: `${handle.name}/${entry.name}`,
          handle: entry as FileSystemFileHandle,
          isMarkdown: isMd,
        });
      }
    } else if (entry.kind === 'directory' && (showHiddenFiles || !entry.name.startsWith('.'))) {
      const isHiddenDir = entry.name.startsWith('.');
      const childInsideHidden = isInsideHiddenDir || isHiddenDir;
      const subDir = await readDirectory(
        entry as FileSystemDirectoryHandle,
        depth + 1,
        maxDepth,
        showHiddenFiles,
        childInsideHidden
      );

      // 隠しディレクトリ内: すべてのサブディレクトリを表示
      // 隠しディレクトリ自体: showHiddenFiles時に常に表示
      // それ以外: コンテンツを含む場合のみ
      if (showAllContents || subDir.files.length > 0 || subDir.directories.length > 0 || (isHiddenDir && showHiddenFiles)) {
        directories.push(subDir);
      }
    }
  }

  // 名前でソート
  files.sort((a, b) => a.name.localeCompare(b.name));
  directories.sort((a, b) => a.name.localeCompare(b.name));

  return {
    name: handle.name,
    handle,
    files,
    directories,
    isExpanded: depth === 0,
  };
};

export const readFileContent = async (handle: FileSystemFileHandle): Promise<string> => {
  const file = await handle.getFile();
  return await file.text();
};

export const getFileLastModified = async (handle: FileSystemFileHandle): Promise<number> => {
  const file = await handle.getFile();
  return file.lastModified;
};
