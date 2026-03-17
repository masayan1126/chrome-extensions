import type { FileInfo, DirectoryInfo } from '../../shared/types';
import type { ContextMenuItem } from './ContextMenu';

export interface ContextMenuState {
  x: number;
  y: number;
  type: 'file' | 'directory';
  file?: FileInfo;
  directory?: DirectoryInfo;
}

export const getContextMenuItems = (
  contextMenu: ContextMenuState | null,
  onSelectFile: (file: FileInfo) => void,
  onToggleDirectory: (dir: DirectoryInfo) => void,
  copyToClipboard: (text: string) => void
): ContextMenuItem[] => {
  if (!contextMenu) return [];

  const items: ContextMenuItem[] = [];

  if (contextMenu.type === 'file' && contextMenu.file) {
    const file = contextMenu.file;
    items.push(
      {
        label: 'ファイルを開く',
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
          </svg>
        ),
        onClick: () => onSelectFile(file),
      },
      { label: '', onClick: () => {}, divider: true },
      {
        label: 'パスをコピー',
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
        ),
        onClick: () => copyToClipboard(file.path),
      },
      {
        label: 'ファイル名をコピー',
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
        onClick: () => copyToClipboard(file.name),
      }
    );
  }

  if (contextMenu.type === 'directory' && contextMenu.directory) {
    const dir = contextMenu.directory;
    items.push(
      {
        label: 'フォルダ名をコピー',
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        ),
        onClick: () => copyToClipboard(dir.name),
      },
      { label: '', onClick: () => {}, divider: true },
      {
        label: dir.isExpanded ? 'フォルダを閉じる' : 'フォルダを開く',
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={dir.isExpanded ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
          </svg>
        ),
        onClick: () => onToggleDirectory(dir),
      }
    );
  }

  return items;
};
