/* ── Stockage hors-ligne via IndexedDB ── */
const DB_NAME = "ebia_offline";
const DB_VERSION = 1;
const STORE = "tracks";
export const EXPIRY_DAYS = 7;

export interface OfflineTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  duration_s: number;
  coverUrl?: string;
  audioBlob: Blob;
  downloadedAt: number;
  expiresAt: number;
}

export type OfflineTrackInput = Omit<OfflineTrack, "downloadedAt" | "expiresAt">;

/* ─ Helpers ─ */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
  });
}

/* ─ API ─ */
export async function saveOfflineTrack(track: OfflineTrackInput): Promise<void> {
  const db = await openDB();
  const now = Date.now();
  const entry: OfflineTrack = {
    ...track,
    downloadedAt: now,
    expiresAt: now + EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(entry).onsuccess = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getOfflineTrack(id: string): Promise<OfflineTrack | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => {
      const r = req.result as OfflineTrack | undefined;
      if (!r) return resolve(null);
      if (Date.now() > r.expiresAt) {
        deleteOfflineTrack(id).catch(() => {});
        return resolve(null);
      }
      resolve(r);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getAllOfflineTracks(): Promise<OfflineTrack[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as OfflineTrack[]);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteOfflineTrack(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id).onsuccess = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function purgeExpiredTracks(): Promise<number> {
  const all = await getAllOfflineTracks();
  const now = Date.now();
  const expired = all.filter(t => now > t.expiresAt);
  await Promise.all(expired.map(t => deleteOfflineTrack(t.id)));
  return expired.length;
}

export function daysLeft(track: OfflineTrack): number {
  return Math.max(0, Math.ceil((track.expiresAt - Date.now()) / 86_400_000));
}
