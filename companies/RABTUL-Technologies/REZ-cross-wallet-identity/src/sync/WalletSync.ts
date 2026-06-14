import logger from './utils/logger';

/**
 * WalletSync - Synchronizes wallet data across providers
 *
 * Handles periodic syncing, real-time updates, and conflict resolution
 */

import EventEmitter from 'eventemitter3';
import {
  Wallet,
  SyncStatus,
  SyncResult,
  WalletEvent,
  WalletBalance
} from '../types';
import { SyncError, WalletNotFoundError } from '../errors';

/**
 * Sync configuration
 */
interface SyncConfig {
  intervalMs: number;
  retryAttempts: number;
  retryDelayMs: number;
  enableRealTime?: boolean;
}

/**
 * Sync status per wallet
 */
interface WalletSyncStatus {
  walletId: string;
  status: SyncStatus;
  lastSynced: string;
  lastError?: string;
  retryCount: number;
}

/**
 * Sync queue item
 */
interface SyncQueueItem {
  walletId: string;
  priority: 'high' | 'normal' | 'low';
  timestamp: string;
  attempts: number;
}

/**
 * WalletSync implementation
 */
export class WalletSync {
  private wallets: Map<string, Wallet>;
  private syncStatuses: Map<string, WalletSyncStatus> = new Map();
  private syncQueue: SyncQueueItem[] = [];
  private eventEmitter: EventEmitter;
  private intervalMs: number;
  private intervalId?: NodeJS.Timeout;
  private isRunning: boolean = false;
  private retryAttempts: number;
  private retryDelayMs: number;

  constructor(wallets: Map<string, Wallet>, intervalMs: number = 30000) {
    this.wallets = wallets;
    this.intervalMs = intervalMs;
    this.retryAttempts = 3;
    this.retryDelayMs = 5000;
    this.eventEmitter = new EventEmitter();
  }

  /**
   * Start automatic sync
   */
  start(): void {
    if (this.isRunning) {
      logger.info('WalletSync already running');
      return;
    }

    this.isRunning = true;
    logger.info(`WalletSync started with interval: ${this.intervalMs}ms`);

    // Initial sync
    this.syncAll().catch(err => {
      console.error('Initial sync failed:', err);
    });

    // Set up interval
    this.intervalId = setInterval(() => {
      this.processSyncQueue();
    }, this.intervalMs);
  }

  /**
   * Stop automatic sync
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isRunning = false;
    logger.info('WalletSync stopped');
  }

  /**
   * Sync all wallets
   */
  async syncAll(): Promise<SyncResult> {
    const startTime = Date.now();
    const walletIds = Array.from(this.wallets.keys());
    const syncedWallets: string[] = [];
    const failedWallets: Array<{ wallet_id: string; error: string }> = [];

    for (const walletId of walletIds) {
      try {
        await this.syncWallet(walletId);
        syncedWallets.push(walletId);
      } catch (error) {
        failedWallets.push({
          wallet_id: walletId,
          error: (error as Error).message
        });
      }
    }

    const result: SyncResult = {
      status: failedWallets.length === 0
        ? SyncStatus.IDLE
        : failedWallets.length === walletIds.length
          ? SyncStatus.ERROR
          : SyncStatus.PARTIAL,
      synced_wallets: syncedWallets,
      failed_wallets: failedWallets,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime
    };

    // Emit completion event
    this.emitSyncCompletedEvent(result);

    return result;
  }

  /**
   * Sync a specific wallet
   */
  async syncWallet(walletId: string): Promise<void> {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new WalletNotFoundError(walletId);
    }

    // Update status
    this.updateSyncStatus(walletId, SyncStatus.SYNCING);

    try {
      // Fetch fresh balance from provider
      const newBalance = await this.fetchBalanceFromProvider(wallet);

      // Update wallet with new balance
      const previousBalance = wallet.balance;
      wallet.balance = newBalance.balance;
      wallet.metadata = {
        ...wallet.metadata,
        last_synced: new Date().toISOString()
      };

      // Update sync status
      this.updateSyncStatus(walletId, SyncStatus.IDLE, undefined, previousBalance !== newBalance.balance);

    } catch (error) {
      const errorMessage = (error as Error).message;
      this.updateSyncStatus(walletId, SyncStatus.ERROR, errorMessage);

      // Queue for retry if not exceeded attempts
      const status = this.syncStatuses.get(walletId);
      if (status && status.retryCount < this.retryAttempts) {
        this.queueSync(walletId, 'normal');
      }

      throw new SyncError(
        `Failed to sync wallet ${walletId}: ${errorMessage}`,
        [walletId]
      );
    }
  }

  /**
   * Queue a wallet for sync
   */
  queueSync(walletId: string, priority: 'high' | 'normal' | 'low' = 'normal'): void {
    // Check if already queued
    const existingIndex = this.syncQueue.findIndex(item => item.walletId === walletId);
    if (existingIndex >= 0) {
      // Update priority if higher
      const existing = this.syncQueue[existingIndex];
      if (priority === 'high' || (priority === 'normal' && existing.priority === 'low')) {
        existing.priority = priority;
        existing.timestamp = new Date().toISOString();
      }
      return;
    }

    this.syncQueue.push({
      walletId,
      priority,
      timestamp: new Date().toISOString(),
      attempts: 0
    });

    // Sort queue by priority
    this.syncQueue.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Process sync queue
   */
  private async processSyncQueue(): Promise<void> {
    if (this.syncQueue.length === 0) {
      return;
    }

    const item = this.syncQueue.shift()!;
    const status = this.syncStatuses.get(item.walletId);

    // Check if exceeded retry attempts
    if (status && status.retryCount >= this.retryAttempts) {
      logger.info(`Wallet ${item.walletId} exceeded retry attempts, skipping`);
      return;
    }

    try {
      await this.syncWallet(item.walletId);
    } catch {
      item.attempts++;
      // Re-queue if not exceeded attempts
      if (item.attempts < this.retryAttempts) {
        this.queueSync(item.walletId, 'normal');
      }
    }
  }

  /**
   * Fetch balance from provider (simulated)
   */
  private async fetchBalanceFromProvider(wallet: Wallet): Promise<WalletBalance> {
    // In production, this would call actual provider APIs
    // For now, simulate with a delay
    await this.simulateNetworkDelay();

    // Return current balance (in production, fetch from chain/API)
    return {
      wallet_id: wallet.wallet_id,
      type: wallet.type,
      balance: wallet.balance,
      currency: wallet.currency,
      last_synced: new Date().toISOString(),
      pending_transactions: 0
    };
  }

  /**
   * Simulate network delay
   */
  private simulateNetworkDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Update sync status
   */
  private updateSyncStatus(
    walletId: string,
    status: SyncStatus,
    error?: string,
    hasChanges: boolean = false
  ): void {
    const currentStatus = this.syncStatuses.get(walletId) || {
      walletId,
      status: SyncStatus.IDLE,
      lastSynced: new Date().toISOString(),
      retryCount: 0
    };

    this.syncStatuses.set(walletId, {
      ...currentStatus,
      status,
      lastSynced: status === SyncStatus.SYNCING ? currentStatus.lastSynced : new Date().toISOString(),
      lastError: error,
      retryCount: error ? currentStatus.retryCount + 1 : 0
    });

    // Emit balance update if changed
    if (hasChanges && status === SyncStatus.IDLE) {
      const wallet = this.wallets.get(walletId);
      if (wallet) {
        const event: WalletEvent = {
          type: 'balance_updated',
          wallet_id: walletId,
          user_id: wallet.metadata?.userId as string || '',
          timestamp: new Date().toISOString(),
          data: { balance: wallet.balance }
        };
        this.eventEmitter.emit('balance_updated', event);
      }
    }
  }

  /**
   * Get sync status for all wallets
   */
  getSyncStatuses(): WalletSyncStatus[] {
    return Array.from(this.syncStatuses.values());
  }

  /**
   * Get sync status for a specific wallet
   */
  getSyncStatus(walletId: string): WalletSyncStatus | undefined {
    return this.syncStatuses.get(walletId);
  }

  /**
   * Force refresh sync status
   */
  async forceRefresh(walletId: string): Promise<void> {
    const status = this.syncStatuses.get(walletId);
    if (status) {
      status.retryCount = 0;
    }
    await this.syncWallet(walletId);
  }

  /**
   * Clear sync queue
   */
  clearQueue(): void {
    this.syncQueue = [];
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.syncQueue.length;
  }

  /**
   * Check if sync is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Emit sync completed event
   */
  private emitSyncCompletedEvent(result: SyncResult): void {
    const event: WalletEvent = {
      type: 'sync_completed',
      wallet_id: '',
      user_id: '',
      timestamp: result.timestamp,
      data: {
        synced_wallets: result.synced_wallets,
        failed_wallets: result.failed_wallets,
        duration_ms: result.duration_ms
      }
    };
    this.eventEmitter.emit('sync_completed', event);
  }

  /**
   * Event subscription
   */
  on(event: string, handler: (event: WalletEvent) => void): void {
    this.eventEmitter.on(event, handler);
  }

  /**
   * Remove event subscription
   */
  off(event: string, handler: (event: WalletEvent) => void): void {
    this.eventEmitter.off(event, handler);
  }
}

export { WalletSync as default };
