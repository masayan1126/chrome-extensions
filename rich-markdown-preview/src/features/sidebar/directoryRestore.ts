import type { StoredDirectory, FileSystemDirectoryHandleWithPermission } from './directoryDb';
import { openDB, STORE_NAME } from './directoryDb';

export { loadDirectoryFromStorage, hasStoredDirectory } from './directoryLoad';

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
