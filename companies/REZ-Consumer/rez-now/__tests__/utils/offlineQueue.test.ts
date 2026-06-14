/**
 * Tests for rez-now/lib/utils/offlineQueue.ts
 *
 * jsdom does not ship a real IndexedDB implementation, so `indexedDB.open`
 * either throws or its request never fires onsuccess.  We cover the
 * `getQueueCount` function's error-handling path by replacing the global
 * `indexedDB` with a minimal stub that immediately fires `onerror` on every
 * open request, which causes `openDB()` to reject — and `getQueueCount` must
 * resolve to 0 in that case.
 */

import { getQueueCount } from '@/lib/utils/offlineQueue';

// ── Helper to build a minimal IDBOpenDBRequest stub ───────────────────────────

function makeFailingIDBFactory(): IDBFactory {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- IDB factory signature requires these params
    open(_name: string, _version: number): IDBOpenDBRequest {
      // Build a minimal stub that schedules onerror asynchronously
      // Cast through unknown so the partial stub satisfies IDBOpenDBRequest's
      // strict `this` constraint on onerror without widening `error` to undefined.
      const req = {
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null as IDBOpenDBRequest['onerror'],
        onblocked: null,
        result: undefined as unknown as IDBDatabase,
        error: new DOMException('IndexedDB unavailable in test environment', 'UnknownError') as DOMException | null,
        source: null as unknown as IDBObjectStore,
        transaction: null,
        readyState: 'pending' as IDBRequestReadyState,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      } as unknown as IDBOpenDBRequest;

      // Fire onerror on the next microtask so the handler has time to be set
      Promise.resolve().then(() => {
        if (typeof req.onerror === 'function') {
          req.onerror({ target: req } as unknown as Event);
        }
      });

      return req as IDBOpenDBRequest;
    },
    deleteDatabase(_name: string): IDBOpenDBRequest {
      return makeFailingIDBFactory().open(_name);
    },
    cmp(): number { return 0; },
    databases(): Promise<IDBDatabaseInfo[]> { return Promise.resolve([]); },
  } as unknown as IDBFactory;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('getQueueCount — IndexedDB unavailable', () => {
  let originalIndexedDB: IDBFactory;

  beforeEach(() => {
    originalIndexedDB = global.indexedDB;
  });

  afterEach(() => {
    // Restore whatever was there originally (may be undefined in jsdom)
    if (originalIndexedDB === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global as any).indexedDB;
    } else {
      global.indexedDB = originalIndexedDB;
    }
  });

  it('returns 0 when indexedDB.open fires onerror', async () => {
    global.indexedDB = makeFailingIDBFactory();
    const count = await getQueueCount();
    expect(count).toBe(0);
  });

  it('returns 0 when indexedDB is entirely absent (undefined)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).indexedDB;
    const count = await getQueueCount();
    expect(count).toBe(0);
  });

  it('returns 0 when indexedDB.open throws synchronously', async () => {
    global.indexedDB = {
      open() { throw new Error('IDB not supported'); },
      deleteDatabase() { throw new Error('IDB not supported'); },
      cmp() { return 0; },
      databases() { return Promise.resolve([]); },
    } as unknown as IDBFactory;

    const count = await getQueueCount();
    expect(count).toBe(0);
  });
});
