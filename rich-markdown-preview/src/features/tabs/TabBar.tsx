import React from 'react';
import type { OpenTab } from '../../shared/types';
import { useTabDrag } from './useTabDrag';
import { TabItem } from './TabItem';

interface TabBarProps {
  tabs: OpenTab[];
  activeTabId: string | null;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onReorderTabs: (tabs: OpenTab[]) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ tabs, activeTabId, onSelectTab, onCloseTab, onReorderTabs }) => {
  const drag = useTabDrag(onReorderTabs);

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
