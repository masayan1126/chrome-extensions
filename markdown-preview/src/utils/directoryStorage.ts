// File System Access API の拡張型定義
interface FileSystemHandlePermissionDescriptor {
  mode?: 'read' | 'readwrite';
}

interface FileSystemDirectoryHandleWithPermission extends FileSystemDirectoryHandle {
  queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
  requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
}

const DB_NAME = 'markdown-preview-directory';
const DB_VERSION = 1;
const STORE_NAME = 'directory';

interface StoredDirectory {
  id: string;
  directoryHandle: FileSystemDirectoryHandle;
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

export const saveDirectoryToStorage = async (
  directoryHandle: FileSystemDirectoryHandle
): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // 既存のデータをクリアして新しいディレクトリを保存
    store.clear();

    const data: StoredDirectory = {
      id: 'currentDirectory',
      directoryHandle,
    };

    store.put(data);

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
    console.error('Failed to save directory to storage:', error);
  }
};

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
          // 権限の確認のみ（型をキャスト）
          const handle = data.directoryHandle as FileSystemDirectoryHandleWithPermission;
          const permission = await handle.queryPermission({ mode: 'read' });

          if (permission === 'granted') {
            resolve(data.directoryHandle);
          } else {
            // 権限がない場合はnullを返す（要求はしない）
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

// ユーザー操作後に権限を要求してディレクトリを復元
export const restoreDirectoryWithPermission = async (): Promise<FileSystemDirectoryHandle | null> => {
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
            // ユーザー操作があるので権限を要求できる
            const newPermission = await handle.requestPermission({ mode: 'read' });
            if (newPermission === 'granted') {
              resolve(data.directoryHandle);
            } else {
              resolve(null);
            }
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
    console.error('Failed to restore directory with permission:', error);
    return null;
  }
};

export const clearDirectoryStorage = async (): Promise<void> => {
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
    console.error('Failed to clear directory storage:', error);
  }
};
