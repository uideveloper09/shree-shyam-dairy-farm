"use client";

const DB_NAME = "ssd-offline";
const STORE = "sync-queue";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "clientId" });
      }
    };
  });
}

export type OfflineAction = {
  clientId: string;
  action: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export async function queueOfflineAction(action: string, payload: Record<string, unknown>) {
  const clientId = crypto.randomUUID();
  const record: OfflineAction = {
    clientId,
    action,
    payload,
    createdAt: new Date().toISOString(),
  };

  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  if (navigator.onLine) {
    await syncOfflineQueue();
  }

  return clientId;
}

export async function getPendingActions(): Promise<OfflineAction[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as OfflineAction[]);
    req.onerror = () => reject(req.error);
  });
}

export async function removeSyncedAction(clientId: string) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(clientId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingActions();
  if (!pending.length) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  const res = await fetch("/api/v1/mobile/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actions: pending }),
  });

  if (!res.ok) return { synced: 0, failed: pending.length };

  const data = (await res.json()) as { results: { clientId: string; ok: boolean }[] };
  for (const result of data.results) {
    if (result.ok) {
      await removeSyncedAction(result.clientId);
      synced++;
    } else {
      failed++;
    }
  }

  return { synced, failed };
}

export function registerOfflineSync() {
  if (typeof window === "undefined") return;
  window.addEventListener("online", () => {
    syncOfflineQueue().catch(() => {});
  });
}
