import { v4 as uuidv4 } from 'uuid';
import { Inventory, IInventory, Sync, ISync, Webhook, IWebhook } from '../models';
import { createServiceLogger } from 'utils/logger.js';

const logger = createServiceLogger('InventorySyncService');

export class InventorySyncService {
  async createInventory(data: Partial<IInventory>): Promise<IInventory> {
    const inventoryId = `inv_${uuidv4()}`;
    const inventory = new Inventory({
      ...data,
      inventoryId,
      availableQuantity: data.quantity - (data.reservedQuantity || 0)
    });
    await inventory.save();
    logger.info('Inventory created', { inventoryId, productId: data.productId });
    return inventory;
  }

  async getInventoryById(inventoryId: string): Promise<IInventory | null> {
    return Inventory.findOne({ inventoryId });
  }

  async getInventoryByProduct(productId: string, companyId: string): Promise<IInventory[]> {
    return Inventory.find({ productId, companyId });
  }

  async updateInventory(inventoryId: string, data: Partial<IInventory>): Promise<IInventory | null> {
    const update = { ...data };
    if (data.quantity !== undefined || data.reservedQuantity !== undefined) {
      const current = await this.getInventoryById(inventoryId);
      if (current) {
        const quantity = data.quantity ?? current.quantity;
        const reserved = data.reservedQuantity ?? current.reservedQuantity;
        update['availableQuantity'] = quantity - reserved;
      }
    }
    update['lastSyncAt'] = new Date();
    update['syncStatus'] = 'synced';

    const inventory = await Inventory.findOneAndUpdate({ inventoryId }, update, { new: true });
    if (inventory) logger.info('Inventory updated', { inventoryId });
    return inventory;
  }

  async getAllInventory(companyId: string): Promise<IInventory[]> {
    return Inventory.find({ companyId }).sort({ updatedAt: -1 });
  }

  async getLowStockItems(companyId: string): Promise<IInventory[]> {
    return Inventory.find({ companyId, availableQuantity: { $lte: '$reorderLevel' } });
  }

  async reserveStock(inventoryId: string, quantity: number): Promise<IInventory | null> {
    const inventory = await this.getInventoryById(inventoryId);
    if (!inventory || inventory.availableQuantity < quantity) {
      throw new Error('Insufficient stock');
    }

    inventory.reservedQuantity += quantity;
    inventory.availableQuantity -= quantity;
    inventory.lastSyncAt = new Date();
    await inventory.save();

    if (inventory.availableQuantity <= inventory.reorderLevel) {
      await this.triggerWebhook(inventoryId, 'low_stock', { inventory, quantity });
    }

    logger.info('Stock reserved', { inventoryId, quantity });
    return inventory;
  }

  async releaseStock(inventoryId: string, quantity: number): Promise<IInventory | null> {
    const inventory = await this.getInventoryById(inventoryId);
    if (!inventory) throw new Error('Inventory not found');

    inventory.reservedQuantity = Math.max(0, inventory.reservedQuantity - quantity);
    inventory.availableQuantity += quantity;
    inventory.lastSyncAt = new Date();
    await inventory.save();

    logger.info('Stock released', { inventoryId, quantity });
    return inventory;
  }

  async triggerWebhook(inventoryId: string, type: IWebhook['type'], payload: Record<string, unknown>): Promise<IWebhook> {
    const webhookId = `wh_${uuidv4()}`;
    const webhook = new Webhook({ webhookId, inventoryId, type, payload, status: 'pending' });
    await webhook.save();

    // Simulate webhook delivery
    setTimeout(async () => {
      webhook.status = 'sent';
      webhook.sentAt = new Date();
      webhook.attempts = 1;
      await webhook.save();
      logger.info('Webhook sent', { webhookId, type });
    }, 500);

    return webhook;
  }

  async getSyncStatus(companyId: string): Promise<{ synced: number; pending: number; failed: number }> {
    const all = await this.getAllInventory(companyId);
    return {
      synced: all.filter(i => i.syncStatus === 'synced').length,
      pending: all.filter(i => i.syncStatus === 'pending').length,
      failed: all.filter(i => i.syncStatus === 'failed').length
    };
  }

  async initiateSync(data: { source: string; destination: string; companyId: string; type: 'full' | 'incremental' | 'realtime' }): Promise<ISync> {
    const syncId = `sync_${uuidv4()}`;
    const sync = new Sync({ syncId, ...data, status: 'in_progress' });
    await sync.save();

    // Simulate sync process
    setTimeout(async () => {
      const inventory = await Inventory.find({ companyId: data.companyId });
      sync.itemsProcessed = inventory.length;
      sync.status = 'completed';
      sync.completedAt = new Date();
      await sync.save();

      await Inventory.updateMany({ companyId: data.companyId }, { syncStatus: 'synced', lastSyncAt: new Date() });
      logger.info('Sync completed', { syncId, itemsProcessed: inventory.length });
    }, 2000);

    logger.info('Sync initiated', { syncId });
    return sync;
  }

  async getSyncHistory(companyId: string): Promise<ISync[]> {
    return Sync.find({ companyId }).sort({ startedAt: -1 }).limit(50);
  }

  async getWebhookStatus(inventoryId: string): Promise<IWebhook[]> {
    return Webhook.find({ inventoryId }).sort({ createdAt: -1 });
  }
}

export const inventorySyncService = new InventorySyncService();