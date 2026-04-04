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
    let existingTab: OpenTab | undefined;
    if (file.handle) {
      for (const t of tabsRef.current) {
        if (!t.file.handle) continue;
        try {
          if (await t.file.handle.isSameEntry(file.handle)) {
            existingTab = t;
            break;
          }
        } catch (error) {
          if (error instanceof DOMException && (error.name === 'InvalidStateError' || error.name === 'SecurityError')) {
            console.debug('isSameEntry skipped: handle is invalid or permission revoked', { tabId: t.id });
          } else {
            console.warn('isSameEntry threw unexpected error, treating as no-match:', error);
          }
        }
      }
    } else {
      existingTab = tabsRef.current.find(
        (t) => !t.file.handle && t.file.path === file.path && t.file.name === file.name
      );
    }
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

    // D&Dフォールバック（handle なし）は name + size + lastModified で同一性を判定
    // File API の制約上フルパスは取得不可のため、これが最善の重複チェック
    const dropKey = `${file.name}::${file.size}::${file.lastModified}`;
    const existingTab = tabsRef.current.find(
      (t) => !t.file.handle && t.file.path === dropKey
    );
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    try {
      const content = await file.text();
      const newTab: OpenTab = {
        id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file: { name: file.name, path: dropKey, handle: null },
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
