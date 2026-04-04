import type { FileInfo } from '../../shared/types';
import type { TabStorageData, FileSystemFileHandleWithPermission } from './tabDb';
import { openDB, STORE_NAME } from './tabDb';

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
          } catch (error) {
            // 権限取得に失敗したタブはスキップ
            console.warn(`Failed to restore tab for file: ${storedTab.fileName}`, error);
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
