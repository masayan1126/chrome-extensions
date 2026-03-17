import type { FileInfo } from '../../shared/types';
import type { TabStorageData } from './tabDb';
import { openDB, STORE_NAME } from './tabDb';

export const saveTabsToStorage = async (
  tabs: { id: string; file: FileInfo }[],
  activeTabId: string | null
): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // 既存のデータをクリア
    store.clear();

    // タブデータを保存（ハンドルがないタブは復元不可のため除外）
    const validTabs = tabs.filter((tab): tab is typeof tab & { file: FileInfo & { handle: FileSystemFileHandle } } => !!tab.file.handle);
    const data: TabStorageData = {
      tabs: validTabs.map((tab) => ({
        id: tab.id,
        filePath: tab.file.path,
        fileName: tab.file.name,
        fileHandle: tab.file.handle,
      })),
      activeTabId: validTabs.some((tab) => tab.id === activeTabId) ? activeTabId : null,
    };

    store.put({ id: 'tabData', ...data });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error('Failed to save tabs to storage:', error);
  }
};

export const clearTabsStorage = async (): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.clear();

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error('Failed to clear tabs storage:', error);
  }
};
