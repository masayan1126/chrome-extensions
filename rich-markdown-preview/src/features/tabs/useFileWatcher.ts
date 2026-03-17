import { useCallback, useRef, useEffect } from 'react';
import type { OpenTab } from '../../shared/types';
import { readFileContent, getFileLastModified } from '../../shared/utils/fileSystem';

export const useFileWatcher = (
  tabs: OpenTab[],
  activeTabId: string | null,
  setTabs: React.Dispatch<React.SetStateAction<OpenTab[]>>
) => {
  const watchIntervalsRef = useRef<Map<string, number>>(new Map());
  const lastModifiedRef = useRef<Map<string, number>>(new Map());
  const tabsRef = useRef<OpenTab[]>([]);
  tabsRef.current = tabs;

  const startWatchingTab = useCallback((tabId: string) => {
    const existingInterval = watchIntervalsRef.current.get(tabId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    const interval = window.setInterval(async () => {
      try {
        const currentTab = tabsRef.current.find((t) => t.id === tabId);
        if (!currentTab?.file.handle) return;

        const lastModified = await getFileLastModified(currentTab.file.handle);
        const prevLastModified = lastModifiedRef.current.get(tabId) || 0;

        if (lastModified > prevLastModified) {
          const content = await readFileContent(currentTab.file.handle);
          setTabs((prev) =>
            prev.map((t) =>
              t.id === tabId ? { ...t, content } : t
            )
          );
          lastModifiedRef.current.set(tabId, lastModified);
        }
      } catch {
        // ファイルが削除された場合などは無視
      }
    }, 1000);

    watchIntervalsRef.current.set(tabId, interval);
  }, [setTabs]);

  const stopWatchingTab = useCallback((tabId: string) => {
    const interval = watchIntervalsRef.current.get(tabId);
    if (interval) {
      clearInterval(interval);
      watchIntervalsRef.current.delete(tabId);
    }
  }, []);

  // アクティブタブの監視
  useEffect(() => {
    if (activeTabId) {
      startWatchingTab(activeTabId);
      return () => stopWatchingTab(activeTabId);
    }
  }, [activeTabId, startWatchingTab, stopWatchingTab]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      watchIntervalsRef.current.forEach((interval) => clearInterval(interval));
      watchIntervalsRef.current.clear();
    };
  }, []);

  return { lastModifiedRef, watchIntervalsRef };
};
