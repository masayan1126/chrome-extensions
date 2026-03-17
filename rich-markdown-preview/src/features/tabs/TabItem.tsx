import React from 'react';
import type { OpenTab } from '../../shared/types';
import { sanitizeFileName } from '../../shared/utils/fileSystem';

interface TabItemProps {
  tab: OpenTab;
  isActive: boolean;
  isDragOver: boolean;
  isDragged: boolean;
  draggedTabRef: React.RefObject<HTMLDivElement | null>;
  onSelect: () => void;
  onClose: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}

export const TabItem: React.FC<TabItemProps> = ({
  tab, isActive, isDragOver, isDragged, draggedTabRef,
  onSelect, onClose, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop,
}) => {
  return (
    <div
      ref={isDragged ? draggedTabRef : null}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onSelect}
      className={`
        group flex items-center gap-2 px-3 h-full cursor-pointer select-none
        border-r border-neutral-700 min-w-32 max-w-48
        transition-colors duration-150
        ${isActive ? 'bg-neutral-900 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-750 hover:text-neutral-200'}
        ${isDragOver ? 'border-l-2 border-l-blue-500' : ''}
      `}
    >
      <svg className="w-4 h-4 flex-shrink-0 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="text-sm truncate flex-1" title={sanitizeFileName(tab.file.name)}>
        {tab.isDirty && <span className="text-orange-400 mr-1">*</span>}
        {sanitizeFileName(tab.file.name)}
      </span>
      <button
        onClick={onClose}
        className={`p-0.5 rounded hover:bg-neutral-600 flex-shrink-0 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-150`}
        title="閉じる"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
