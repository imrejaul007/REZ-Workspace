import { Franchise } from '../models/Franchise';
import { logger } from '../config/logger';

export class MenuSyncService {
  private static instance: MenuSyncService;
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;

  static getInstance(): MenuSyncService {
    if (!MenuSyncService.instance) {
      MenuSyncService.instance = new MenuSyncService();
    }
    return MenuSyncService.instance;
  }

  async syncMenu(franchiseId?: string): Promise<void> {
    if (this.isSyncing) {
      logger.warn('Menu sync already in progress, skipping');
      return;
    }

    this.isSyncing = true;
    try {
      const query = franchiseId ? { _id: franchiseId, isActive: true } : { isActive: true };
      const franchises = await Franchise.find(query);

      logger.info(`Syncing menu for ${franchises.length} franchises`);

      for (const franchise of franchises) {
        // Simulate menu sync
        logger.debug(`Synced menu for franchise ${franchise.franchiseCode}`);
      }

      logger.info('Menu sync completed');
    } catch (error) {
      logger.error('Menu sync failed', { error });
    } finally {
      this.isSyncing = false;
    }
  }

  startAutoSync(intervalMs: number): void {
    if (this.syncInterval) {
      this.stopAutoSync();
    }

    this.syncInterval = setInterval(() => {
      this.syncMenu();
    }, intervalMs);

    logger.info(`Auto-menu sync started with interval ${intervalMs}ms`);
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      logger.info('Auto-menu sync stopped');
    }
  }
}
