/**
 * IndexedDB wrapper for stamp persistence
 */
const StampStorage = (() => {
  const DB_NAME = 'chat-stamp-preview';
  const DB_VERSION = 1;
  const STORE_NAME = 'stamps';

  let db = null;

  function open() {
    return new Promise((resolve, reject) => {
      if (db) { resolve(db); return; }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const database = e.target.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = (e) => {
        db = e.target.result;
        resolve(db);
      };
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async function getStore(mode = 'readonly') {
    const database = await open();
    const tx = database.transaction(STORE_NAME, mode);
    return tx.objectStore(STORE_NAME);
  }

  /**
   * Save a stamp (id, blob, name, width, height)
   */
  async function save(stamp) {
    const store = await getStore('readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(stamp);
      request.onsuccess = () => resolve(stamp.id);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  /**
   * Get all stamps
   */
  async function getAll() {
    const store = await getStore('readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  /**
   * Delete a stamp by id
   */
  async function remove(id) {
    const store = await getStore('readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e.target.error);
    });
  }

  /**
   * Delete all stamps
   */
  async function clear() {
    const store = await getStore('readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e.target.error);
    });
  }

  return { save, getAll, remove, clear };
})();
