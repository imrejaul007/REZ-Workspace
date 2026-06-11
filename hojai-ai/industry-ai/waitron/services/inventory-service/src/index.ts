/**
 * Inventory Service - Inventory Management Backend
 * Part of WAITRON - Restaurant AI Operating System
 */

import { v4 as uuidv4 } from 'uuid';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  cost: number;
  supplier?: string;
  lastRestocked?: string;
  expiryDate?: string;
}

export interface StockAlert {
  id: string;
  itemId: string;
  itemName: string;
  type: 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'overstock';
  severity: 'low' | 'medium' | 'high' | 'critical';
  currentStock: number;
  message: string;
  createdAt: string;
  acknowledged: boolean;
}

export interface StockMovement {
  id: string;
  itemId: string;
  type: 'add' | 'remove' | 'adjustment';
  quantity: number;
  reason: string;
  createdAt: string;
  createdBy: string;
}

export class InventoryService {
  private inventory: Map<string, InventoryItem> = new Map();
  private alerts: StockAlert[] = [];
  private movements: StockMovement[] = [];

  async addItem(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
    const newItem: InventoryItem = { ...item, id: uuidv4() };
    this.inventory.set(newItem.id, newItem);
    return newItem;
  }

  async getAll(filters?: { category?: string; lowStock?: boolean }): Promise<InventoryItem[]> {
    let items = Array.from(this.inventory.values());

    if (filters?.category) {
      items = items.filter(i => i.category === filters.category);
    }
    if (filters?.lowStock) {
      items = items.filter(i => i.currentStock <= i.reorderPoint);
    }

    return items;
  }

  async getById(id: string): Promise<InventoryItem | undefined> {
    return this.inventory.get(id);
  }

  async updateStock(
    id: string,
    adjustment: number,
    reason: string,
    createdBy: string = 'system'
  ): Promise<InventoryItem | undefined> {
    const item = this.inventory.get(id);
    if (!item) return undefined;

    item.currentStock = Math.max(0, item.currentStock + adjustment);
    this.inventory.set(id, item);

    // Record movement
    this.movements.push({
      id: uuidv4(),
      itemId: id,
      type: adjustment > 0 ? 'add' : 'remove',
      quantity: Math.abs(adjustment),
      reason,
      createdAt: new Date().toISOString(),
      createdBy
    });

    // Check for alerts
    this.checkAlerts(item);

    return item;
  }

  async restock(id: string, quantity: number): Promise<InventoryItem | undefined> {
    return this.updateStock(id, quantity, 'Restock from supplier', 'manager');
  }

  async consume(id: string, quantity: number, reason: string): Promise<InventoryItem | undefined> {
    return this.updateStock(id, -quantity, reason, 'system');
  }

  async getAlerts(unacknowledgedOnly: boolean = false): Promise<StockAlert[]> {
    if (unacknowledgedOnly) {
      return this.alerts.filter(a => !a.acknowledged);
    }
    return [...this.alerts];
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  async getMovements(itemId?: string): Promise<StockMovement[]> {
    if (itemId) {
      return this.movements.filter(m => m.itemId === itemId);
    }
    return [...this.movements];
  }

  async getStats(): Promise<{
    totalItems: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    byCategory: Record<string, { count: number; value: number }>;
  }> {
    const items = Array.from(this.inventory.values());

    return {
      totalItems: items.length,
      totalValue: items.reduce((sum, i) => sum + (i.currentStock * i.cost), 0),
      lowStockCount: items.filter(i => i.currentStock <= i.reorderPoint && i.currentStock > 0).length,
      outOfStockCount: items.filter(i => i.currentStock === 0).length,
      byCategory: items.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = { count: 0, value: 0 };
        }
        acc[item.category].count++;
        acc[item.category].value += item.currentStock * item.cost;
        return acc;
      }, {} as Record<string, { count: number; value: number }>)
    };
  }

  private checkAlerts(item: InventoryItem): void {
    // Low stock alert
    if (item.currentStock <= item.reorderPoint && item.currentStock > 0) {
      this.createAlert(item, 'low_stock', 'medium',
        `Low stock: ${item.currentStock} ${item.unit} remaining`);
    }

    // Out of stock alert
    if (item.currentStock === 0) {
      this.createAlert(item, 'out_of_stock', 'critical',
        `Out of stock: ${item.name} needs immediate restocking`);
    }

    // Expiring soon alert
    if (item.expiryDate) {
      const daysUntilExpiry = Math.floor(
        (new Date(item.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
        this.createAlert(item, 'expiring_soon', 'high',
          `Expiring soon: ${item.name} expires in ${daysUntilExpiry} days`);
      }
    }
  }

  private createAlert(
    item: InventoryItem,
    type: StockAlert['type'],
    severity: StockAlert['severity'],
    message: string
  ): void {
    // Don't create duplicate alerts
    const existing = this.alerts.find(
      a => a.itemId === item.id && a.type === type && !a.acknowledged
    );
    if (existing) return;

    this.alerts.push({
      id: uuidv4(),
      itemId: item.id,
      itemName: item.name,
      type,
      severity,
      currentStock: item.currentStock,
      message,
      createdAt: new Date().toISOString(),
      acknowledged: false
    });
  }
}

export default InventoryService;
