// Local IndexedDB Service for same-browser receipt image storage backup
const DB_NAME = 'TeleHealthReceiptsDb';
const DB_VERSION = 1;
const STORE_NAME = 'receipts';

export interface StoredReceipt {
  appointmentId: string;
  base64Data: string;
  fileName?: string;
  fileSize?: number;
  uploadedAt: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'appointmentId' });
      }
    };
    request.onsuccess = (event: any) => resolve(event.target.result as IDBDatabase);
    request.onerror = (event: any) => reject(event.target.error);
  });
}

export async function saveReceiptToIndexedDb(
  appointmentId: string,
  base64Data: string,
  fileName?: string,
  fileSize?: number
): Promise<boolean> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record: StoredReceipt = {
        appointmentId,
        base64Data,
        fileName,
        fileSize,
        uploadedAt: new Date().toISOString(),
      };
      const req = store.put(record);
      req.onsuccess = () => resolve(true);
      req.onerror = (err) => {
        console.warn('Failed to store receipt in IndexedDB:', err);
        resolve(false);
      };
    });
  } catch (err) {
    console.warn('IndexedDB save failed:', err);
    return false;
  }
}

export async function getReceiptFromIndexedDb(
  appointmentId: string
): Promise<StoredReceipt | null> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(appointmentId);
      req.onsuccess = () => resolve((req.result as StoredReceipt) || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('IndexedDB read failed:', err);
    return null;
  }
}
