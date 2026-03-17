import React, { useState, useCallback } from 'react';
import type { DirectoryInfo, FileInfo } from '../../shared/types';
import { ContextMenu } from './ContextMenu';
import { DirectoryTree } from './DirectoryTree';
import { getContextMenuItems, type ContextMenuState } from './contextMenuItems';

interface SidebarProps {
  directory: DirectoryInfo | null;
  selectedFile: FileInfo | null;
  onSelectFile: (file: FileInfo) => void;
  onToggleDirectory: (dir: DirectoryInfo) => void;
  onOpenDirectory: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  canRestore?: boolean;
  onRestore?: () => void;
  showHiddenFiles?: boolean;
  onToggleHiddenFiles?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  directory, selectedFile, onSelectFile, onToggleDirectory,
  onOpenDirectory, onRefresh, isLoading, canRestore, onRestore,
  showHiddenFiles, onToggleHiddenFiles,
}) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, type: 'file' | 'directory', file?: FileInfo, dir?: DirectoryInfo) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, type, file, directory: dir });
    }, []
  );

  const closeContextMenu = useCallback(() => { setContextMenu(null); }, []);

  const copyToClipboard = useCallback(async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch (err) { console.error('Failed to copy:', err); }
  }, []);

  const menuItems = getContextMenuItems(contextMenu, onSelectFile, onToggleDirectory, copyToClipboard);

  return (
    <div className="w-64 bg-neutral-800 border-r border-neutral-700 flex flex-col h-full">
      <div className="p-3 border-b border-neutral-700">
        <div className="flex gap-2">
          <button onClick={onOpenDirectory} disabled={isLoading} className="flex-1 px-3 py-2 bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 disabled:cursor-not-allowed text-white text-sm rounded transition-colors">
            {isLoading ? '読み込み中...' : 'フォルダを開く'}
          </button>
          {directory && (
            <>
              <button onClick={onRefresh} disabled={isLoading} className="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 disabled:cursor-not-allowed text-white text-sm rounded transition-colors" title="更新">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              {onToggleHiddenFiles && (
                <button onClick={onToggleHiddenFiles} className={`px-3 py-2 text-sm rounded transition-colors ${showHiddenFiles ? 'bg-neutral-600 text-white' : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-400'}`} title={showHiddenFiles ? '隠しファイルを非表示' : '隠しファイルを表示'}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showHiddenFiles ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.05 6.05m7.875 7.875l3.83 3.83M3 3l18 18" />
                    )}
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {directory ? (
          <DirectoryTree dir={directory} depth={0} selectedFile={selectedFile} onSelectFile={onSelectFile} onToggleDirectory={onToggleDirectory} onContextMenu={handleContextMenu} />
        ) : (
          <div className="text-neutral-500 text-sm text-center py-8">
            {canRestore && onRestore ? (
              <div className="space-y-3">
                <p>前回のフォルダを復元できます</p>
                <button onClick={onRestore} disabled={isLoading} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 text-white rounded transition-colors">
                  {isLoading ? '復元中...' : '復元する'}
                </button>
              </div>
            ) : ('フォルダを選択してください')}
          </div>
        )}
      </div>

      {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} items={menuItems} onClose={closeContextMenu} />}
    </div>
  );
};
