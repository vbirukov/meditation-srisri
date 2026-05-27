const DB_NAME = 'seva-hub';
const STORE = 'custom-tracks';
const KEY = 'current';

export interface StoredCustomTrack {
  name: string;
  mimeType: string;
  durationSeconds: number;
  blob: Blob;
  addedAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txGet(db: IDBDatabase): Promise<StoredCustomTrack | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(KEY);
    req.onsuccess = () => resolve((req.result as StoredCustomTrack | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function getCustomTrack(): Promise<StoredCustomTrack | null> {
  const db = await openDb();
  try {
    return await txGet(db);
  } finally {
    db.close();
  }
}

export async function saveCustomTrack(data: StoredCustomTrack): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(data, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function deleteCustomTrack(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
