import type { DirectoryInfo, FileInfo } from '../types';

const MARKDOWN_EXTENSIONS = ['.md', '.markdown', '.mdx', '.mkd'];

const isMarkdownFile = (name: string): boolean => {
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
  showHiddenFiles: boolean = false
): Promise<DirectoryInfo> => {
  const files: FileInfo[] = [];
  const directories: DirectoryInfo[] = [];

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
    if (entry.kind === 'file' && isMarkdownFile(entry.name)) {
      files.push({
        name: entry.name,
        path: `${handle.name}/${entry.name}`,
        handle: entry as FileSystemFileHandle,
      });
    } else if (entry.kind === 'directory' && (showHiddenFiles || !entry.name.startsWith('.'))) {
      const subDir = await readDirectory(entry as FileSystemDirectoryHandle, depth + 1, maxDepth, showHiddenFiles);
      // Markdownファイルを含むディレクトリのみ追加
      if (subDir.files.length > 0 || subDir.directories.length > 0) {
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
