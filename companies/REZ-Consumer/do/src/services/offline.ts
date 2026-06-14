import logger from './utils/logger';

import { MMKV } from 'react-native-mmkv';
import NetInfo from '@react-native-community/netinfo';
import { rezApi } from './rezApi';

// Initialize MMKV storage
const storage = new MMKV({ id: 'do-offline-storage' });

// Safe JSON parse with fallback
function safeJsonParse<T>(json: string | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    logger.error('JSON parse error, using fallback:', error);
    return fallback;
  }
}

// Queue for pending operations
interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: unknown;
  timestamp: number;
}

class OfflineService {
  private pendingQueue: PendingOperation[] = [];
  private isOnline = true;
  private listeners: Set<(online: boolean) => void> = new Set();
  private isProcessingQueue = false;

  constructor() {
    this.init();
  }

  private async init() {
    // Load pending queue from storage with error handling
    const queue = storage.getString('pendingQueue');
    this.pendingQueue = safeJsonParse<PendingOperation[]>(queue, []);

    // Monitor network status
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (wasOffline && this.isOnline) {
        this.processPendingQueue();
      }

      this.notifyListeners();
    });
  }

  isConnected(): boolean {
    return this.isOnline;
  }

  addConnectionListener(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    this.listeners.forEach((callback) => callback(this.isOnline));
  }

  async queueOperation(operation: Omit<PendingOperation, 'id' | 'timestamp'>): Promise<void> {
    // Generate secure ID for operation
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 11);
    const pendingOp: PendingOperation = {
      ...operation,
      id: `op_${timestamp}-${randomPart}`,
      timestamp: Date.now(),
    };

    this.pendingQueue.push(pendingOp);
    await this.saveQueue();
  }

  private async saveQueue(): Promise<void> {
    try {
      storage.set('pendingQueue', JSON.stringify(this.pendingQueue));
    } catch (error) {
      logger.error('Failed to save pending queue:', error);
    }
  }

  async processPendingQueue(): Promise<void> {
    if (!this.isOnline || this.pendingQueue.length === 0 || this.isProcessingQueue) {
      return;
    }

    this.isProcessingQueue = true;
    const failedOps: PendingOperation[] = [];

    for (const op of this.pendingQueue) {
      try {
        await this.executeOperation(op);
        logger.info(`Offline operation executed: ${op.type} ${op.endpoint}`);
      } catch (error) {
        logger.error(`Offline operation failed: ${op.type} ${op.endpoint}`, error);
        // Only retry if it's a transient error (network, timeout)
        const isTransient = this.isTransientError(error);
        if (isTransient && Date.now() - op.timestamp < 24 * 60 * 60 * 1000) {
          failedOps.push(op);
        }
      }
    }

    this.pendingQueue = failedOps;
    await this.saveQueue();
    this.isProcessingQueue = false;
  }

  private isTransientError(error: unknown): boolean {
    if (error && typeof error === 'object') {
      const axiosError = error as { code?: string; message?: string };
      // Network errors, timeouts are transient
      if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'NETWORK_ERROR') {
        return true;
      }
    }
    return false;
  }

  private async executeOperation(op: PendingOperation): Promise<void> {
    switch (op.method) {
      case 'POST':
        await rezApi.post(op.endpoint, op.data as Record<string, unknown>);
        break;
      case 'PUT':
        await rezApi.put(op.endpoint, op.data as Record<string, unknown>);
        break;
      case 'PATCH':
        await rezApi.patch(op.endpoint, op.data as Record<string, unknown>);
        break;
      case 'DELETE':
        await rezApi.delete(op.endpoint);
        break;
      default:
        logger.warn(`Unsupported method: ${op.method}`);
    }
  }

  async cacheResponse(key: string, data: unknown, ttl = 5 * 60 * 1000): Promise<void> {
    const cacheEntry = {
      data,
      expiresAt: Date.now() + ttl,
    };
    try {
      storage.set(`cache_${key}`, JSON.stringify(cacheEntry));
    } catch (error) {
      logger.error('Failed to cache response:', error);
    }
  }

  async getCachedResponse<T>(key: string): Promise<T | null> {
    const cached = storage.getString(`cache_${key}`);
    if (!cached) return null;

    const entry = safeJsonParse<{ data: T; expiresAt: number } | null>(cached, null);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      storage.delete(`cache_${key}`);
      return null;
    }
    return entry.data;
  }

  async clearCache(): Promise<void> {
    const keys = storage.getAllKeys();
    keys.forEach((key) => {
      if (key.startsWith('cache_')) {
        storage.delete(key);
      }
    });
  }

  async cacheUserData(userId: string, data: unknown): Promise<void> {
    try {
      storage.set(`user_${userId}`, JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to cache user data:', error);
    }
  }

  async getCachedUserData<T>(userId: string): Promise<T | null> {
    const cached = storage.getString(`user_${userId}`);
    return safeJsonParse<T | null>(cached, null);
  }

  getPendingCount(): number {
    return this.pendingQueue.length;
  }

  async clearPendingQueue(): Promise<void> {
    this.pendingQueue = [];
    storage.delete('pendingQueue');
  }
}

export const offlineService = new OfflineService();
export default offlineService;
