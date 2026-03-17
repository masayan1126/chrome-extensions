import { useState, useCallback } from 'react';
import type { OpenTab } from '../../shared/types';
import { useFileWatcher } from './useFileWatcher';
import { useTabRestore } from './useTabRestore';
import { useTabOpen } from './useTabOpen';

export const useTabs = () => {
  const [tabs, setTabs] = useState<OpenTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) || null;
  const activeContent = activeTab?.content || '';
  const activeFile = activeTab?.file || null;

  const { lastModifiedRef, watchIntervalsRef } = useFileWatcher(tabs, activeTabId, setTabs);
  const { isInitialized } = useTabRestore(setTabs, setActiveTabId, tabs, activeTabId, lastModifiedRef);
  const { openTab, openDroppedFile, updateTabsRef } = useTabOpen(setTabs, setActiveTabId, lastModifiedRef);

  // tabsRefを常に最新に保つ
  updateTabsRef(tabs);

  const closeTab = useCallback((tabId: string) => {
    setTabs((prev) => {
      const index = prev.findIndex((t) => t.id === tabId);
      if (index === -1) return prev;

      const newTabs = prev.filter((t) => t.id !== tabId);

      if (tabId === activeTabId && newTabs.length > 0) {
        const newIndex = Math.min(index, newTabs.length - 1);
        setActiveTabId(newTabs[newIndex].id);
      } else if (newTabs.length === 0) {
        setActiveTabId(null);
      }

      const interval = watchIntervalsRef.current.get(tabId);
      if (interval) {
        clearInterval(interval);
        watchIntervalsRef.current.delete(tabId);
      }
      lastModifiedRef.current.delete(tabId);

      return newTabs;
    });
  }, [activeTabId, watchIntervalsRef, lastModifiedRef]);

  const selectTab = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  const reorderTabs = useCallback((newTabs: OpenTab[]) => {
    setTabs(newTabs);
  }, []);

  return {
    tabs, activeTabId, activeTab, activeContent, activeFile,
    isInitialized, openTab, openDroppedFile, closeTab, selectTab, reorderTabs,
  };
};
