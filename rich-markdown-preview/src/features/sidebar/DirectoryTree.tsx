import React from 'react';
import type { DirectoryInfo, FileInfo } from '../../shared/types';
import { sanitizeFileName } from '../../shared/utils/fileSystem';
import { FileIcon, FolderIcon, ChevronIcon } from './icons';

export const DirectoryTree: React.FC<{
  dir: DirectoryInfo;
  depth: number;
  selectedFile: FileInfo | null;
  onSelectFile: (file: FileInfo) => void;
  onToggleDirectory: (dir: DirectoryInfo) => void;
  onContextMenu: (e: React.MouseEvent, type: 'file' | 'directory', file?: FileInfo, directory?: DirectoryInfo) => void;
}> = React.memo(({ dir, depth, selectedFile, onSelectFile, onToggleDirectory, onContextMenu }) => {
  return (
    <div className="select-none">
      {depth > 0 && (
        <button
          onClick={() => onToggleDirectory(dir)}
          onContextMenu={(e) => onContextMenu(e, 'directory', undefined, dir)}
          className="flex items-center gap-1 px-2 py-1 w-full text-left hover:bg-neutral-700/50 rounded text-sm text-neutral-300"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <ChevronIcon isOpen={dir.isExpanded} />
          <FolderIcon isOpen={dir.isExpanded} />
          <span className="truncate">{sanitizeFileName(dir.name)}</span>
        </button>
      )}

      {dir.isExpanded && (
        <>
          {dir.directories.map((subDir) => (
            <DirectoryTree
              key={subDir.name}
              dir={subDir}
              depth={depth + 1}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
              onToggleDirectory={onToggleDirectory}
              onContextMenu={onContextMenu}
            />
          ))}
          {dir.files.map((file) => {
            const isMarkdown = file.isMarkdown !== false;
            return (
              <button
                key={file.path}
                onClick={isMarkdown ? () => onSelectFile(file) : undefined}
                onContextMenu={(e) => onContextMenu(e, 'file', file, undefined)}
                className={`flex items-center gap-2 px-2 py-1 w-full text-left text-sm rounded transition-colors ${
                  !isMarkdown
                    ? 'text-neutral-500 cursor-default'
                    : selectedFile?.path === file.path
                      ? 'bg-neutral-600 text-white'
                      : 'hover:bg-neutral-700/50 text-neutral-300'
                }`}
                style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
              >
                <FileIcon isMarkdown={isMarkdown} />
                <span className="truncate">{sanitizeFileName(file.name)}</span>
              </button>
            );
          })}
        </>
      )}
    </div>
  );
});
