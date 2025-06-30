import type { AttractorParameters } from "@repo/core/types";

export type AttractorRecord = {
  uuid: string;
  name: string;
  attractorParameters: AttractorParameters;
};

const DB_NAME = "attractor-db";
const STORE_NAME = "attractors";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "uuid" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAttractor(record: AttractorRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPaginatedAttractors(page: number, pageSize: number): Promise<{ records: AttractorRecord[]; total: number }> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.openCursor();
    const records: AttractorRecord[] = [];
    let skipped = 0;
    let added = 0;
    let total = 0;
    req.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        total++;
        if (skipped < page * pageSize) {
          skipped++;
          cursor.continue();
        } else if (added < pageSize) {
          records.push(cursor.value);
          added++;
          cursor.continue();
        } else {
          // Got enough for this page, but keep counting total
          cursor.continue();
        }
      } else {
        resolve({ records, total });
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteAttractor(uuid: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(uuid);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
