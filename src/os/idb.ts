import type { StateStorage } from "zustand/middleware";

// IndexedDB instead of localStorage: imported images and audio quickly exceed the ~5 MB localStorage quota.
const IDB_NAME = "macos-web";
let db: Promise<IDBDatabase> | undefined;

function kv<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
  db ??= new Promise((done, fail) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore("kv");
    req.onsuccess = () => done(req.result);
    req.onerror = () => fail(req.error);
  });
  return db.then(
    (conn) =>
      new Promise<T>((done, fail) => {
        const req = run(conn.transaction("kv", mode).objectStore("kv"));
        req.onsuccess = () => done(req.result);
        req.onerror = () => fail(req.error);
      }),
  );
}

/** Wipes every persisted store and reloads into a fresh first boot. */
export async function factoryReset() {
  localStorage.clear();
  (await db)?.close();
  const req = indexedDB.deleteDatabase(IDB_NAME);
  req.onsuccess = req.onerror = req.onblocked = () => location.reload();
}

export const idbStorage: StateStorage = {
  getItem: (key) => kv<string | undefined>("readonly", (s) => s.get(key)).then((v) => v ?? null),
  setItem: (key, value) => kv("readwrite", (s) => s.put(value, key)).then(() => undefined),
  removeItem: (key) => kv("readwrite", (s) => s.delete(key)).then(() => undefined),
};
