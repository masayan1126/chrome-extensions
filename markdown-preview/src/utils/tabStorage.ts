import type { FileInfo } from '../types';

// File System Access API の拡張型定義
interface FileSystemHandlePermissionDescriptor {
  mode?: 'read' | 'readwrite';
}

interface FileSystemFileHandleWithPermission extends FileSystemFileHandle {
  queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
  requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
}

const DB_NAME = 'markdown-preview-tabs';
const DB_VERSION = 1;
const STORE_NAME = 'tabs';

interface StoredTab {
  id: string;
  filePath: string;
  fileName: string;
  fileHandle: FileSystemFileHandle;
}

interface TabStorageData {
  tabs: StoredTab[];
  activeTabId: string | null;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

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
    const validTabs = tabs.filter((tab) => tab.file.handle);
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

export const loadTabsFromStorage = async (): Promise<{
  tabs: { id: string; file: FileInfo }[];
  activeTabId: string | null;
} | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get('tabData');

      request.onsuccess = async () => {
        db.close();
        const data = request.result as (TabStorageData & { id: string }) | undefined;

        if (!data || !data.tabs || data.tabs.length === 0) {
          resolve(null);
          return;
        }

        // ファイルハンドルの権限を確認し、有効なタブのみを返す
        const validTabs: { id: string; file: FileInfo }[] = [];

        for (const storedTab of data.tabs) {
          try {
            // ハンドルがないタブ（D&Dで開いたファイルなど）はスキップ
            if (!storedTab.fileHandle) {
              continue;
            }

            // 権限の確認（型をキャスト）
            const handle = storedTab.fileHandle as FileSystemFileHandleWithPermission;
            const permission = await handle.queryPermission({ mode: 'read' });

            if (permission === 'granted') {
              validTabs.push({
                id: storedTab.id,
                file: {
                  name: storedTab.fileName,
                  path: storedTab.filePath,
                  handle: storedTab.fileHandle,
                },
              });
            } else if (permission === 'prompt') {
              // 権限を要求
              const newPermission = await handle.requestPermission({ mode: 'read' });
              if (newPermission === 'granted') {
                validTabs.push({
                  id: storedTab.id,
                  file: {
                    name: storedTab.fileName,
                    path: storedTab.filePath,
                    handle: storedTab.fileHandle,
                  },
                });
              }
            }
          } catch {
            // 権限取得に失敗したタブはスキップ
            console.warn(`Failed to restore tab for file: ${storedTab.fileName}`);
          }
        }

        if (validTabs.length === 0) {
          resolve(null);
          return;
        }

        // アクティブタブが有効なタブリストに含まれているか確認
        const activeTabId = validTabs.some((t) => t.id === data.activeTabId)
          ? data.activeTabId
          : validTabs[0].id;

        resolve({ tabs: validTabs, activeTabId });
      };

      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to load tabs from storage:', error);
    return null;
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
