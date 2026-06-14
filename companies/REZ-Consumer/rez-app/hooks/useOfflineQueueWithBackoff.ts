// @ts-nocheck
/**
 * useOfflineQueueWithBackoff - Offline queue with exponential backoff retry
 *
 * PRODUCTION-READY: Includes retry with exponential backoff and jitter
 *
 * @example
 * ```tsx
 * const { addToQueue, syncQueue, queueStatus } = useOfflineQueueWithBackoff({
 *   maxRetries: 5,
 *   baseDelay: 1000,
 * });
 * ```
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';

interface QueuedItem<T = unknown> {
  id: string;
  data: T;
  timestamp: number;
  attempts: number;
  lastAttempt?: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

interface QueueStatus {
  total: number;
  pending: number;
  uploading: number;
  completed: number;
  failed: number;
}

interface UseOfflineQueueOptions {
  /** Storage key for persistence */
  storageKey?: string;
  /** Maximum retry attempts (default: 5) */
  maxRetries?: number;
  /** Base delay for exponential backoff in ms (default: 1000) */
  baseDelay?: number;
  /** Maximum delay in ms (default: 60000) */
  maxDelay?: number;
  /** Sync function that receives the queued data */
  syncFn: (data: unknown) => Promise<void>;
  /** Called when an item completes */
  onComplete?: (item: QueuedItem) => void;
  /** Called when an item fails after max retries */
  onFailed?: (item: QueuedItem) => void;
  /** Called when queue status changes */
  onStatusChange?: (status: QueueStatus) => void;
  /** Auto-sync when network becomes available (default: true) */
  autoSyncOnReconnect?: boolean;
}

interface UseOfflineQueueReturn {
  /** Add an item to the queue */
  addToQueue: (data: unknown, id?: string) => Promise<string>;
  /** Manually trigger sync */
  syncQueue: () => Promise<void>;
  /** Retry failed items */
  retryFailed: () => Promise<void>;
  /** Remove an item from the queue */
  removeItem: (id: string) => Promise<void>;
  /** Clear completed items */
  clearCompleted: () => Promise<void>;
  /** Clear all items */
  clearAll: () => Promise<void>;
  /** Current queue status */
  status: QueueStatus;
  /** Whether currently syncing */
  isSyncing: boolean;
  /** Whether device is online */
  isOnline: boolean;
  /** Get a specific queue item */
  getItem: (id: string) => QueuedItem | undefined;
  /** Get all items */
  getAllItems: () => QueuedItem[];
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateBackoffDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number
): number {
  // Exponential backoff: base * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);

  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, maxDelay);

  // Add jitter (±30% randomness to prevent thundering herd)
  const jitter = (Math.random() - 0.5) * 0.6 * cappedDelay;

  return Math.round(cappedDelay + jitter);
}

/**
 * Generate a unique ID for queue items
 */
function generateId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Offline queue hook with exponential backoff retry
 */
export function useOfflineQueueWithBackoff(
  options: UseOfflineQueueOptions
): UseOfflineQueueReturn {
  const {
    storageKey = 'offline_queue',
    maxRetries = 5,
    baseDelay = 1000,
    maxDelay = 60000,
    syncFn,
    onComplete,
    onFailed,
    onStatusChange,
    autoSyncOnReconnect = true,
  } = options;

  // State
  const [queue, setQueue] = useState<QueuedItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Refs for stable callbacks
  const syncFnRef = useRef(syncFn);
  const onCompleteRef = useRef(onComplete);
  const onFailedRef = useRef(onFailed);
  const onStatusChangeRef = useRef(onStatusChange);
  const isSyncingRef = useRef(false);
  const retryTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Update refs when callbacks change
  useEffect(() => {
    syncFnRef.current = syncFn;
    onCompleteRef.current = onComplete;
    onFailedRef.current = onFailed;
    onStatusChangeRef.current = onStatusChange;
  }, [syncFn, onComplete, onFailed, onStatusChange]);

  // Load queue from storage on mount
  useEffect(() => {
    loadQueue();
  }, []);

  // Network status monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected && state.isInternetReachable !== false;
      setIsOnline(online);

      // Auto-sync when coming back online
      if (online && autoSyncOnReconnect && !isSyncingRef.current) {
        logger.info('[OfflineQueue] Network restored, triggering sync');
        syncQueue();
      }
    });

    return () => unsubscribe();
  }, [autoSyncOnReconnect]);

  // Save queue to storage
  const saveQueue = useCallback(async (items: QueuedItem[]) => {
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(items));
    } catch (error) {
      logger.error('[OfflineQueue] Failed to save queue', { error });
    }
  }, [storageKey]);

  // Load queue from storage
  const loadQueue = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        const items = JSON.parse(stored) as QueuedItem[];
        setQueue(items);
        updateStatus(items);
      }
    } catch (error) {
      logger.error('[OfflineQueue] Failed to load queue', { error });
    }
  }, [storageKey]);

  // Update status and notify
  const updateStatus = useCallback((items: QueuedItem[]) => {
    const status: QueueStatus = {
      total: items.length,
      pending: items.filter((i) => i.status === 'pending').length,
      uploading: items.filter((i) => i.status === 'uploading').length,
      completed: items.filter((i) => i.status === 'completed').length,
      failed: items.filter((i) => i.status === 'failed').length,
    };
    onStatusChangeRef.current?.(status);
  }, []);

  // Add item to queue
  const addToQueue = useCallback(
    async (data: unknown, id?: string): Promise<string> => {
      const itemId = id || generateId();

      const newItem: QueuedItem = {
        id: itemId,
        data,
        timestamp: Date.now(),
        attempts: 0,
        status: 'pending',
      };

      setQueue((prev) => {
        const updated = [...prev, newItem];
        saveQueue(updated);
        updateStatus(updated);
        return updated;
      });

      logger.debug('[OfflineQueue] Added item', { id: itemId });

      // Try to sync immediately if online
      if (isOnline && !isSyncingRef.current) {
        // Schedule sync without blocking
        setTimeout(() => syncQueue(), 0);
      }

      return itemId;
    },
    [isOnline, saveQueue, updateStatus]
  );

  // Process a single item with backoff
  const processItem = useCallback(
    async (item: QueuedItem): Promise<boolean> => {
      const delay = calculateBackoffDelay(item.attempts, baseDelay, maxDelay);

      // Wait for backoff delay
      if (item.attempts > 0) {
        logger.debug('[OfflineQueue] Waiting for backoff', {
          id: item.id,
          attempt: item.attempts,
          delay,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      // Check if still mounted and online
      if (!isOnline) {
        logger.debug('[OfflineQueue] Skipping - offline', { id: item.id });
        return false;
      }

      // Mark as uploading
      setQueue((prev) => {
        const updated = prev.map((i) =>
          i.id === item.id ? { ...i, status: 'uploading' as const, lastAttempt: Date.now() } : i
        );
        saveQueue(updated);
        return updated;
      });

      try {
        await syncFnRef.current(item.data);

        // Mark as completed
        setQueue((prev) => {
          const updated = prev.map((i) =>
            i.id === item.id ? { ...i, status: 'completed' as const } : i
          );
          saveQueue(updated);
          updateStatus(updated);
          return updated;
        });

        onCompleteRef.current?.(item);
        logger.info('[OfflineQueue] Item synced successfully', { id: item.id });
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        logger.warn('[OfflineQueue] Sync failed', {
          id: item.id,
          attempt: item.attempts + 1,
          error: errorMessage,
        });

        const newAttempts = item.attempts + 1;
        const hasFailed = newAttempts >= maxRetries;

        // Mark as failed or pending (for retry)
        setQueue((prev) => {
          const updated = prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  attempts: newAttempts,
                  status: hasFailed ? ('failed' as const) : ('pending' as const),
                  error: errorMessage,
                }
              : i
          );
          saveQueue(updated);
          updateStatus(updated);
          return updated;
        });

        if (hasFailed) {
          onFailedRef.current?.(item);
          logger.error('[OfflineQueue] Item failed after max retries', {
            id: item.id,
            attempts: newAttempts,
          });
        }

        return false;
      }
    },
    [isOnline, baseDelay, maxDelay, maxRetries, saveQueue, updateStatus]
  );

  // Sync entire queue
  const syncQueue = useCallback(async () => {
    if (isSyncingRef.current || !isOnline) {
      return;
    }

    isSyncingRef.current = true;
    setIsSyncing(true);

    logger.info('[OfflineQueue] Starting sync');

    try {
      // Get pending and failed items
      const pendingItems = queue.filter(
        (i) => i.status === 'pending' || i.status === 'failed'
      );

      // Process sequentially to avoid overwhelming the server
      for (const item of pendingItems) {
        if (!isOnline) break;
        await processItem(item);
      }

      logger.info('[OfflineQueue] Sync complete');
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [isOnline, queue, processItem]);

  // Retry failed items
  const retryFailed = useCallback(async () => {
    // Reset failed items to pending
    setQueue((prev) => {
      const updated = prev.map((i) =>
        i.status === 'failed' ? { ...i, status: 'pending' as const, attempts: 0, error: undefined } : i
      );
      saveQueue(updated);
      updateStatus(updated);
      return updated;
    });

    // Trigger sync
    await syncQueue();
  }, [saveQueue, updateStatus, syncQueue]);

  // Remove item
  const removeItem = useCallback(
    async (id: string) => {
      // Clear any pending retry
      const timeout = retryTimeoutsRef.current.get(id);
      if (timeout) {
        clearTimeout(timeout);
        retryTimeoutsRef.current.delete(id);
      }

      setQueue((prev) => {
        const updated = prev.filter((i) => i.id !== id);
        saveQueue(updated);
        updateStatus(updated);
        return updated;
      });
    },
    [saveQueue, updateStatus]
  );

  // Clear completed items
  const clearCompleted = useCallback(async () => {
    setQueue((prev) => {
      const updated = prev.filter((i) => i.status !== 'completed');
      saveQueue(updated);
      updateStatus(updated);
      return updated;
    });
  }, [saveQueue, updateStatus]);

  // Clear all items
  const clearAll = useCallback(async () => {
    // Clear all pending retries
    retryTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    retryTimeoutsRef.current.clear();

    setQueue([]);
    saveQueue([]);
    updateStatus([]);
  }, [saveQueue, updateStatus]);

  // Get item by ID
  const getItem = useCallback(
    (id: string): QueuedItem | undefined => {
      return queue.find((i) => i.id === id);
    },
    [queue]
  );

  // Get all items
  const getAllItems = useCallback((): QueuedItem[] => {
    return [...queue];
  }, [queue]);

  // Compute status
  const status: QueueStatus = {
    total: queue.length,
    pending: queue.filter((i) => i.status === 'pending').length,
    uploading: queue.filter((i) => i.status === 'uploading').length,
    completed: queue.filter((i) => i.status === 'completed').length,
    failed: queue.filter((i) => i.status === 'failed').length,
  };

  return {
    addToQueue,
    syncQueue,
    retryFailed,
    removeItem,
    clearCompleted,
    clearAll,
    status,
    isSyncing,
    isOnline,
    getItem,
    getAllItems,
  };
}

export default useOfflineQueueWithBackoff;
