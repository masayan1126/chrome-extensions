import { useState, useEffect } from 'react';
import type { OpenTab } from '../../shared/types';
import { readFileContent, getFileLastModified } from '../../shared/utils/fileSystem';
import { saveTabsToStorage } from './tabSave';
import { loadTabsFromStorage } from './tabRestore';

export const useTabRestore = (
  setTabs: React.Dispatch<React.SetStateAction<OpenTab[]>>,
  setActiveTabId: React.Dispatch<React.SetStateAction<string | null>>,
  tabs: OpenTab[],
  activeTabId: string | null,
  lastModifiedRef: React.MutableRefObject<Map<string, number>>
) => {
  const [isInitialized, setIsInitialized] = useState(false);

  // 初期化時にストレージからタブを復元
  useEffect(() => {
    const restoreTabs = async () => {
      try {
        const storedData = await loadTabsFromStorage();
        if (storedData && storedData.tabs.length > 0) {
          const restoredTabs: OpenTab[] = [];
          for (const tab of storedData.tabs) {
            try {
              if (!tab.file.handle) continue;
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

  return { isInitialized };
};
