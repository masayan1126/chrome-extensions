import { useState, useCallback } from 'react';
import type { FileInfo } from '../types';
import { isMarkdownFile } from '../utils/fileSystem';

export const useDragDrop = (
  openTab: (file: FileInfo) => void,
  openDroppedFile: (file: File) => void
) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const items = Array.from(e.dataTransfer.items);
    for (const item of items) {
      if (item.kind !== 'file') continue;

      // FileSystemFileHandle を取得して監視可能にする
      if ('getAsFileSystemHandle' in item) {
        try {
          const handle = await (item as DataTransferItem & { getAsFileSystemHandle(): Promise<FileSystemHandle> }).getAsFileSystemHandle();
          if (handle && handle.kind === 'file') {
            const fileHandle = handle as FileSystemFileHandle;
            if (isMarkdownFile(fileHandle.name)) {
              openTab({
                name: fileHandle.name,
                path: fileHandle.name,
                handle: fileHandle,
              });
              continue;
            }
          }
        } catch (error) {
          // getAsFileSystemHandle が未対応またはアクセス拒否の場合はフォールバック
          console.warn('getAsFileSystemHandle failed, falling back to File API:', error);
        }
      }

      // フォールバック: ハンドルなしで読み込み（ファイル変更の自動検知は不可）
      const file = item.getAsFile();
      if (file && isMarkdownFile(file.name)) {
        openDroppedFile(file);
      }
    }
  }, [openTab, openDroppedFile]);

  return {
    isDragOver,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
};
