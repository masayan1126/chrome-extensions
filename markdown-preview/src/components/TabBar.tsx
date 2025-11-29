import React, { useState, useRef } from 'react';
import type { OpenTab } from '../types';

interface TabBarProps {
  tabs: OpenTab[];
  activeTabId: string | null;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onReorderTabs: (tabs: OpenTab[]) => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onReorderTabs,
}) => {
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null);
  const draggedTabRef = useRef<HTMLDivElement | null>(null);

  if (tabs.length === 0) return null;

  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTabId(tabId);
    e.dataTransfer.effectAllowed = 'move';
    // ドラッグ中のタブを半透明に
    if (draggedTabRef.current) {
      draggedTabRef.current.style.opacity = '0.5';
    }
  };

  const handleDragEnd = () => {
    setDraggedTabId(null);
    setDragOverTabId(null);
    if (draggedTabRef.current) {
      draggedTabRef.current.style.opacity = '1';
    }
  };

  const handleDragOver = (e: React.DragEvent, tabId: string) => {
    e.preventDefault();
    if (draggedTabId && draggedTabId !== tabId) {
      setDragOverTabId(tabId);
    }
  };

  const handleDragLeave = () => {
    setDragOverTabId(null);
  };

  const handleDrop = (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();
    if (!draggedTabId || draggedTabId === targetTabId) return;

    const newTabs = [...tabs];
    const draggedIndex = newTabs.findIndex((t) => t.id === draggedTabId);
    const targetIndex = newTabs.findIndex((t) => t.id === targetTabId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedTab] = newTabs.splice(draggedIndex, 1);
      newTabs.splice(targetIndex, 0, draggedTab);
      onReorderTabs(newTabs);
    }

    setDraggedTabId(null);
    setDragOverTabId(null);
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    onCloseTab(tabId);
  };

  return (
    <div className="h-9 bg-neutral-800 border-b border-neutral-700 flex items-center overflow-x-auto">
      <div className="flex items-center h-full">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            ref={tab.id === draggedTabId ? draggedTabRef : null}
            draggable
            onDragStart={(e) => handleDragStart(e, tab.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, tab.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, tab.id)}
            onClick={() => onSelectTab(tab.id)}
            className={`
              group flex items-center gap-2 px-3 h-full cursor-pointer select-none
              border-r border-neutral-700 min-w-32 max-w-48
              transition-colors duration-150
              ${
                tab.id === activeTabId
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-750 hover:text-neutral-200'
              }
              ${dragOverTabId === tab.id ? 'border-l-2 border-l-blue-500' : ''}
            `}
          >
            <svg
              className="w-4 h-4 flex-shrink-0 text-neutral-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-sm truncate flex-1" title={tab.file.name}>
              {tab.isDirty && <span className="text-orange-400 mr-1">*</span>}
              {tab.file.name}
            </span>
            <button
              onClick={(e) => handleCloseTab(e, tab.id)}
              className={`
                p-0.5 rounded hover:bg-neutral-600 flex-shrink-0
                ${tab.id === activeTabId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                transition-opacity duration-150
              `}
              title="閉じる"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
