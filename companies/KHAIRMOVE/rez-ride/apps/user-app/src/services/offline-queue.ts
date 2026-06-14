import { logger } from '../../shared/logger';
/**
 * Offline Queue Service
 * Handles requests when offline and processes them when back online
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

interface QueuedRequest {
  id: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
}

const STORAGE_KEY = 'rez_offline_queue';
const MAX_RETRIES = 3;

class OfflineQueueService {
  private queue: QueuedRequest[] = [];
  private isOnline: boolean = true;
  private isProcessing: boolean = false;
  private listeners: Set<(online: boolean) => void> = new Set();

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    await this.loadQueue();
    await this.checkConnectivity();
    this.setupConnectivityListener();
  }

  /**
   * Check current connectivity status
   */
  async checkConnectivity(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      this.isOnline = state.isConnected ?? false;
      return this.isOnline;
    } catch (error) {
      logger.error('Connectivity check failed:', error);
      this.isOnline = false;
      return false;
    }
  }

  /**
   * Subscribe to connectivity changes
   */
  private setupConnectivityListener(): void {
    NetInfo.addEventListener((state) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // Notify listeners
      this.listeners.forEach((listener) => listener(this.isOnline));

      // Process queue when coming back online
      if (!wasOnline && this.isOnline) {
        this.processQueue();
      }
    });
  }

  /**
   * Add listener for connectivity changes
   */
  onConnectivityChange(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Check if currently online
   */
  isConnected(): boolean {
    return this.isOnline;
  }

  /**
   * Add request to queue
   */
  async addToQueue(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const queuedRequest: QueuedRequest = {
      ...request,
      id,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(queuedRequest);
    await this.saveQueue();

    logger.info(`Request queued: ${request.method} ${request.endpoint}`);
    return id;
  }

  /**
   * Process all queued requests
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    logger.info(`Processing queue: ${this.queue.length} requests`);

    const processedIds: string[] = [];
    const failedIds: string[] = [];

    for (const request of [...this.queue]) {
      try {
        await this.executeRequest(request);
        processedIds.push(request.id);
        logger.info(`Request completed: ${request.method} ${request.endpoint}`);
      } catch (error) {
        logger.error(`Request failed: ${request.method} ${request.endpoint}`, error);

        if (request.retryCount < MAX_RETRIES) {
          // Increment retry count and move to end of queue
          request.retryCount++;
          failedIds.push(request.id);
        } else {
          // Max retries reached, mark as failed
          processedIds.push(request.id);
        }
      }
    }

    // Remove processed and max-retried requests
    this.queue = this.queue.filter(
      (r) => !processedIds.includes(r.id)
    );
    await this.saveQueue();

    this.isProcessing = false;
    logger.info(`Queue processed. Remaining: ${this.queue.length}`);
  }

  /**
   * Execute a single queued request
   */
  private async executeRequest(request: QueuedRequest): Promise<Response> {
    const response = await fetch(`${request.endpoint}`, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        ...request.headers,
      },
      body: request.body ? JSON.stringify(request.body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response;
  }

  /**
   * Get queue status
   */
  getQueueStatus(): { count: number; isOnline: boolean; isProcessing: boolean } {
    return {
      count: this.queue.length,
      isOnline: this.isOnline,
      isProcessing: this.isProcessing,
    };
  }

  /**
   * Clear queue
   */
  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
  }

  /**
   * Load queue from storage
   */
  private async loadQueue(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        this.queue = JSON.parse(data);
        // Filter out old requests (older than 24 hours)
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        this.queue = this.queue.filter((r) => r.timestamp > oneDayAgo);
      }
    } catch (error) {
      logger.error('Failed to load queue:', error);
      this.queue = [];
    }
  }

  /**
   * Save queue to storage
   */
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      logger.error('Failed to save queue:', error);
    }
  }
}

export const offlineQueue = new OfflineQueueService();
export default offlineQueue;
