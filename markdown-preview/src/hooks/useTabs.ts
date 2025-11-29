import { useState, useCallback, useRef, useEffect } from 'react';
import type { OpenTab, FileInfo } from '../types';
import { readFileContent, getFileLastModified } from '../utils/fileSystem';
import { saveTabsToStorage, loadTabsFromStorage } from '../utils/tabStorage';

export const useTabs = () => {
  const [tabs, setTabs] = useState<OpenTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const watchIntervalsRef = useRef<Map<string, number>>(new Map());
  const lastModifiedRef = useRef<Map<string, number>>(new Map());

  const activeTab = tabs.find((t) => t.id === activeTabId) || null;
  const activeContent = activeTab?.content || '';
  const activeFile = activeTab?.file || null;

  // 初期化時にストレージからタブを復元
  useEffect(() => {
    const restoreTabs = async () => {
      try {
        const storedData = await loadTabsFromStorage();
        if (storedData && storedData.tabs.length > 0) {
          // ファイルの内容を読み込む
          const restoredTabs: OpenTab[] = [];
          for (const tab of storedData.tabs) {
            try {
              const content = await readFileContent(tab.file.handle);
              const lastModified = await getFileLastModified(tab.file.handle);
              restoredTabs.push({
                id: tab.id,
                file: tab.file,
                content,
                isDirty: false,
              });
              lastModifiedRef.current.set(tab.id, lastModified);
            } catch {
              console.warn(`Failed to read content for: ${tab.file.name}`);
            }
          }

          if (restoredTabs.length > 0) {
            setTabs(restoredTabs);
            const validActiveTabId = restoredTabs.some((t) => t.id === storedData.activeTabId)
              ? storedData.activeTabId
              : restoredTabs[0].id;
            setActiveTabId(validActiveTabId);
          }
        }
      } catch (error) {
        console.error('Failed to restore tabs:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    restoreTabs();
  }, []);

  // タブが変更されたらストレージに保存
  useEffect(() => {
    if (!isInitialized) return;

    const saveTabs = async () => {
      await saveTabsToStorage(
        tabs.map((tab) => ({ id: tab.id, file: tab.file })),
        activeTabId
      );
    };

    saveTabs();
  }, [tabs, activeTabId, isInitialized]);

  // タブを開く（既に開いていれば選択する）
  const openTab = useCallback(async (file: FileInfo) => {
    const existingTab = tabs.find((t) => t.file.path === file.path);

    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    try {
      const content = await readFileContent(file.handle);
      const lastModified = await getFileLastModified(file.handle);
      const newTab: OpenTab = {
        id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        content,
        isDirty: false,
      };

      lastModifiedRef.current.set(newTab.id, lastModified);
      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(newTab.id);
    } catch (error) {
      console.error('Failed to open tab:', error);
    }
  }, [tabs]);

  // タブを閉じる
  const closeTab = useCallback((tabId: string) => {
    setTabs((prev) => {
      const index = prev.findIndex((t) => t.id === tabId);
      if (index === -1) return prev;

      const newTabs = prev.filter((t) => t.id !== tabId);

      // アクティブタブを閉じた場合、隣のタブを選択
      if (tabId === activeTabId && newTabs.length > 0) {
        const newIndex = Math.min(index, newTabs.length - 1);
        setActiveTabId(newTabs[newIndex].id);
      } else if (newTabs.length === 0) {
        setActiveTabId(null);
      }

      // 監視を停止
      const interval = watchIntervalsRef.current.get(tabId);
      if (interval) {
        clearInterval(interval);
        watchIntervalsRef.current.delete(tabId);
      }
      lastModifiedRef.current.delete(tabId);

      return newTabs;
    });
  }, [activeTabId]);

  // タブを選択
  const selectTab = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  // タブの順序を変更
  const reorderTabs = useCallback((newTabs: OpenTab[]) => {
    setTabs(newTabs);
  }, []);

  // ファイル変更の監視を開始
  const startWatchingTab = useCallback((tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab) return;

    // 既存の監視を停止
    const existingInterval = watchIntervalsRef.current.get(tabId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    const interval = window.setInterval(async () => {
      try {
        const currentTab = tabs.find((t) => t.id === tabId);
        if (!currentTab) return;

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
  }, [tabs]);

  // ファイル変更の監視を停止
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

  return {
    tabs,
    activeTabId,
    activeTab,
    activeContent,
    activeFile,
    isInitialized,
    openTab,
    closeTab,
    selectTab,
    reorderTabs,
  };
};
