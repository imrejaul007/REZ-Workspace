import { Franchise } from '../models/Franchise';
import { logger } from '../config/logger';

export class InventorySyncService {
  private static instance: InventorySyncService;
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;

  static getInstance(): InventorySyncService {
    if (!InventorySyncService.instance) {
      InventorySyncService.instance = new InventorySyncService();
    }
    return InventorySyncService.instance;
  }

  async syncInventory(franchiseId?: string): Promise<void> {
    if (this.isSyncing) {
      logger.warn('Inventory sync already in progress, skipping');
      return;
    }

    this.isSyncing = true;
    try {
      const query = franchiseId ? { _id: franchiseId, isActive: true } : { isActive: true };
      const franchises = await Franchise.find(query);

      logger.info(`Syncing inventory for ${franchises.length} franchises`);

      for (const franchise of franchises) {
        // Simulate inventory sync
        logger.debug(`Synced inventory for franchise ${franchise.franchiseCode}`);
      }

      logger.info('Inventory sync completed');
    } catch (error) {
      logger.error('Inventory sync failed', { error });
    } finally {
      this.isSyncing = false;
    }
  }

  startAutoSync(intervalMs: number): void {
    if (this.syncInterval) {
      this.stopAutoSync();
    }

    this.syncInterval = setInterval(() => {
      this.syncInventory();
    }, intervalMs);

    logger.info(`Auto-inventory sync started with interval ${intervalMs}ms`);
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      logger.info('Auto-inventory sync stopped');
    }
  }
}
