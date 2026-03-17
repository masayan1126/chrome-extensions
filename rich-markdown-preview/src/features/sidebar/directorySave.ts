import type { StoredDirectory } from './directoryDb';
import { openDB, STORE_NAME } from './directoryDb';

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
