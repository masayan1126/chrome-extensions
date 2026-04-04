import React, { useMemo } from 'react';
import type { OpenTab } from '../../shared/types';
import { useTabDrag } from './useTabDrag';
import { TabItem } from './TabItem';
import { sanitizeFileName, getDirName } from '../../shared/utils/fileSystem';

interface TabBarProps {
  tabs: OpenTab[];
  activeTabId: string | null;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onReorderTabs: (tabs: OpenTab[]) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ tabs, activeTabId, onSelectTab, onCloseTab, onReorderTabs }) => {
  const drag = useTabDrag(onReorderTabs);

  // 同名ファイルが複数タブで開かれているファイル名のセットを計算
  const duplicateNames = useMemo(() => {
    const nameCounts = new Map<string, number>();
    tabs.forEach((tab) => {
      nameCounts.set(tab.file.name, (nameCounts.get(tab.file.name) ?? 0) + 1);
    });
    return new Set(
      Array.from(nameCounts.entries())
        .filter(([, count]) => count > 1)
        .map(([name]) => name)
    );
  }, [tabs]);

  const getDisplayLabel = (tab: OpenTab): string => {
    if (!duplicateNames.has(tab.file.name)) {
      return sanitizeFileName(tab.file.name);
    }
    const dirName = getDirName(tab.file);
    if (dirName) {
      return sanitizeFileName(`${dirName}/${tab.file.name}`);
    }
    return sanitizeFileName(tab.file.name);
  };

  if (tabs.length === 0) return null;

  return (
    <div className="h-9 bg-neutral-800 border-b border-neutral-700 flex items-center overflow-x-auto">
      <div className="flex items-center h-full">
        {tabs.map((tab) => (
          <TabItem
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            isDragOver={drag.dragOverTabId === tab.id}
            isDragged={tab.id === drag.draggedTabId}
            draggedTabRef={drag.draggedTabRef}
            displayLabel={getDisplayLabel(tab)}
            onSelect={() => onSelectTab(tab.id)}
            onClose={(e) => { e.stopPropagation(); onCloseTab(tab.id); }}
            onDragStart={(e) => drag.handleDragStart(e, tab.id)}
            onDragEnd={drag.handleDragEnd}
            onDragOver={(e) => drag.handleDragOver(e, tab.id)}
            onDragLeave={drag.handleDragLeave}
            onDrop={(e) => drag.handleDrop(e, tab.id, tabs)}
          />
        ))}
      </div>
    </div>
  );
};
