import logger from './utils/logger';

import cron from 'node-cron';
import { Platform, SyncEntity } from '../types';
import { getSyncService } from '../services/syncService';
import config from '../config';

export interface SyncWorkerConfig {
  enabled: boolean;
  syncIntervalMinutes: number;
  platforms: Platform[];
  onSyncStart?: (platform: Platform) => void;
  onSyncComplete?: (result) => void;
  onSyncError?: (platform: Platform, error: Error) => void;
}

export class SyncWorker {
  private cronJob: cron.ScheduledTask | null = null;
  private config: SyncWorkerConfig;
  private syncService = getSyncService();
  private isRunning: boolean = false;
  // Using plain object instead of Map for simple key-value tracking
  private lastSyncTime: Record<Platform, Date> = {} as Record<Platform, Date>;

  constructor(config?: Partial<SyncWorkerConfig>) {
    this.config = {
      enabled: config?.enabled ?? true,
      syncIntervalMinutes: config?.syncIntervalMinutes ?? config.sync.intervalMinutes,
      platforms: config?.platforms ?? ['zendesk', 'freshdesk', 'intercom'],
      onSyncStart: config?.onSyncStart,
      onSyncComplete: config?.onSyncComplete,
      onSyncError: config?.onSyncError,
    };
  }

  // Start the sync worker
  start(): void {
    if (this.cronJob) {
      logger.info('Sync worker already running');
      return;
    }

    if (!this.config.enabled) {
      logger.info('Sync worker is disabled');
      return;
    }

    // Create cron expression for interval
    const intervalMinutes = this.config.syncIntervalMinutes;
    const cronExpression = `*/${intervalMinutes} * * * *`;

    this.cronJob = cron.schedule(cronExpression, async () => {
      await this.runSync();
    });

    logger.info(`Sync worker started with ${intervalMinutes} minute interval`);
    logger.info(`Monitoring platforms: ${this.config.platforms.join(', ')}`);

    // Run initial sync
    this.runSync().catch((error) => {
      logger.error('Initial sync failed:', error);
    });
  }

  // Stop the sync worker
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('Sync worker stopped');
    }
  }

  // Run sync for all configured platforms
  async runSync(): Promise<void> {
    if (this.isRunning) {
      logger.info('Sync already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    logger.info(`Starting sync at ${new Date().toISOString()}`);

    const startTime = Date.now();

    try {
      for (const platform of this.config.platforms) {
        try {
          this.config.onSyncStart?.(platform);
          logger.info(`Starting ${platform} sync...`);

          let result;
          switch (platform) {
            case 'zendesk':
              result = await this.syncService.syncZendeskTickets('incremental');
              break;
            case 'freshdesk':
              result = await this.syncService.syncFreshdeskTickets('incremental');
              break;
            case 'intercom':
              result = await this.syncService.syncIntercomConversations('incremental');
              break;
          }

          this.lastSyncTime[platform] = new Date();
          logger.info(
            `${platform} sync completed: ${result.processedItems} processed, ${result.failedItems} failed`
          );

          this.config.onSyncComplete?.(result);
        } catch (error) {
          logger.error(${platform} sync failed:`, error);
          this.config.onSyncError?.(platform, error as Error);
        }
      }

      const duration = Date.now() - startTime;
      logger.info(`Sync cycle completed in ${duration}ms`);
    } finally {
      this.isRunning = false;
    }
  }

  // Run sync for a specific platform
  async runSyncForPlatform(platform: Platform): Promise<unknown> {
    if (!this.config.platforms.includes(platform)) {
      throw new Error(`Platform ${platform} is not configured for sync`);
    }

    logger.info(`Starting manual sync for ${platform}...`);

    let result;
    switch (platform) {
      case 'zendesk':
        result = await this.syncService.syncZendeskTickets('incremental');
        break;
      case 'freshdesk':
        result = await this.syncService.syncFreshdeskTickets('incremental');
        break;
      case 'intercom':
        result = await this.syncService.syncIntercomConversations('incremental');
        break;
    }

    this.lastSyncTime[platform] = new Date();
    return result;
  }

  // Run full sync for a platform
  async runFullSyncForPlatform(platform: Platform): Promise<unknown> {
    if (!this.config.platforms.includes(platform)) {
      throw new Error(`Platform ${platform} is not configured for sync`);
    }

    logger.info(`Starting full sync for ${platform}...`);

    let result;
    switch (platform) {
      case 'zendesk':
        result = await this.syncService.syncZendeskTickets('full');
        break;
      case 'freshdesk':
        result = await this.syncService.syncFreshdeskTickets('full');
        break;
      case 'intercom':
        result = await this.syncService.syncIntercomConversations('full');
        break;
    }

    this.lastSyncTime[platform] = new Date();
    return result;
  }

  // Get last sync time for a platform
  getLastSyncTime(platform: Platform): Date | undefined {
    return this.lastSyncTime[platform];
  }

  // Check if sync is currently running
  getIsRunning(): boolean {
    return this.isRunning;
  }

  // Update configuration
  updateConfig(config: Partial<SyncWorkerConfig>): void {
    const wasEnabled = this.config.enabled;
    this.config = { ...this.config, ...config };

    if (wasEnabled && !this.config.enabled) {
      this.stop();
    } else if (!wasEnabled && this.config.enabled) {
      this.start();
    } else if (this.config.enabled && this.cronJob) {
      // Restart with new configuration
      this.stop();
      this.start();
    }
  }

  // Get current configuration
  getConfig(): SyncWorkerConfig {
    return { ...this.config };
  }

  // Get worker status
  getStatus(): {
    enabled: boolean;
    isRunning: boolean;
    intervalMinutes: number;
    platforms: Platform[];
    lastSyncTimes: Record<Platform, Date | null>;
  } {
    return {
      enabled: this.config.enabled,
      isRunning: this.isRunning,
      intervalMinutes: this.config.syncIntervalMinutes,
      platforms: [...this.config.platforms],
      lastSyncTimes: Object.fromEntries(
        this.config.platforms.map((p) => [p, this.lastSyncTime[p] || null])
      ),
    };
  }
}

// Singleton instance
let syncWorkerInstance: SyncWorker | null = null;

export function getSyncWorker(): SyncWorker {
  if (!syncWorkerInstance) {
    syncWorkerInstance = new SyncWorker({
      enabled: true,
      syncIntervalMinutes: config.sync.intervalMinutes,
      platforms: ['zendesk', 'freshdesk', 'intercom'],
    });
  }
  return syncWorkerInstance;
}

export function startSyncWorker(): SyncWorker {
  const worker = getSyncWorker();
  worker.start();
  return worker;
}

export function stopSyncWorker(): void {
  if (syncWorkerInstance) {
    syncWorkerInstance.stop();
  }
}

export default SyncWorker;
