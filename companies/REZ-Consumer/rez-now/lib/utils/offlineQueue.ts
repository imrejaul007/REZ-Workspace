const DB_NAME = 'rez-now-offline';
const STORE_NAME = 'pending-orders';
const DB_VERSION = 1;
const MAX_RETRIES = 3;
const ORDER_TTL_MS = 24 * 60 * 60 * 1000; // NW-MED-026: Reject orders older than 24 hours.

export interface PendingOrder {
  id: string;
  storeSlug: string;
  payload: unknown;
  createdAt: number;
  retries: number;
}

// ── DB lifecycle ──────────────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    req.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
    req.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
  });
}

// ── UUID generation ─────────────────────────────────────────────────────────────

function generateId(): string {
  // Use Web Crypto API for cryptographically secure IDs (available in all modern browsers).
  // Falls back to timestamp + crypto.getRandomValues for environments without crypto.randomUUID.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Node.js / older browsers fallback using getRandomValues
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Persists an order payload to IndexedDB for later submission.
 * Returns the generated queue ID.
 */
export async function queueOrder(storeSlug: string, payload: unknown): Promise<string> {
  const db = await openDB();
  const id = generateId();

  const record: PendingOrder = {
    id,
    storeSlug,
    payload,
    createdAt: Date.now(),
    retries: 0,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).add(record);
    req.onsuccess = () => resolve(id);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

/**
 * Returns all orders currently waiting in the offline queue,
 * sorted oldest-first.
 */
export async function getPendingOrders(): Promise<PendingOrder[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).index('createdAt').getAll();
    req.onsuccess = () => resolve(req.result as PendingOrder[]);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

/**
 * Removes a single order from the queue by ID.
 * Call this after a successful sync or after MAX_RETRIES is exceeded.
 */
export async function removeOrder(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

/**
 * Increments the retry counter for an order.
 * If retries reach MAX_RETRIES the order is automatically discarded.
 */
export async function incrementRetry(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const objectStore = tx.objectStore(STORE_NAME);
    const getReq = objectStore.get(id);

    getReq.onsuccess = () => {
      const record = getReq.result as PendingOrder | undefined;
      if (!record) { resolve(); return; }

      const now = Date.now();
      // NW-MED-026: Reject stale orders older than ORDER_TTL_MS (24 hours).
      // If the order is too old, treat it as permanently failed.
      const isStale = (now - record.createdAt) > ORDER_TTL_MS;

      if (isStale || record.retries + 1 >= MAX_RETRIES) {
        // NW-CRIT-007: Emit event before deleting so UI can show a persistent
        // banner instead of silently losing the order from IndexedDB.
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('rez:order-sync-failed', {
            detail: {
              id,
              storeSlug: record.storeSlug,
              payload: record.payload,
              reason: isStale ? 'stale' : 'max-retries',
            },
          }));
        }
        objectStore.delete(id);
      } else {
        objectStore.put({ ...record, retries: record.retries + 1 });
      }
    };

    getReq.onerror = () => reject(getReq.error);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Returns the count of orders currently waiting in the offline queue.
 * Resolves to 0 if IndexedDB is unavailable.
 */
export async function getQueueCount(): Promise<number> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).count();
      req.onsuccess = () => resolve(req.result as number);
      req.onerror = () => resolve(0);
      tx.oncomplete = () => db.close();
    });
  } catch (error) {
    logger.warn('[offlineQueue] getQueueCount failed:', error);
    return 0;
  }
}

/**
 * Registers a Background Sync event so the service worker retries
 * pending orders as soon as the device has connectivity.
 */
export async function registerBackgroundSync(): Promise<void> {
  if (
    typeof navigator === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('SyncManager' in window)
  ) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    // The Background Sync spec exposes sync on the registration
    await (registration as ServiceWorkerRegistration & {
      sync: { register(tag: string): Promise<void> };
    }).sync.register('sync-orders');
  } catch (error) {
    // Background Sync not supported or permission denied — fail silently
    logger.warn('[offlineQueue] Background Sync registration failed:', error);
  }
}
