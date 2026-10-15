/**
 * Pembungkus tipis IndexedDB (tanpa dependency).
 * Dipakai untuk data yang berisi file/foto (Blob) dan tidak cocok untuk localStorage.
 *
 * Stores:
 *  - users   : akun lokal (prototype auth)
 *  - reports : laporan yang sudah dikirim
 *  - drafts  : draft offline
 */
export type StoreName = 'users' | 'reports' | 'drafts';

const DB_NAME = 'laporin';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('Penyimpanan lokal (IndexedDB) tidak didukung oleh peramban ini.'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      const users = db.createObjectStore('users', { keyPath: 'id' });
      users.createIndex('email', 'email', { unique: true });
      users.createIndex('phone', 'phone', { unique: true });
      db.createObjectStore('reports', { keyPath: 'id' }).createIndex('userId', 'userId');
      db.createObjectStore('drafts', { keyPath: 'id' }).createIndex('userId', 'userId');
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    req.onerror = () => {
      dbPromise = null;
      reject(req.error ?? new Error('Gagal membuka penyimpanan lokal.'));
    };
  });
  return dbPromise;
}

function run<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const req = fn(tx.objectStore(store));
        // Resolve saat transaksi selesai (bukan saat request selesai) agar penulisan pasti tersimpan.
        tx.oncomplete = () => resolve(req.result);
        tx.onerror = () => reject(tx.error ?? req.error);
        tx.onabort = () => reject(tx.error ?? new Error('Transaksi penyimpanan dibatalkan.'));
      }),
  );
}

export async function dbPut<T>(store: StoreName, value: T): Promise<void> {
  await run(store, 'readwrite', (s) => s.put(value));
}

export function dbGet<T>(store: StoreName, key: string): Promise<T | undefined> {
  return run<T | undefined>(store, 'readonly', (s) => s.get(key) as IDBRequest<T | undefined>);
}

export async function dbDelete(store: StoreName, key: string): Promise<void> {
  await run(store, 'readwrite', (s) => s.delete(key));
}

export function dbGetAllByIndex<T>(store: StoreName, index: string, key: IDBValidKey): Promise<T[]> {
  return run<T[]>(store, 'readonly', (s) => s.index(index).getAll(key) as IDBRequest<T[]>);
}

export function dbGetOneByIndex<T>(store: StoreName, index: string, key: IDBValidKey): Promise<T | undefined> {
  return run<T | undefined>(store, 'readonly', (s) => s.index(index).get(key) as IDBRequest<T | undefined>);
}

/** Hanya untuk test: menutup & menghapus seluruh database. */
export async function resetDatabaseForTests(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise.catch(() => null);
    db?.close();
    dbPromise = null;
  }
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
}
