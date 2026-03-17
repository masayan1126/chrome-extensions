import { useCallback, useRef } from 'react';
import type { OpenTab, FileInfo } from '../../shared/types';
import { readFileContent, getFileLastModified, isMarkdownFile } from '../../shared/utils/fileSystem';

export const useTabOpen = (
  setTabs: React.Dispatch<React.SetStateAction<OpenTab[]>>,
  setActiveTabId: React.Dispatch<React.SetStateAction<string | null>>,
  lastModifiedRef: React.MutableRefObject<Map<string, number>>
) => {
  const tabsRef = useRef<OpenTab[]>([]);

  const updateTabsRef = (tabs: OpenTab[]) => {
    tabsRef.current = tabs;
  };

  const openTab = useCallback(async (file: FileInfo) => {
    const existingTab = tabsRef.current.find((t) => t.file.path === file.path);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    try {
      if (!file.handle) {
        console.error('Cannot open tab: file handle is null');
        return;
      }
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
  }, [setTabs, setActiveTabId, lastModifiedRef]);

  const openDroppedFile = useCallback(async (file: File) => {
    if (!isMarkdownFile(file.name)) return;

    const existingTab = tabsRef.current.find((t) => t.file.name === file.name && !t.file.handle);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    try {
      const content = await file.text();
      const newTab: OpenTab = {
        id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file: { name: file.name, path: file.name, handle: null },
        content,
        isDirty: false,
      };

      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(newTab.id);
    } catch (error) {
      console.error('Failed to open dropped file:', error);
    }
  }, [setTabs, setActiveTabId]);

  return { openTab, openDroppedFile, updateTabsRef };
};
