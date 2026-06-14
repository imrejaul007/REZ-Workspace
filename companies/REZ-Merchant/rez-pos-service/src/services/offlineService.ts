import { openDB, IDBPDatabase } from 'idb';

export interface QueuedOperation {
  id: string;
  type: 'sale' | 'stock_update' | 'refund' | 'price_update';
  payload: Record<string, unknown>;
  queuedAt: Date;
  synced: boolean;
  retryCount: number;
  lastError?: string;
}

export interface Operation {
  id: string;
  type: 'sale' | 'stock_update' | 'refund' | 'price_update';
  payload: Record<string, unknown>;
}

export interface SyncResult {
  synced: number;
  failed: number;
  conflicts?: unknown[];
  errors?: string[];
}

interface OfflineDB {
  operationQueue: {
    key: string;
    value: QueuedOperation;
  };
}

export class OfflineService {
  private operationQueue: QueuedOperation[] = [];
  private db: IDBPDatabase<OfflineDB> | null = null;
  private onlineHandler: (() => void) | null = null;
  private offlineHandler: (() => void) | null = null;

  constructor() {
    this.initDB();
    this.setupNetworkListeners();
  }

  private async initDB(): Promise<void> {
    try {
      this.db = await openDB<OfflineDB>('rez-pos-offline', 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('operationQueue')) {
            db.createObjectStore('operationQueue', { keyPath: 'id' });
          }
        },
      });
      await this.loadQueue();
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
    }
  }

  private setupNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    this.onlineHandler = () => {
      console.log('Network online - triggering sync');
      this.syncQueue().catch((e) => console.error('Auto-sync failed:', e));
    };

    this.offlineHandler = () => {
      console.log('Network offline - queuing operations locally');
    };

    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
  }

  isOnline(): boolean {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  }

  getQueueSize(): number {
    return this.operationQueue.filter((op) => !op.synced).length;
  }

  getQueueStatus(): { pending: number; synced: number; total: number } {
    return {
      pending: this.operationQueue.filter((op) => !op.synced).length,
      synced: this.operationQueue.filter((op) => op.synced).length,
      total: this.operationQueue.length,
    };
  }

  async queueOperation(op: Operation): Promise<string> {
    const queuedOp: QueuedOperation = {
      ...op,
      queuedAt: new Date(),
      synced: false,
      retryCount: 0,
    };

    this.operationQueue.push(queuedOp);
    await this.persistQueue();

    // If online, try immediate sync
    if (this.isOnline()) {
      this.syncQueue().catch((e) => console.error('Immediate sync failed:', e));
    }

    return queuedOp.id;
  }

  async syncQueue(): Promise<SyncResult> {
    if (!this.isOnline()) {
      return {
        synced: 0,
        failed: this.operationQueue.filter((op) => !op.synced).length,
        errors: ['Network is offline'],
      };
    }

    const pendingOps = this.operationQueue.filter((op) => !op.synced);
    const results: SyncResult = {
      synced: 0,
      failed: 0,
      conflicts: [],
      errors: [],
    };

    for (const op of pendingOps) {
      try {
        await this.executeOperation(op);
        op.synced = true;
        op.lastError = undefined;
        results.synced++;
      } catch (error) {
        op.retryCount++;
        op.lastError = error instanceof Error ? error.message : 'Unknown error';
        results.failed++;
        results.errors?.push(`${op.id}: ${op.lastError}`);

        // Mark as synced if max retries reached
        if (op.retryCount >= 5) {
          op.synced = true; // Move to dead letter after max retries
          console.error(`Operation ${op.id} exceeded max retries:`, op.lastError);
        }
      }
    }

    await this.persistQueue();
    return results;
  }

  private async executeOperation(op: QueuedOperation): Promise<void> {
    const endpoints: Record<string, string> = {
      sale: '/api/sales',
      stock_update: '/api/stock',
      refund: '/api/refunds',
      price_update: '/api/prices',
    };

    const endpoint = endpoints[op.type];
    if (!endpoint) {
      throw new Error(`Unknown operation type: ${op.type}`);
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(op.payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
  }

  private async persistQueue(): Promise<void> {
    if (!this.db) {
      console.warn('IndexedDB not available, using memory storage only');
      return;
    }

    try {
      const tx = this.db.transaction('operationQueue', 'readwrite');
      const store = tx.objectStore('operationQueue');

      // Clear and re-add all operations
      await store.clear();
      for (const op of this.operationQueue) {
        await store.put(op);
      }

      await tx.done;
    } catch (error) {
      console.error('Failed to persist queue:', error);
    }
  }

  private async loadQueue(): Promise<void> {
    if (!this.db) return;

    try {
      const tx = this.db.transaction('operationQueue', 'readonly');
      const store = tx.objectStore('operationQueue');
      const allOps = await store.getAll();

      // Merge with memory queue, prefer persisted state
      const persistedIds = new Set(allOps.map((op) => op.id));

      for (const op of allOps) {
        if (!this.operationQueue.find((m) => m.id === op.id)) {
          this.operationQueue.push(op);
        }
      }

      // Add memory-only operations (newer)
      for (const op of this.operationQueue) {
        if (!persistedIds.has(op.id)) {
          await store.put(op);
        }
      }
    } catch (error) {
      console.error('Failed to load queue:', error);
    }
  }

  async removeOperation(id: string): Promise<boolean> {
    const index = this.operationQueue.findIndex((op) => op.id === id);
    if (index === -1) return false;

    this.operationQueue.splice(index, 1);
    await this.persistQueue();
    return true;
  }

  async clearSynced(): Promise<number> {
    const syncedCount = this.operationQueue.filter((op) => op.synced).length;
    this.operationQueue = this.operationQueue.filter((op) => !op.synced);
    await this.persistQueue();
    return syncedCount;
  }

  async retryFailed(): Promise<SyncResult> {
    // Reset failed operations for retry
    for (const op of this.operationQueue) {
      if (op.synced && op.lastError) {
        op.synced = false;
      }
    }
    await this.persistQueue();
    return this.syncQueue();
  }

  getOperation(id: string): QueuedOperation | undefined {
    return this.operationQueue.find((op) => op.id === id);
  }

  getFailedOperations(): QueuedOperation[] {
    return this.operationQueue.filter((op) => !op.synced && op.retryCount > 0);
  }

  destroy(): void {
    if (this.onlineHandler) {
      window.removeEventListener('online', this.onlineHandler);
    }
    if (this.offlineHandler) {
      window.removeEventListener('offline', this.offlineHandler);
    }
    this.db?.close();
  }
}

// Singleton instance
let offlineServiceInstance: OfflineService | null = null;

export function getOfflineService(): OfflineService {
  if (!offlineServiceInstance) {
    offlineServiceInstance = new OfflineService();
  }
  return offlineServiceInstance;
}

export default OfflineService;
