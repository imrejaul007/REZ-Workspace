import { inventoryClient } from '../clients/inventoryClient';
import { posClient } from '../clients/posClient';
import {
  Sale,
  Return,
  PurchaseOrder,
  LowStockAlert,
  SyncStatus,
  SyncRecord,
} from '../types';

export class POSInventorySync {
  private syncStatus: SyncStatus = {
    lastFullSync: null,
    lastPartialSync: null,
    pendingSyncs: 0,
    failedSyncs: 0,
    status: 'idle',
    errors: [],
  };

  async onSaleCompleted(sale: Sale): Promise<void> {
    console.log(`[SyncService] Processing sale completed: ${sale._id}`);

    const errors: string[] = [];

    for (const item of sale.items) {
      try {
        await inventoryClient.deductStock({
          sku: item.sku,
          quantity: item.quantity,
          storeId: sale.storeId,
          reason: 'sale',
          referenceId: sale._id,
        });
        console.log(`[SyncService] Deducted ${item.quantity} of SKU ${item.sku} for sale ${sale._id}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[SyncService] Failed to deduct stock for ${item.sku}: ${errorMsg}`);
        errors.push(`SKU ${item.sku}: ${errorMsg}`);
      }
    }

    if (errors.length > 0) {
      this.recordError('sale', `Sale ${sale._id} had ${errors.length} failures`, true);
      throw new Error(`Sale sync partially failed: ${errors.join('; ')}`);
    }

    await this.createSyncRecord('webhook', 'completed', sale.items.length);
  }

  async onReturnCompleted(returnData: Return): Promise<void> {
    console.log(`[SyncService] Processing return completed: ${returnData._id}`);

    try {
      await inventoryClient.addStock({
        sku: returnData.sku,
        quantity: returnData.quantity,
        storeId: returnData.storeId,
        reason: 'return',
        referenceId: returnData._id,
      });
      console.log(`[SyncService] Added ${returnData.quantity} of SKU ${returnData.sku} for return ${returnData._id}`);
      await this.createSyncRecord('webhook', 'completed', 1);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[SyncService] Failed to process return: ${errorMsg}`);
      this.recordError('return', `Return ${returnData._id} failed: ${errorMsg}`, true);
      throw new Error(`Return sync failed: ${errorMsg}`);
    }
  }

  async onInventoryReceived(order: PurchaseOrder): Promise<void> {
    console.log(`[SyncService] Processing inventory received: ${order._id}`);

    const products = order.items.map((item) => ({
      sku: item.sku,
      name: item.sku, // Inventory engine should have the name
      price: item.unitCost,
      stock: item.quantity,
    }));

    try {
      await posClient.syncProduct({
        storeId: order.storeId,
        products,
      });
      console.log(`[SyncService] Synced ${products.length} products to POS for order ${order._id}`);
      await this.createSyncRecord('webhook', 'completed', products.length);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[SyncService] Failed to sync products to POS: ${errorMsg}`);
      this.recordError('inventory_received', `Order ${order._id} failed: ${errorMsg}`, true);
      throw new Error(`Inventory received sync failed: ${errorMsg}`);
    }
  }

  async onLowStockAlert(alert: LowStockAlert): Promise<void> {
    console.log(`[SyncService] Processing low stock alert: ${alert._id}`);

    try {
      await posClient.notifyLowStock({
        storeId: alert.storeId,
        sku: alert.sku,
        productName: alert.productName,
        currentStock: alert.currentStock,
        reorderPoint: alert.reorderPoint,
      });
      console.log(`[SyncService] Notified POS about low stock for SKU ${alert.sku}`);
      await this.createSyncRecord('webhook', 'completed', 1);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[SyncService] Failed to notify POS about low stock: ${errorMsg}`);
      // Low stock notifications are non-critical, don't throw
      this.recordError('low_stock', `Alert ${alert._id} notification failed: ${errorMsg}`, false);
    }
  }

  async performFullSync(storeId?: string): Promise<{ synced: number; failed: number }> {
    console.log(`[SyncService] Starting full sync${storeId ? ` for store ${storeId}` : ''}`);
    this.syncStatus.status = 'syncing';

    let synced = 0;
    let failed = 0;

    try {
      // Get all products from inventory engine
      const inventoryProducts = await inventoryClient.getProductsByStore(storeId || 'default');

      // Transform and sync to POS
      const products = inventoryProducts.map((p) => ({
        sku: p.sku,
        name: p.name,
        price: p.price,
        stock: 0, // Stock is managed by inventory engine, not synced directly
      }));

      await posClient.syncProduct({
        storeId: storeId || 'default',
        products,
      });

      synced = products.length;
      this.syncStatus.lastFullSync = new Date();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[SyncService] Full sync failed: ${errorMsg}`);
      failed = 1;
      this.recordError('full_sync', errorMsg, true);
    }

    this.syncStatus.status = 'idle';
    await this.createSyncRecord('full', failed === 0 ? 'completed' : 'failed', synced);

    return { synced, failed };
  }

  async syncSingleProduct(sku: string, storeId: string): Promise<boolean> {
    console.log(`[SyncService] Syncing single product ${sku}`);

    try {
      const stock = await inventoryClient.getStock(sku, storeId);

      // Check if product is available based on stock
      const available = stock.quantity > 0;

      await posClient.setAvailability(sku, available);
      console.log(`[SyncService] Synced product ${sku} - availability: ${available}`);

      await this.createSyncRecord('product', 'completed', 1, { sku, storeId });
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[SyncService] Failed to sync product ${sku}: ${errorMsg}`);
      this.recordError('product_sync', `SKU ${sku}: ${errorMsg}`, true);
      await this.createSyncRecord('product', 'failed', 0, { sku, storeId });
      return false;
    }
  }

  getStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  private recordError(type: string, message: string, retryable: boolean): void {
    this.syncStatus.errors.push({
      timestamp: new Date(),
      type,
      message,
      retryable,
    });
    this.syncStatus.failedSyncs++;

    // Keep only last 100 errors
    if (this.syncStatus.errors.length > 100) {
      this.syncStatus.errors = this.syncStatus.errors.slice(-100);
    }
  }

  private async createSyncRecord(
    type: SyncRecord['type'],
    status: SyncRecord['status'],
    itemsProcessed: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const record: SyncRecord = {
      _id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      status,
      startTime: new Date(),
      endTime: new Date(),
      itemsProcessed,
      errors: [],
      metadata,
    };

    console.log(`[SyncService] Created sync record: ${JSON.stringify(record)}`);

    // In production, persist this to MongoDB
    // await SyncRecordModel.create(record);
  }

  async checkLowStockAndNotify(storeId: string, threshold: number = 10): Promise<void> {
    console.log(`[SyncService] Checking low stock for store ${storeId}`);

    try {
      const lowStockProducts = await inventoryClient.getLowStockProducts(storeId, threshold);

      for (const product of lowStockProducts) {
        await this.onLowStockAlert({
          _id: `alert_${Date.now()}_${product.sku}`,
          storeId,
          sku: product.sku,
          productName: product.sku,
          currentStock: product.quantity,
          reorderPoint: product.reorderPoint,
          timestamp: new Date(),
        });
      }

      console.log(`[SyncService] Processed ${lowStockProducts.length} low stock alerts`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[SyncService] Failed to check low stock: ${errorMsg}`);
    }
  }
}

export const syncService = new POSInventorySync();
