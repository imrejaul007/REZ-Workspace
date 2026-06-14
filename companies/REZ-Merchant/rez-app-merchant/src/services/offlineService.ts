/**
 * Offline Service - Provides offline capability for core features
 *
 * Uses AsyncStorage for data persistence and NetInfo for network status monitoring.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { logger } from '@/utils/logger';

// Storage keys
const CACHE_PREFIX = '@offline_cache:';
const QUEUE_KEY = '@offline_action_queue';
const NETWORK_LISTENERS_KEY = '@network_listeners';

// Type definitions
export interface OfflineAction {
  id: string;
  type: 'order' | 'inventory';
  action: string;
  payload: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  maxRetries?: number;
}

export interface NetworkListener {
  id: string;
  callback: (isOnline: boolean) => void;
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: Array<{ actionId: string; error: string }>;
}

interface CachedData<T> {
  data: T;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
}

// Singleton state
let networkListeners: Map<string, (isOnline: boolean) => void> = new Map();
let isInitialized = false;
let currentNetworkState: NetInfoState | null = null;

/**
 * Generate a unique ID for actions
 * FIX (security): Replaced Math.random() with crypto.getRandomValues() for secure ID generation
 */
const generateId = (): string => {
  // Use crypto for secure random ID generation
  if (
    typeof globalThis !== 'undefined' &&
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.getRandomValues === 'function'
  ) {
    const array = new Uint8Array(8);
    globalThis.crypto.getRandomValues(array);
    const hex = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    return `${Date.now().toString(36)}-${hex}`;
  }
  // Node.js fallback
  try {
    const { randomBytes } = require('crypto');
    const hex = randomBytes(8).toString('hex');
    return `${Date.now().toString(36)}-${hex}`;
  } catch {
    // Legacy fallback (only for environments without crypto)
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 11)}`;
  }
};

/**
 * Initialize network monitoring
 */
const initializeNetworkMonitoring = async (): Promise<void> => {
  if (isInitialized) return;

  try {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      currentNetworkState = state;
      const online = state.isConnected === true && state.isInternetReachable !== false;

      logger.debug(`[OfflineService] Network state changed: ${online ? 'online' : 'offline'}`, state);

      // Notify all listeners
      networkListeners.forEach((callback) => {
        try {
          callback(online);
        } catch (error) {
          logger.error('[OfflineService] Error in network listener:', error);
        }
      });

      // If we came back online, trigger sync
      if (online) {
        logger.debug('[OfflineService] Network restored, attempting sync');
        syncOfflineActions().catch((error) => {
          logger.error('[OfflineService] Auto-sync failed:', error);
        });
      }
    });

    // Get initial state
    currentNetworkState = await NetInfo.fetch();
    isInitialized = true;

    logger.debug('[OfflineService] Network monitoring initialized');
  } catch (error) {
    logger.error('[OfflineService] Failed to initialize network monitoring:', error);
  }
};

/**
 * Cache data with optional TTL
 */
export const cacheData = async <T>(key: string, data: T, ttl?: number): Promise<void> => {
  try {
    const cachedData: CachedData<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cachedData));
    logger.debug(`[OfflineService] Cached data for key: ${key}`);
  } catch (error) {
    logger.error(`[OfflineService] Failed to cache data for key: ${key}`, error);
    throw error;
  }
};

/**
 * Get cached data by key
 */
export const getCachedData = async <T>(key: string): Promise<T | null> => {
  try {
    const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!cached) {
      logger.debug(`[OfflineService] No cached data found for key: ${key}`);
      return null;
    }

    const cachedData: CachedData<T> = JSON.parse(cached);

    // Check if data has expired
    if (cachedData.ttl) {
      const age = Date.now() - cachedData.timestamp;
      if (age > cachedData.ttl) {
        logger.debug(`[OfflineService] Cached data expired for key: ${key}`);
        await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
        return null;
      }
    }

    logger.debug(`[OfflineService] Retrieved cached data for key: ${key}`);
    return cachedData.data;
  } catch (error) {
    logger.error(`[OfflineService] Failed to get cached data for key: ${key}`, error);
    return null;
  }
};

/**
 * Clear all cached data
 */
export const clearCache = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));

    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
      logger.debug(`[OfflineService] Cleared ${cacheKeys.length} cached items`);
    } else {
      logger.debug('[OfflineService] No cached items to clear');
    }
  } catch (error) {
    logger.error('[OfflineService] Failed to clear cache:', error);
    throw error;
  }
};

/**
 * Clear cached data for a specific key
 */
export const clearCacheForKey = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
    logger.debug(`[OfflineService] Cleared cache for key: ${key}`);
  } catch (error) {
    logger.error(`[OfflineService] Failed to clear cache for key: ${key}`, error);
    throw error;
  }
};

/**
 * Queue an action for offline sync
 */
export const queueOfflineAction = async (
  type: 'order' | 'inventory',
  action: string,
  payload: Record<string, unknown>,
  maxRetries: number = 3
): Promise<string> => {
  try {
    const actionObj: OfflineAction = {
      id: generateId(),
      type,
      action,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries,
    };

    const existingQueue = await getActionQueue();
    existingQueue.push(actionObj);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(existingQueue));

    logger.debug(`[OfflineService] Queued ${type} action: ${action}`, { actionId: actionObj.id });
    return actionObj.id;
  } catch (error) {
    logger.error('[OfflineService] Failed to queue offline action:', error);
    throw error;
  }
};

/**
 * Get all queued actions
 */
export const getActionQueue = async (): Promise<OfflineAction[]> => {
  try {
    const queue = await AsyncStorage.getItem(QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    logger.error('[OfflineService] Failed to get action queue:', error);
    return [];
  }
};

/**
 * Remove an action from the queue
 */
export const removeFromQueue = async (actionId: string): Promise<void> => {
  try {
    const queue = await getActionQueue();
    const filteredQueue = queue.filter((action) => action.id !== actionId);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filteredQueue));
    logger.debug(`[OfflineService] Removed action from queue: ${actionId}`);
  } catch (error) {
    logger.error(`[OfflineService] Failed to remove action from queue: ${actionId}`, error);
    throw error;
  }
};

/**
 * Update an action in the queue (e.g., increment retry count)
 */
export const updateQueuedAction = async (actionId: string, updates: Partial<OfflineAction>): Promise<void> => {
  try {
    const queue = await getActionQueue();
    const index = queue.findIndex((action) => action.id === actionId);

    if (index !== -1) {
      queue[index] = { ...queue[index], ...updates };
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      logger.debug(`[OfflineService] Updated action in queue: ${actionId}`);
    }
  } catch (error) {
    logger.error(`[OfflineService] Failed to update action in queue: ${actionId}`, error);
    throw error;
  }
};

/**
 * Sync all queued actions when back online
 */
export const syncOfflineActions = async (
  syncFunction?: (action: OfflineAction) => Promise<boolean>
): Promise<SyncResult> => {
  const result: SyncResult = {
    success: true,
    syncedCount: 0,
    failedCount: 0,
    errors: [],
  };

  if (!(await isOnline())) {
    logger.debug('[OfflineService] Cannot sync - still offline');
    return result;
  }

  const queue = await getActionQueue();

  if (queue.length === 0) {
    logger.debug('[OfflineService] No actions to sync');
    return result;
  }

  logger.debug(`[OfflineService] Syncing ${queue.length} queued actions`);

  for (const action of queue) {
    try {
      let syncSuccess = false;

      if (syncFunction) {
        // Use custom sync function if provided
        syncSuccess = await syncFunction(action);
      } else {
        // Default sync logic based on action type
        syncSuccess = await performDefaultSync(action);
      }

      if (syncSuccess) {
        await removeFromQueue(action.id);
        result.syncedCount++;
        logger.debug(`[OfflineService] Successfully synced action: ${action.id}`);
      } else {
        // Increment retry count
        const newRetryCount = action.retryCount + 1;

        if (action.maxRetries && newRetryCount >= action.maxRetries) {
          // Max retries reached, remove from queue
          await removeFromQueue(action.id);
          result.failedCount++;
          result.errors.push({
            actionId: action.id,
            error: `Max retries (${action.maxRetries}) exceeded`,
          });
          logger.warn(`[OfflineService] Action max retries exceeded: ${action.id}`);
        } else {
          // Update retry count and keep in queue
          await updateQueuedAction(action.id, { retryCount: newRetryCount });
          result.failedCount++;
          result.errors.push({
            actionId: action.id,
            error: 'Sync failed but will retry',
          });
          logger.debug(`[OfflineService] Action will retry (attempt ${newRetryCount}): ${action.id}`);
        }
      }
    } catch (error) {
      result.failedCount++;
      result.errors.push({
        actionId: action.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      logger.error(`[OfflineService] Error syncing action: ${action.id}`, error);
    }
  }

  result.success = result.failedCount === 0;
  logger.debug(`[OfflineService] Sync complete: ${result.syncedCount} synced, ${result.failedCount} failed`);

  return result;
};

/**
 * Default sync implementation for queued actions
 */
const performDefaultSync = async (action: OfflineAction): Promise<boolean> => {
  try {
    // Import services dynamically to avoid circular dependencies
    const { orderService } = await import('./orderService');
    const inventoryModule = await import('./inventoryService');

    switch (action.type) {
      case 'order': {
        switch (action.action) {
          case 'updateStatus':
            await orderService.updateOrderStatus(
              action.payload.orderId as string,
              action.payload.data as Parameters<typeof orderService.updateOrderStatus>[1]
            );
            return true;
          case 'cancel':
            await orderService.cancelOrder(
              action.payload.orderId as string,
              action.payload.data as Parameters<typeof orderService.cancelOrder>[1]
            );
            return true;
          default:
            logger.warn(`[OfflineService] Unknown order action: ${action.action}`);
            return false;
        }
      }
      case 'inventory': {
        switch (action.action) {
          case 'updateStock':
            await inventoryModule.updateStock(
              action.payload.id as string,
              action.payload.data as Parameters<typeof inventoryModule.updateStock>[1]
            );
            return true;
          case 'bulkUpdateStock':
            await inventoryModule.bulkUpdateStock(
              action.payload.updates as Parameters<typeof inventoryModule.bulkUpdateStock>[0]
            );
            return true;
          case 'createPurchaseOrder':
            await inventoryModule.createPurchaseOrder(
              action.payload.data as Parameters<typeof inventoryModule.createPurchaseOrder>[0]
            );
            return true;
          default:
            logger.warn(`[OfflineService] Unknown inventory action: ${action.action}`);
            return false;
        }
      }
      default:
        logger.warn(`[OfflineService] Unknown action type: ${action.type}`);
        return false;
    }
  } catch (error) {
    logger.error('[OfflineService] Default sync failed:', error);
    return false;
  }
};

/**
 * Check if device is currently online
 */
export const isOnline = async (): Promise<boolean> => {
  try {
    // If we have cached network state, use it first
    if (currentNetworkState) {
      const isConnected = currentNetworkState.isConnected === true;
      const isReachable = currentNetworkState.isInternetReachable !== false;
      return isConnected && isReachable;
    }

    // Otherwise fetch fresh state
    const state = await NetInfo.fetch();
    currentNetworkState = state;
    const online = state.isConnected === true && state.isInternetReachable !== false;
    return online;
  } catch (error) {
    logger.error('[OfflineService] Error checking network status:', error);
    // Assume offline on error to be safe
    return false;
  }
};

/**
 * Add a listener for network status changes
 */
export const addNetworkListener = (callback: (isOnline: boolean) => void): (() => void) => {
  const id = generateId();
  networkListeners.set(id, callback);

  logger.debug(`[OfflineService] Added network listener: ${id}`);

  // Initialize monitoring if not already done
  initializeNetworkMonitoring().catch((error) => {
    logger.error('[OfflineService] Failed to initialize network monitoring:', error);
  });

  // Return unsubscribe function
  return () => {
    networkListeners.delete(id);
    logger.debug(`[OfflineService] Removed network listener: ${id}`);
  };
};

/**
 * Get the current queued action count
 */
export const getQueuedActionCount = async (): Promise<number> => {
  const queue = await getActionQueue();
  return queue.length;
};

/**
 * Clear all queued actions
 */
export const clearActionQueue = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
    logger.debug('[OfflineService] Cleared action queue');
  } catch (error) {
    logger.error('[OfflineService] Failed to clear action queue:', error);
    throw error;
  }
};

/**
 * Get cached data with fallback to fetch from API if cache is stale or missing
 */
export const getCachedOrFetch = async <T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<T> => {
  // Try cache first
  const cached = await getCachedData<T>(key);
  if (cached !== null) {
    return cached;
  }

  // If offline, try to get stale cache
  if (!(await isOnline())) {
    const staleCached = await getCachedData<T>(`${key}_stale`);
    if (staleCached !== null) {
      logger.debug(`[OfflineService] Using stale cache for key: ${key}`);
      return staleCached;
    }
    throw new Error('No cached data available and offline');
  }

  // Fetch fresh data
  try {
    const freshData = await fetchFn();
    await cacheData(key, freshData, ttl);
    // Also cache as stale for offline fallback
    await cacheData(`${key}_stale`, freshData);
    return freshData;
  } catch (error) {
    // If fetch fails, try stale cache
    const staleCached = await getCachedData<T>(`${key}_stale`);
    if (staleCached !== null) {
      logger.debug(`[OfflineService] Fetch failed, using stale cache for key: ${key}`);
      return staleCached;
    }
    throw error;
  }
};

/**
 * Initialize the offline service
 */
export const initializeOfflineService = async (): Promise<void> => {
  await initializeNetworkMonitoring();
  logger.debug('[OfflineService] Offline service initialized');
};

// Export the initialize function for app startup
export default {
  cacheData,
  getCachedData,
  clearCache,
  clearCacheForKey,
  queueOfflineAction,
  getActionQueue,
  removeFromQueue,
  updateQueuedAction,
  syncOfflineActions,
  isOnline,
  addNetworkListener,
  getQueuedActionCount,
  clearActionQueue,
  getCachedOrFetch,
  initializeOfflineService,
};
