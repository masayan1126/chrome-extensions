// File System Access API の拡張型定義
export interface FileSystemHandlePermissionDescriptor {
  mode?: 'read' | 'readwrite';
}

export interface FileSystemFileHandleWithPermission extends FileSystemFileHandle {
  queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
  requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
}

export const DB_NAME = 'rich-markdown-preview-tabs';
export const DB_VERSION = 1;
export const STORE_NAME = 'tabs';

export interface StoredTab {
  id: string;
  filePath: string;
  fileName: string;
  fileHandle: FileSystemFileHandle;
}

export interface TabStorageData {
  tabs: StoredTab[];
  activeTabId: string | null;
}

export const openDB = (): Promise<IDBDatabase> => {
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
