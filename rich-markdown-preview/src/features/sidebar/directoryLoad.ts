import type { StoredDirectory, FileSystemDirectoryHandleWithPermission } from './directoryDb';
import { openDB, STORE_NAME } from './directoryDb';

// ストレージからディレクトリを読み込む（権限確認のみ、要求はしない）
export const loadDirectoryFromStorage = async (): Promise<FileSystemDirectoryHandle | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get('currentDirectory');

      request.onsuccess = async () => {
        db.close();
        const data = request.result as StoredDirectory | undefined;

        if (!data || !data.directoryHandle) {
          resolve(null);
          return;
        }

        try {
          const handle = data.directoryHandle as FileSystemDirectoryHandleWithPermission;
          const permission = await handle.queryPermission({ mode: 'read' });

          if (permission === 'granted') {
            resolve(data.directoryHandle);
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      };

      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to load directory from storage:', error);
    return null;
  }
};

// 保存されたディレクトリがあるかどうかを確認
export const hasStoredDirectory = async (): Promise<boolean> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const request = store.get('currentDirectory');

      request.onsuccess = () => {
        db.close();
        const data = request.result as StoredDirectory | undefined;
        resolve(!!(data && data.directoryHandle));
      };

      request.onerror = () => {
        db.close();
        resolve(false);
      };
    });
  } catch {
    return false;
  }
};
