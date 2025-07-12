import type { AttractorParameters } from "@repo/core/types";
import { v4 as uuidv4 } from "uuid";

export type AttractorRecord = {
  uuid: string;
  name: string;
  attractorParameters: AttractorParameters;
  createdAt: number;
  image: string; // Base64 encoded image
};

const DB_NAME = "attractor-db";
const STORE_NAME = "attractors";
const DB_VERSION = 2; // bump version for new index

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "uuid" });
        store.createIndex("createdAt", "createdAt");
      } else {
        const store = request.transaction?.objectStore(STORE_NAME);
        if (store && !store.indexNames.contains("createdAt")) {
          store.createIndex("createdAt", "createdAt");
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAttractor(
  record: Omit<AttractorRecord, "uuid" | "createdAt">
): Promise<AttractorRecord> {
  const uuid = uuidv4();
  const createdAt = Date.now();
  const db = await openDB();
  const attractorRecord = { uuid, ...record, createdAt };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(attractorRecord);
    tx.oncomplete = () => resolve(attractorRecord);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPaginatedAttractors(
  page: number,
  pageSize: number = 33
): Promise<{ records: AttractorRecord[]; total: number }> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("createdAt");
    const req = index.openCursor(null, "prev"); // newest first
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
          cursor.continue(); // keep counting total
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
