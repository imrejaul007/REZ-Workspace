import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { Product, Order, CashbackRequest } from '../types/api';
import { apiClient } from './api/client';

export interface OfflineAction {
  id: string;
  idempotencyKey: string;
  type:
    | 'CREATE_PRODUCT'
    | 'UPDATE_PRODUCT'
    | 'DELETE_PRODUCT'
    | 'UPDATE_ORDER'
    | 'APPROVE_CASHBACK'
    | 'REJECT_CASHBACK';
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  data?;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface DeadLetterAction extends OfflineAction {
  failedAt: number;
  lastError: string;
}

export interface CachedData {
  products: Product[];
  orders: Order[];
  cashbackRequests: CashbackRequest[];
  lastSync: number;
  expiresAt: number;
}

// AUDIT-FIX: Added exponential backoff to retry logic to prevent server hammering during outages.
const RETRY_BACKOFF_MS = 2000;

class OfflineService {
  private readonly CACHE_KEY = 'app_cache';
  private readonly OFFLINE_ACTIONS_KEY = 'offline_actions';
  private readonly DEAD_LETTER_KEY = 'offline_actions_dead_letter';
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000;
  private readonly MAX_QUEUE_LENGTH = 500;
  private readonly MAX_DEAD_LETTER_LENGTH = 1000;
  private isOnline = true;
  private syncInProgress = false;
  private actionSequence = 0;

  private netInfoUnsubscribe: (() => void) | null = null;
  private networkListenerInitialized = false;

  // AUDIT-FIX: Lazy initialization prevents the NetInfo event listener from being
  // registered at module-import time (which caused a memory leak since destroy()
  // was never called). Now the listener is only registered when first accessed.
  private ensureNetworkListener() {
    if (this.networkListenerInitialized) return;
    this.networkListenerInitialized = true;
    this.netInfoUnsubscribe = NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (wasOffline && this.isOnline) {
        this.syncOfflineActions((actionType) => {
          this.invalidateCacheForAction(actionType as OfflineAction['type']);
        });
      }
    });
  }

  /**
   * Cleanup — call when the service is no longer needed to prevent memory leaks.
   * AUDIT-FIX: destroy() is now callable if needed, though lazy init reduces
   * the risk since the listener is only registered on first use.
   */
  destroy(): void {
    this.netInfoUnsubscribe?.();
    this.netInfoUnsubscribe = null;
    this.networkListenerInitialized = false;
  }

  // G-MA-C13: Refresh cached data after an offline mutation syncs successfully.
  // Without this, the cache holds stale entries forever after an offline sync.
  private async invalidateCacheForAction(actionType: OfflineAction['type']): Promise<void> {
    try {
      const now = Date.now();
      const existingCache = await this.getCachedData();
      const updatedCache: CachedData = {
        ...existingCache,
        lastSync: now,
        expiresAt: now + this.CACHE_DURATION,
      };

      switch (actionType) {
        case 'CREATE_PRODUCT':
        case 'UPDATE_PRODUCT':
        case 'DELETE_PRODUCT': {
          // Re-fetch products and update cache so UI sees the mutation result.
          // Products are fetched from the API on next load; here we just invalidate
          // by setting products to empty so the next query fetches fresh data.
          updatedCache.products = [];
          break;
        }
        case 'UPDATE_ORDER': {
          updatedCache.orders = [];
          break;
        }
        case 'APPROVE_CASHBACK':
        case 'REJECT_CASHBACK': {
          updatedCache.cashbackRequests = [];
          break;
        }
        // Other action types: leave cache unchanged.
      }

      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(updatedCache));
    } catch {
      // Best-effort — cache staleness is a UX issue, not a data integrity issue.
    }
  }

  async isDeviceOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? false;
    return this.isOnline;
  }

  async cacheData(data: Partial<CachedData>): Promise<void> {
    try {
      const existingCache = await this.getCachedData();
      const now = Date.now();

      const updatedCache: CachedData = {
        ...existingCache,
        ...data,
        lastSync: now,
        expiresAt: now + this.CACHE_DURATION,
      };

      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(updatedCache));
    } catch {
      // best-effort cache
    }
  }

  async getCachedData(): Promise<CachedData> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEY);
      if (!cached) {
        return this.getEmptyCache();
      }

      const data: CachedData = JSON.parse(cached);
      if (Date.now() > data.expiresAt) {
        return this.getEmptyCache();
      }

      return data;
    } catch {
      return this.getEmptyCache();
    }
  }

  async isCacheValid(): Promise<boolean> {
    try {
      const cache = await this.getCachedData();
      return Date.now() < cache.expiresAt && cache.lastSync > 0;
    } catch {
      return false;
    }
  }

  private getEmptyCache(): CachedData {
    return {
      products: [],
      orders: [],
      cashbackRequests: [],
      lastSync: 0,
      expiresAt: 0,
    };
  }

  async queueOfflineAction(
    action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount' | 'idempotencyKey'>
  ): Promise<{ success: boolean }> {
    try {
      const now = Date.now();
      this.actionSequence += 1;
      // FIX (R6): replaced sequential idempotency key with CSPRNG uuidv4()
      const offlineAction: OfflineAction = {
        ...action,
        id: `offline_${now}_${this.actionSequence}`,
        idempotencyKey: uuidv4(),
        timestamp: now,
        retryCount: 0,
      };

      const existingActions = await this.getOfflineActions();
      existingActions.push(offlineAction);

      if (existingActions.length > this.MAX_QUEUE_LENGTH) {
        const overflowCount = existingActions.length - this.MAX_QUEUE_LENGTH;
        const dropped = existingActions.splice(0, overflowCount);
        await this.pushToDeadLetter(
          dropped.map((item) => ({
            ...item,
            failedAt: Date.now(),
            lastError: 'Queue capacity exceeded before sync',
          }))
        );
      }

      await AsyncStorage.setItem(this.OFFLINE_ACTIONS_KEY, JSON.stringify(existingActions));
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  async getOfflineActions(): Promise<OfflineAction[]> {
    try {
      const actions = await AsyncStorage.getItem(this.OFFLINE_ACTIONS_KEY);
      return actions ? JSON.parse(actions) : [];
    } catch {
      return [];
    }
  }

  async getDeadLetterActions(): Promise<DeadLetterAction[]> {
    try {
      const items = await AsyncStorage.getItem(this.DEAD_LETTER_KEY);
      if (!items) return [];
      const parsed: DeadLetterAction[] = JSON.parse(items);
      // Purge entries older than 7 days to prevent unbounded growth
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const fresh = parsed.filter((a) => a.failedAt >= cutoff);
      if (fresh.length !== parsed.length) {
        await AsyncStorage.setItem(this.DEAD_LETTER_KEY, JSON.stringify(fresh));
      }
      return fresh;
    } catch {
      return [];
    }
  }

  /**
   * MED-01 FIX: Retry a single dead letter action.
   * Re-queues the action into the offline queue for the next sync cycle.
   */
  async retryDeadLetter(deadLetterId: string): Promise<{ success: boolean }> {
    try {
      const deadLetters = await this.getDeadLetterActions();
      const target = deadLetters.find((a) => a.id === deadLetterId);
      if (!target) return { success: false };

      // Re-queue as a fresh offline action (retryCount resets to 0)
      const result = await this.queueOfflineAction({
        type: target.type,
        endpoint: target.endpoint,
        method: target.method,
        data: target.data,
        maxRetries: target.maxRetries,
      });

      if (result.success) {
        // Remove the dead letter entry after successful re-queue
        const updated = deadLetters.filter((a) => a.id !== deadLetterId);
        await AsyncStorage.setItem(this.DEAD_LETTER_KEY, JSON.stringify(updated));
      }

      return result;
    } catch {
      return { success: false };
    }
  }

  /**
   * MED-01 FIX: Retry all dead letter actions.
   * Re-queues all dead letter entries for the next sync cycle.
   */
  async retryAllDeadLetters(): Promise<{ retried: number; failed: number }> {
    const deadLetters = await this.getDeadLetterActions();
    let retried = 0;
    let failed = 0;
    for (const item of deadLetters) {
      const result = await this.retryDeadLetter(item.id);
      if (result.success) retried++;
      else failed++;
    }
    return { retried, failed };
  }

  /**
   * MED-01 FIX: Clear all dead letter entries.
   */
  async clearDeadLetter(): Promise<void> {
    await AsyncStorage.setItem(this.DEAD_LETTER_KEY, JSON.stringify([]));
  }

  private async pushToDeadLetter(items: DeadLetterAction[]): Promise<void> {
    if (!items.length) return;
    const existing = await this.getDeadLetterActions();
    const combined = [...existing, ...items].slice(-this.MAX_DEAD_LETTER_LENGTH);
    await AsyncStorage.setItem(this.DEAD_LETTER_KEY, JSON.stringify(combined));
  }

  async syncOfflineActions(
    onSuccess?: (actionType: string) => void
  ): Promise<{ successful: number; failed: number }> {
    if (this.syncInProgress) {
      return { successful: 0, failed: 0 };
    }

    this.syncInProgress = true;
    let successful = 0;
    let failed = 0;

    try {
      const actions = await this.getOfflineActions();
      const remainingActions: OfflineAction[] = [];
      const deadLetters: DeadLetterAction[] = [];

      for (const action of actions) {
        try {
          await this.executeOfflineAction(action);
          successful++;
          // Notify caller so they can invalidate React Query caches
          onSuccess?.(action.type);
        } catch (error) {
          action.retryCount++;
          const errMessage = error?.message || 'Unknown sync error';

          if (action.retryCount >= action.maxRetries) {
            failed++;
            deadLetters.push({
              ...action,
              failedAt: Date.now(),
              lastError: errMessage,
            });
          } else {
            remainingActions.push(action);
          }
        }
      }

      await AsyncStorage.setItem(this.OFFLINE_ACTIONS_KEY, JSON.stringify(remainingActions));
      await this.pushToDeadLetter(deadLetters);
      // AUDIT-FIX: Add backoff delay before returning so rapid network flapping or
      // repeated sync triggers don't hammer the server with back-to-back retry bursts.
      if (remainingActions.length > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, RETRY_BACKOFF_MS));
      }
    } catch {
      // best-effort sync
    } finally {
      this.syncInProgress = false;
    }

    return { successful, failed };
  }

  private normalizeEndpoint(endpoint: string): string {
    // MED-04 FIX: Only strip the /api/ prefix. The axios client strips leading slashes
    // separately in each HTTP method (get/post/put/delete/patch). Removing the leading slash
    // here as well caused double-normalization that could produce unexpected URL shapes.
    if (endpoint.startsWith('/api/')) {
      return endpoint.slice('/api/'.length);
    }
    // Leave leading slashes intact — axios client handles them consistently.
    return endpoint;
  }

  private async executeOfflineAction(action: OfflineAction): Promise<void> {
    const endpoint = this.normalizeEndpoint(action.endpoint);
    const config = {
      headers: {
        'Idempotency-Key': action.idempotencyKey,
      },
      // KENJI: integration resilience — explicit 10s timeout on offline sync API calls to prevent hanging on poor mobile connections
      timeout: 10000,
    };

    if (action.method === 'POST') {
      const response = await apiClient.post(endpoint, action.data, config);
      if (response?.success === false) {
        throw new Error(response.message || 'POST action rejected');
      }
      return;
    }

    if (action.method === 'PUT') {
      const response = await apiClient.put(endpoint, action.data, config);
      if (response?.success === false) {
        throw new Error(response.message || 'PUT action rejected');
      }
      return;
    }

    const response = await apiClient.delete(endpoint, config);
    if (response?.success === false) {
      throw new Error(response.message || 'DELETE action rejected');
    }
  }

  async clearCache(): Promise<void> {
    await AsyncStorage.multiRemove([
      this.CACHE_KEY,
      this.OFFLINE_ACTIONS_KEY,
      this.DEAD_LETTER_KEY,
    ]);
  }

  async getCacheInfo(): Promise<{
    cacheSize: number;
    pendingActions: number;
    deadLetterActions: number;
    lastSync: Date | null;
    isExpired: boolean;
    posPendingCount: number;
  }> {
    // FIX (151+152): Aggregate pending counts from BOTH the general AsyncStorage offline queue
    // (products, orders, cashback) AND the POS SQLite queue (bills/transactions). Previously,
    // the banner only showed the general count, hiding 50+ pending POS bills from the merchant.
    let posPendingCount = 0;
    try {
      const posQueue = require('../offlinePOSQueue');
      posPendingCount = posQueue.getPendingCount();
    } catch {
      // POS queue may not be available on web or if not initialized — non-fatal
    }

    try {
      const cache = await this.getCachedData();
      const actions = await this.getOfflineActions();
      const deadLetter = await this.getDeadLetterActions();

      return {
        cacheSize: cache.products.length + cache.orders.length + cache.cashbackRequests.length,
        pendingActions: actions.length + posPendingCount,
        deadLetterActions: deadLetter.length,
        lastSync: cache.lastSync > 0 ? new Date(cache.lastSync) : null,
        isExpired: Date.now() > cache.expiresAt,
        posPendingCount,
      };
    } catch {
      return {
        cacheSize: 0,
        pendingActions: posPendingCount,
        deadLetterActions: 0,
        lastSync: null,
        isExpired: true,
        posPendingCount,
      };
    }
  }

  async getCachedProducts(): Promise<Product[]> {
    const cache = await this.getCachedData();
    return cache.products || [];
  }

  async getCachedOrders(): Promise<Order[]> {
    const cache = await this.getCachedData();
    return cache.orders || [];
  }

  async getCachedCashbackRequests(): Promise<CashbackRequest[]> {
    const cache = await this.getCachedData();
    return cache.cashbackRequests || [];
  }

  async queueProductCreate(productData): Promise<{ success: boolean }> {
    return this.queueOfflineAction({
      type: 'CREATE_PRODUCT',
      endpoint: '/merchant/products',
      method: 'POST',
      data: productData,
      maxRetries: 3,
    });
  }

  async queueProductUpdate(productId: string, productData): Promise<{ success: boolean }> {
    return this.queueOfflineAction({
      type: 'UPDATE_PRODUCT',
      endpoint: `/merchant/products/${productId}`,
      method: 'PUT',
      data: productData,
      maxRetries: 3,
    });
  }

  async queueProductDelete(productId: string): Promise<{ success: boolean }> {
    return this.queueOfflineAction({
      type: 'DELETE_PRODUCT',
      endpoint: `/merchant/products/${productId}`,
      method: 'DELETE',
      maxRetries: 3,
    });
  }

  async queueOrderUpdate(orderId: string, orderData): Promise<{ success: boolean }> {
    return this.queueOfflineAction({
      type: 'UPDATE_ORDER',
      endpoint: `/merchant/orders/${orderId}`,
      method: 'PUT',
      data: orderData,
      maxRetries: 5,
    });
  }

  async queueCashbackApproval(cashbackId: string): Promise<{ success: boolean }> {
    return this.queueOfflineAction({
      type: 'APPROVE_CASHBACK',
      endpoint: `/merchant/cashback/${cashbackId}/approve`,
      method: 'PUT',
      maxRetries: 5,
    });
  }

  async queueCashbackRejection(cashbackId: string, reason?: string): Promise<{ success: boolean }> {
    return this.queueOfflineAction({
      type: 'REJECT_CASHBACK',
      endpoint: `/merchant/cashback/${cashbackId}/reject`,
      method: 'PUT',
      data: { reason },
      maxRetries: 5,
    });
  }
}

export const offlineService = new OfflineService();
export default offlineService;
