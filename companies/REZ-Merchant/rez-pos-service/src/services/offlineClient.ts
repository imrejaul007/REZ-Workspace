/**
 * Offline POS Client
 * IndexedDB-based offline storage for POS operations
 */

import { v4 as uuidv4 } from 'uuid';

export interface OfflineOrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  modifiers?: Array<{ name: string; price: number }>;
  notes?: string;
}

export interface OfflineOrder {
  id: string; // Local UUID
  offlineId: string; // Unique offline identifier
  merchantId: string;
  storeId: string;
  items: OfflineOrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'wallet';
  paymentStatus: 'pending' | 'completed';
  staffId?: string;
  tableId?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  syncError?: string;
  syncedAt?: number;
  createdAt: number;
  updatedAt: number;
  deviceId: string;
  appVersion: string;
  location?: { lat: number; lng: number };
}

export interface OfflineMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  modifiers?: Array<{ id: string; name: string; options: Array<{ name: string; price: number }> }>;
  variants?: Array<{ id: string; name: string; price: number }>;
  dietaryInfo?: string[];
  available: boolean;
  cachedAt: number;
}

export interface OfflineSyncStatus {
  isOnline: boolean;
  lastSyncAt: number | null;
  pendingCount: number;
  failedCount: number;
  isSyncing: boolean;
}

const DB_NAME = 'rez_pos_offline';
const DB_VERSION = 1;

class OfflinePOSClient {
  private db: IDBDatabase | null = null;
  private dbReady: Promise<void>;
  private syncListeners: Array<(status: OfflineSyncStatus) => void> = [];
  private status: OfflineSyncStatus = {
    isOnline: navigator.onLine,
    lastSyncAt: null,
    pendingCount: 0,
    failedCount: 0,
    isSyncing: false,
  };

  constructor() {
    this.dbReady = this.initDB();
    this.setupNetworkListeners();
  }

  /**
   * Initialize IndexedDB
   */
  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Orders store
        if (!db.objectStoreNames.contains('orders')) {
          const ordersStore = db.createObjectStore('orders', { keyPath: 'id' });
          ordersStore.createIndex('offlineId', 'offlineId', { unique: true });
          ordersStore.createIndex('status', 'status', { unique: false });
          ordersStore.createIndex('createdAt', 'createdAt', { unique: false });
          ordersStore.createIndex('merchantId', 'merchantId', { unique: false });
        }

        // Menu cache store
        if (!db.objectStoreNames.contains('menu')) {
          const menuStore = db.createObjectStore('menu', { keyPath: 'id' });
          menuStore.createIndex('category', 'category', { unique: false });
          menuStore.createIndex('cachedAt', 'cachedAt', { unique: false });
        }

        // Staff cache store
        if (!db.objectStoreNames.contains('staff')) {
          const staffStore = db.createObjectStore('staff', { keyPath: 'id' });
          staffStore.createIndex('merchantId', 'merchantId', { unique: false });
        }

        // Sync metadata store
        if (!db.objectStoreNames.contains('syncMeta')) {
          db.createObjectStore('syncMeta', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Setup network status listeners
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.status.isOnline = true;
      this.notifyListeners();
      this.triggerSync();
    });

    window.addEventListener('offline', () => {
      this.status.isOnline = false;
      this.notifyListeners();
    });
  }

  /**
   * Add status change listener
   */
  onStatusChange(callback: (status: OfflineSyncStatus) => void): () => void {
    this.syncListeners.push(callback);
    return () => {
      this.syncListeners = this.syncListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners(): void {
    this.syncListeners.forEach((cb) => cb(this.status));
  }

  /**
   * Get device ID (persistent across sessions)
   */
  private async getDeviceId(): Promise<string> {
    await this.dbReady;
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('syncMeta', 'readonly');
      const store = transaction.objectStore('syncMeta');
      const request = store.get('deviceId');

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.value);
        } else {
          // Generate new device ID
          const deviceId = uuidv4();
          const writeTransaction = this.db!.transaction('syncMeta', 'readwrite');
          const writeStore = writeTransaction.objectStore('syncMeta');
          writeStore.put({ key: 'deviceId', value: deviceId });
          writeTransaction.oncomplete = () => resolve(deviceId);
          writeTransaction.onerror = () => reject(writeTransaction.error);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Create an order offline
   */
  async createOrder(orderData: Omit<OfflineOrder, 'id' | 'offlineId' | 'status' | 'createdAt' | 'updatedAt' | 'deviceId'>): Promise<OfflineOrder> {
    await this.dbReady;

    const deviceId = await this.getDeviceId();
    const now = Date.now();
    const order: OfflineOrder = {
      ...orderData,
      id: uuidv4(),
      offlineId: uuidv4(),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      deviceId,
      appVersion: '1.0.0', // Would come from app config
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('orders', 'readwrite');
      const store = transaction.objectStore('orders');
      const request = store.add(order);

      request.onsuccess = () => {
        this.updatePendingCount();
        resolve(order);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all pending orders
   */
  async getPendingOrders(): Promise<OfflineOrder[]> {
    await this.dbReady;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('orders', 'readonly');
      const store = transaction.objectStore('orders');
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all orders for a merchant
   */
  async getOrders(merchantId: string): Promise<OfflineOrder[]> {
    await this.dbReady;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('orders', 'readonly');
      const store = transaction.objectStore('orders');
      const index = store.index('merchantId');
      const request = index.getAll(merchantId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: OfflineOrder['status'], error?: string): Promise<void> {
    await this.dbReady;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('orders', 'readwrite');
      const store = transaction.objectStore('orders');
      const getRequest = store.get(orderId);

      getRequest.onsuccess = () => {
        const order = getRequest.result;
        if (!order) {
          reject(new Error('Order not found'));
          return;
        }

        order.status = status;
        order.updatedAt = Date.now();
        if (error) order.syncError = error;
        if (status === 'synced') order.syncedAt = Date.now();

        const putRequest = store.put(order);
        putRequest.onsuccess = () => {
          this.updatePendingCount();
          resolve();
        };
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Cache menu items for offline use
   */
  async cacheMenuItems(items: OfflineMenuItem[]): Promise<void> {
    await this.dbReady;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('menu', 'readwrite');
      const store = transaction.objectStore('menu');

      // Clear existing cache
      store.clear();

      // Add new items with cache timestamp
      const now = Date.now();
      items.forEach((item) => {
        store.put({ ...item, cachedAt: now });
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Get cached menu items
   */
  async getCachedMenuItems(category?: string): Promise<OfflineMenuItem[]> {
    await this.dbReady;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('menu', 'readonly');
      const store = transaction.objectStore('menu');

      if (category) {
        const index = store.index('category');
        const request = index.getAll(category);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } else {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }
    });
  }

  /**
   * Get cached menu item by ID
   */
  async getCachedMenuItem(itemId: string): Promise<OfflineMenuItem | undefined> {
    await this.dbReady;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('menu', 'readonly');
      const store = transaction.objectStore('menu');
      const request = store.get(itemId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Check if menu cache is stale
   */
  async isMenuCacheStale(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<boolean> {
    await this.dbReady;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('menu', 'readonly');
      const store = transaction.objectStore('menu');
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result as OfflineMenuItem[];
        if (items.length === 0) {
          resolve(true);
          return;
        }

        const oldestCachedAt = Math.min(...items.map((item) => item.cachedAt));
        const isStale = Date.now() - oldestCachedAt > maxAgeMs;
        resolve(isStale);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Trigger sync when online
   */
  async triggerSync(): Promise<void> {
    if (!this.status.isOnline || this.status.isSyncing) return;

    this.status.isSyncing = true;
    this.notifyListeners();

    try {
      const pendingOrders = await this.getPendingOrders();

      for (const order of pendingOrders) {
        await this.syncOrder(order);
      }

      this.status.lastSyncAt = Date.now();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.status.isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Sync a single order to server
   */
  private async syncOrder(order: OfflineOrder): Promise<void> {
    try {
      await this.updateOrderStatus(order.id, 'syncing');

      const response = await fetch(`${process.env.MERCHANT_SERVICE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
        },
        body: JSON.stringify({
          merchantId: order.merchantId,
          storeId: order.storeId,
          items: order.items,
          subtotal: order.subtotal,
          tax: order.tax,
          discount: order.discount,
          total: order.total,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          staffId: order.staffId,
          tableId: order.tableId,
          customerId: order.customerId,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          orderType: order.orderType,
          source: 'offline_sync',
          sourceOfflineId: order.offlineId,
        }),
      });

      if (response.ok) {
        await this.updateOrderStatus(order.id, 'synced');
      } else {
        const error = await response.text();
        await this.updateOrderStatus(order.id, 'failed', error);
      }
    } catch (error) {
      await this.updateOrderStatus(
        order.id,
        'failed',
        error instanceof Error ? error.message : 'Network error'
      );
    }
  }

  /**
   * Update pending count
   */
  private async updatePendingCount(): Promise<void> {
    const pending = await this.getPendingOrders();
    const failed = await this.getFailedOrders();

    this.status.pendingCount = pending.length;
    this.status.failedCount = failed.length;
    this.notifyListeners();
  }

  /**
   * Get failed orders
   */
  async getFailedOrders(): Promise<OfflineOrder[]> {
    await this.dbReady;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('orders', 'readonly');
      const store = transaction.objectStore('orders');
      const index = store.index('status');
      const request = index.getAll('failed');

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Retry failed orders
   */
  async retryFailedOrders(): Promise<{ total: number; success: number; failed: number }> {
    const failed = await this.getFailedOrders();
    let success = 0;
    let failedCount = 0;

    for (const order of failed) {
      try {
        await this.syncOrder(order);
        success++;
      } catch {
        failedCount++;
      }
    }

    return { total: failed.length, success, failed: failedCount };
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<OfflineSyncStatus> {
    await this.updatePendingCount();
    return { ...this.status };
  }

  /**
   * Clear old synced orders
   */
  async clearOldSyncedOrders(daysOld: number = 30): Promise<number> {
    await this.dbReady;

    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('orders', 'readwrite');
      const store = transaction.objectStore('orders');
      const request = store.openCursor();

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const order = cursor.value as OfflineOrder;
          if (order.status === 'synced' && order.syncedAt && order.syncedAt < cutoffTime) {
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Export orders for backup
   */
  async exportOrders(merchantId: string): Promise<string> {
    const orders = await this.getOrders(merchantId);
    return JSON.stringify(orders, null, 2);
  }

  /**
   * Import orders from backup
   */
  async importOrders(ordersJson: string): Promise<number> {
    const orders = JSON.parse(ordersJson) as OfflineOrder[];
    let imported = 0;

    for (const order of orders) {
      try {
        await this.createOrder(order);
        imported++;
      } catch {
        // Skip duplicates
      }
    }

    return imported;
  }
}

// Singleton instance
export const offlinePOSClient = new OfflinePOSClient();
export default offlinePOSClient;
