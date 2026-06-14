import crypto from 'crypto';
import { InventoryItem, StockAdjustment, Warehouse, InventoryAlert, InventoryReport } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class InventoryService {
  private inventory: Map<string, InventoryItem> = new Map();
  private adjustments: Map<string, StockAdjustment[]> = new Map();
  private warehouses: Map<string, Warehouse> = new Map();
  private alerts: Map<string, InventoryAlert> = new Map();

  private calculateAvailable(item: InventoryItem): number {
    return Math.max(0, item.quantity - item.reservedQuantity);
  }

  private updateStatus(item: InventoryItem): void {
    const available = this.calculateAvailable(item);
    item.availableQuantity = available;

    if (available <= item.outOfStockThreshold) {
      item.status = 'out_of_stock';
    } else if (available <= item.lowStockThreshold) {
      item.status = 'low_stock';
    } else {
      item.status = 'in_stock';
    }
  }

  createItem(itemData: Omit<InventoryItem, 'id' | 'availableQuantity' | 'status' | 'createdAt' | 'updatedAt'>): InventoryItem {
    const id = crypto.randomUUID();
    const item: InventoryItem = {
      ...itemData,
      id,
      availableQuantity: this.calculateAvailable(itemData as InventoryItem),
      status: 'in_stock',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.updateStatus(item);
    this.inventory.set(id, item);
    this.adjustments.set(id, []);

    logger.info(`Inventory item created: ${id}`, { productId: item.shopifyProductId });
    return item;
  }

  getItem(id: string): InventoryItem | undefined;
  getItem(shopifyProductId: string, byProductId: true): InventoryItem | undefined;
  getItem(identifier: string, byProductId?: boolean): InventoryItem | undefined {
    if (byProductId) {
      for (const item of this.inventory.values()) {
        if (item.shopifyProductId === identifier) return item;
      }
      return undefined;
    }
    return this.inventory.get(identifier);
  }

  updateItem(id: string, updates: Partial<InventoryItem>): InventoryItem | undefined {
    const item = this.inventory.get(id);
    if (!item) return undefined;

    const updated = { ...item, ...updates, id, updatedAt: new Date().toISOString() };
    this.updateStatus(updated);
    this.inventory.set(id, updated);

    if (updated.status === 'low_stock' || updated.status === 'out_of_stock') {
      this.createAlert(updated, updated.status === 'out_of_stock' ? 'out_of_stock' : 'low_stock');
    }

    return updated;
  }

  adjustStock(id: string, adjustment: Omit<StockAdjustment, 'id' | 'inventoryItemId' | 'previousQuantity' | 'newQuantity' | 'createdAt'>): StockAdjustment | undefined {
    const item = this.inventory.get(id);
    if (!item) return undefined;

    const adjustmentRecord: StockAdjustment = {
      id: crypto.randomUUID(),
      inventoryItemId: id,
      ...adjustment,
      shopifyProductId: item.shopifyProductId,
      previousQuantity: item.quantity,
      newQuantity: item.quantity + adjustment.quantity,
      createdAt: new Date().toISOString()
    };

    item.quantity = adjustmentRecord.newQuantity;
    item.updatedAt = new Date().toISOString();

    if (adjustment.adjustmentType === 'sale') {
      item.lastSoldAt = new Date().toISOString();
    } else if (adjustment.adjustmentType === 'receive') {
      item.lastRestockedAt = new Date().toISOString();
    }

    this.updateStatus(item);
    this.inventory.set(id, item);

    const adjustments = this.adjustments.get(id) || [];
    adjustments.push(adjustmentRecord);
    this.adjustments.set(id, adjustments);

    logger.info(`Stock adjusted: ${id}`, { type: adjustment.adjustmentType, quantity: adjustment.quantity });
    return adjustmentRecord;
  }

  reserveStock(id: string, quantity: number): boolean {
    const item = this.inventory.get(id);
    if (!item || item.availableQuantity < quantity) return false;

    item.reservedQuantity += quantity;
    this.updateStatus(item);
    this.inventory.set(id, item);
    return true;
  }

  releaseReservation(id: string, quantity: number): boolean {
    const item = this.inventory.get(id);
    if (!item) return false;

    item.reservedQuantity = Math.max(0, item.reservedQuantity - quantity);
    this.updateStatus(item);
    this.inventory.set(id, item);
    return true;
  }

  transferStock(fromId: string, toId: string, quantity: number, warehouseId: string): boolean {
    const fromItem = this.inventory.get(fromId);
    const toItem = this.inventory.get(toId);
    if (!fromItem || !toItem || fromItem.availableQuantity < quantity) return false;

    fromItem.quantity -= quantity;
    toItem.quantity += quantity;
    this.updateStatus(fromItem);
    this.updateStatus(toItem);
    this.inventory.set(fromId, fromItem);
    this.inventory.set(toId, toItem);

    this.adjustments.get(fromId)?.push({
      id: crypto.randomUUID(),
      inventoryItemId: fromId,
      shopifyProductId: fromItem.shopifyProductId,
      adjustmentType: 'transfer',
      quantity: -quantity,
      previousQuantity: fromItem.quantity + quantity,
      newQuantity: fromItem.quantity,
      warehouseId,
      createdAt: new Date().toISOString()
    });

    return true;
  }

  getAdjustments(itemId: string): StockAdjustment[] {
    return this.adjustments.get(itemId) || [];
  }

  createWarehouse(warehouseData: Omit<Warehouse, 'id' | 'createdAt'>): Warehouse {
    const warehouse: Warehouse = {
      ...warehouseData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    this.warehouses.set(warehouse.id!, warehouse);
    return warehouse;
  }

  getWarehouse(id: string): Warehouse | undefined {
    return this.warehouses.get(id);
  }

  getAllWarehouses(): Warehouse[] {
    return Array.from(this.warehouses.values());
  }

  private createAlert(item: InventoryItem, alertType: InventoryAlert['alertType']): void {
    const alertId = crypto.randomUUID();
    const threshold = alertType === 'out_of_stock' ? item.outOfStockThreshold : item.lowStockThreshold;

    const alert: InventoryAlert = {
      id: alertId,
      inventoryItemId: item.id!,
      shopifyProductId: item.shopifyProductId,
      alertType,
      threshold,
      currentValue: item.availableQuantity,
      message: alertType === 'out_of_stock'
        ? `${item.title} is out of stock!`
        : `${item.title} is running low (${item.availableQuantity} left)`,
      isAcknowledged: false,
      createdAt: new Date().toISOString()
    };

    this.alerts.set(alertId, alert);
    logger.warn(`Inventory alert: ${alert.message}`);
  }

  getAlerts(acknowledged?: boolean): InventoryAlert[] {
    let alerts = Array.from(this.alerts.values());
    if (acknowledged !== undefined) {
      alerts = alerts.filter(a => a.isAcknowledged === acknowledged);
    }
    return alerts.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;
    alert.isAcknowledged = true;
    this.alerts.set(alertId, alert);
    return true;
  }

  getReport(): InventoryReport[] {
    return Array.from(this.inventory.values()).map(item => ({
      inventoryItemId: item.id!,
      sku: item.sku,
      title: item.title,
      totalQuantity: item.quantity,
      availableQuantity: item.availableQuantity,
      reservedQuantity: item.reservedQuantity,
      incomingQuantity: item.incomingStock,
      // STATISTICAL: mock inventory metrics for display
      turnoverRate: Math.random() * 10,
      daysOfSupply: Math.floor(Math.random() * 90 + 7),
      value: item.quantity * (Math.random() * 1000 + 100)
    }));
  }

  getLowStockItems(): InventoryItem[] {
    return Array.from(this.inventory.values()).filter(item =>
      item.status === 'low_stock' || item.status === 'out_of_stock'
    );
  }

  bulkUpdateQuantities(updates: Array<{ id: string; quantity: number }>): void {
    for (const update of updates) {
      const item = this.inventory.get(update.id);
      if (item) {
        const diff = update.quantity - item.quantity;
        this.adjustStock(update.id, {
          adjustmentType: 'adjust',
          quantity: diff,
          reason: 'Bulk update',
          shopifyProductId: item.shopifyProductId
        });
      }
    }
  }
}

export const inventoryService = new InventoryService();
