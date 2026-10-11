const DB_NAME = "spam-deck-lab";
const STORE = "handles";
const KEY = "replay-index";

export type ReplayFileHandle = {
  getFile: () => Promise<File>;
  queryPermission?: (options: { mode: "read" }) => Promise<PermissionState>;
  requestPermission?: (options: { mode: "read" }) => Promise<PermissionState>;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = action(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export async function saveReplayHandle(handle: ReplayFileHandle): Promise<void> {
  try {
    await run("readwrite", (store) => store.put(handle, KEY));
  } catch {
    // Refreshing without the dialog is optional.
  }
}

export async function loadReplayHandle(): Promise<ReplayFileHandle | null> {
  try {
    return (await run<ReplayFileHandle | undefined>("readonly", (store) => store.get(KEY))) ?? null;
  } catch {
    return null;
  }
}

export async function clearReplayHandle(): Promise<void> {
  try {
    await run("readwrite", (store) => store.delete(KEY));
  } catch {
    // Nothing to clear.
  }
}

export async function readReplayHandle(handle: ReplayFileHandle): Promise<File | null> {
  try {
    let permission = await handle.queryPermission?.({ mode: "read" });
    if (permission !== "granted") permission = await handle.requestPermission?.({ mode: "read" });
    if (permission !== "granted") return null;
    return await handle.getFile();
  } catch {
    return null;
  }
}
