import type { DirectoryInfo, FileInfo } from '../types';
import { isMarkdownFile } from './fileSystem';

export const readDirectory = async (
  handle: FileSystemDirectoryHandle,
  depth: number = 0,
  maxDepth: number = 5,
  showHiddenFiles: boolean = false,
  isInsideHiddenDir: boolean = false,
  parentPath: string = ''
): Promise<DirectoryInfo> => {
  const files: FileInfo[] = [];
  const directories: DirectoryInfo[] = [];
  const currentPath = parentPath ? `${parentPath}/${handle.name}` : handle.name;

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

      if (showAllContents || isMd) {
        if (!showHiddenFiles && entry.name.startsWith('.')) {
          continue;
        }
        files.push({
          name: entry.name,
          path: `${currentPath}/${entry.name}`,
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
        childInsideHidden,
        currentPath
      );

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
