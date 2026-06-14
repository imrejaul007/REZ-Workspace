/**
 * Offline Queue
 * Queue operations for later execution when network is available
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './logger';

// ============================================================================
// TYPES
// ============================================================================

export interface QueuedOperation<T = unknown> {
  id: string;
  type: string;
  payload: T;
  createdAt: number;
  retries: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface OfflineQueueConfig {
  storageKey?: string;
  maxQueueSize?: number;
  maxRetries?: number;
  onProcess?: (operation: QueuedOperation) => Promise<void>;
  onOnline?: () => void;
  onOffline?: () => void;
}

// ============================================================================
// OFFLINE QUEUE
// ============================================================================

class OfflineQueueService {
  private queue: QueuedOperation[] = [];
  private config: Required<OfflineQueueConfig>;
  private isProcessing = false;
  private isOnline = true;
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  constructor(config: OfflineQueueConfig = {}) {
    this.config = {
      storageKey: config.storageKey || 'rez_offline_queue',
      maxQueueSize: config.maxQueueSize || 100,
      maxRetries: config.maxRetries || 3,
      onProcess: config.onProcess || this.defaultProcess,
      // @ts-ignore
      onOnline: config.onOnline,
      // @ts-ignore
      onOffline: config.onOffline,
    };

    this.loadQueue();
    this.setupNetworkListener();
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Add operation to queue
   */
  async enqueue<T>(type: string, payload: T): Promise<string> {
    const operation: QueuedOperation<T> = {
      id: this.generateId(),
      type,
      payload,
      createdAt: Date.now(),
      retries: 0,
      status: 'pending',
    };

    // Remove oldest if queue is full
    if (this.queue.length >= this.config.maxQueueSize) {
      this.queue.shift();
    }

    this.queue.push(operation);
    await this.saveQueue();

    logger.debug(`[OfflineQueue] Enqueued: ${type}`, { id: operation.id });

    // Try to process immediately if online
    if (this.isOnline) {
      this.processQueue();
    }

    return operation.id;
  }

  /**
   * Remove operation from queue
   */
  async dequeue(id: string): Promise<boolean> {
    const index = this.queue.findIndex((op) => op.id === id);
    if (index === -1) return false;

    this.queue.splice(index, 1);
    await this.saveQueue();

    logger.debug(`[OfflineQueue] Dequeued: ${id}`);
    return true;
  }

  /**
   * Get all queued operations
   */
  getQueue(): QueuedOperation[] {
    return [...this.queue];
  }

  /**
   * Get queue size
   */
  getSize(): number {
    return this.queue.length;
  }

  /**
   * Check if online
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Set online status manually
   */
  setOnlineStatus(isOnline: boolean): void {
    this.setNetworkStatus(isOnline);
  }

  /**
   * Add listener for online/offline events
   */
  addListener(listener: (isOnline: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Process queue manually
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || !this.isOnline) return;

    this.isProcessing = true;

    try {
      const pendingOps = this.queue.filter((op) => op.status === 'pending');

      for (const operation of pendingOps) {
        await this.processOperation(operation);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Clear all queued operations
   */
  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
    logger.debug('[OfflineQueue] Queue cleared');
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async loadQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.config.storageKey);
      if (stored) {
        this.queue = JSON.parse(stored);
        logger.debug(`[OfflineQueue] Loaded ${this.queue.length} operations`);
      }
    } catch (error) {
      logger.error('[OfflineQueue] Failed to load queue', error as Error);
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.config.storageKey,
        JSON.stringify(this.queue)
      );
    } catch (error) {
      logger.error('[OfflineQueue] Failed to save queue', error as Error);
    }
  }

  private setupNetworkListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.setNetworkStatus(true));
      window.addEventListener('offline', () => this.setNetworkStatus(false));
    }
  }

  private setNetworkStatus(isOnline: boolean): void {
    if (this.isOnline === isOnline) return;

    this.isOnline = isOnline;

    logger.debug(`[OfflineQueue] Network status: ${isOnline ? 'online' : 'offline'}`);

    // Notify listeners
    this.listeners.forEach((listener) => listener(isOnline));

    // Call callbacks
    if (isOnline) {
      this.config.onOnline?.();
      this.processQueue();
    } else {
      this.config.onOffline?.();
    }
  }

  private async processOperation(operation: QueuedOperation): Promise<void> {
    operation.status = 'processing';
    await this.saveQueue();

    try {
      await this.config.onProcess(operation);

      operation.status = 'completed';
      await this.saveQueue();

      // Remove completed operations after a delay
      setTimeout(() => {
        this.dequeue(operation.id);
      }, 5000);

      logger.debug(`[OfflineQueue] Processed: ${operation.type}`, { id: operation.id });
    } catch (error) {
      operation.retries++;
      operation.error = (error as Error).message;

      if (operation.retries >= this.config.maxRetries) {
        operation.status = 'failed';
        logger.error(
          `[OfflineQueue] Failed permanently: ${operation.type}`,
          error as Error
        );
      } else {
        operation.status = 'pending';
        logger.debug(
          `[OfflineQueue] Retry ${operation.retries}/${this.config.maxRetries}: ${operation.type}`
        );
      }

      await this.saveQueue();
    }
  }

  private defaultProcess(operation: QueuedOperation): Promise<void> {
    // Default implementation - should be overridden
    logger.debug(`[OfflineQueue] Processing: ${operation.type}`);
    return Promise.resolve();
  }

  private generateId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const offlineQueue = new OfflineQueueService({
  storageKey: 'rez_offline_queue',
  maxQueueSize: 100,
  maxRetries: 3,
});

// ============================================================================
// HOOK
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to use offline queue in components
 */
export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState(offlineQueue.getOnlineStatus());
  const [queueSize, setQueueSize] = useState(offlineQueue.getSize());

  useEffect(() => {
    const unsubscribe = offlineQueue.addListener((online) => {
      setIsOnline(online);
    });

    // Poll queue size periodically
    const interval = setInterval(() => {
      setQueueSize(offlineQueue.getSize());
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const enqueue = useCallback(
    async <T>(type: string, payload: T): Promise<string> => {
      return offlineQueue.enqueue(type, payload);
    },
    []
  );

  const processNow = useCallback(async (): Promise<void> => {
    return offlineQueue.processQueue();
  }, []);

  return {
    isOnline,
    queueSize,
    enqueue,
    processNow,
    clearQueue: offlineQueue.clearQueue.bind(offlineQueue),
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export default offlineQueue;
