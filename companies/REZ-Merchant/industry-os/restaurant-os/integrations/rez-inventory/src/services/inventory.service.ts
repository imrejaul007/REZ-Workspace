/**
 * Restaurant Inventory Service - Business Logic
 */

import { v4 as uuidv4 } from 'uuid';
import {
  InventoryItem,
  StockAdjustment,
  Supplier,
  InventoryAlert,
  InventoryReport,
  PurchaseOrder,
  AdjustmentType,
} from '../models/inventory.model.js';
import { STOCK_THRESHOLDS } from '../config/index.js';

// Re-export for use in routes
export { ITEM_CATEGORIES, ITEM_UNITS } from '../config/index.js';

// In-memory stores
const items = new Map<string, InventoryItem>();
const adjustments = new Map<string, StockAdjustment>();
const suppliers = new Map<string, Supplier>();
const alerts = new Map<string, InventoryAlert>();
const purchaseOrders = new Map<string, PurchaseOrder>();

/**
 * Generate unique IDs
 */
function generateId(prefix: string): string {
  return `${prefix}-${uuidv4().slice(0, 8).toUpperCase()}`;
}

/**
 * Check and create alerts for an item
 */
function checkAndCreateAlerts(item: InventoryItem): void {
  // Clear existing alerts for this item
  for (const [alertId, alert] of alerts.entries()) {
    if (alert.itemId === item.id) {
      alerts.delete(alertId);
    }
  }

  // Check for out of stock
  if (item.quantity === 0) {
    createAlert(item.id, item.restaurantId, 'out_of_stock', `Item "${item.name}" is out of stock`, 'critical');
    return;
  }

  // Check for low stock
  if (item.quantity <= item.minStockLevel) {
    createAlert(
      item.id,
      item.restaurantId,
      'low_stock',
      `Item "${item.name}" is low on stock (${item.quantity} ${item.unit} remaining, minimum: ${item.minStockLevel})`,
      item.quantity <= item.minStockLevel / 2 ? 'warning' : 'info'
    );
  }

  // Check for expiring items
  if (item.expiryDate) {
    const expiryDate = new Date(item.expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 0) {
      createAlert(item.id, item.restaurantId, 'expiring', `Item "${item.name}" has expired`, 'critical');
    } else if (daysUntilExpiry <= STOCK_THRESHOLDS.expiringAlertDays) {
      createAlert(
        item.id,
        item.restaurantId,
        'expiring',
        `Item "${item.name}" is expiring in ${daysUntilExpiry} day(s)`,
        daysUntilExpiry <= 1 ? 'critical' : 'warning'
      );
    }
  }

  // Check for overstock
  if (item.quantity >= item.maxStockLevel) {
    createAlert(
      item.id,
      item.restaurantId,
      'overstock',
      `Item "${item.name}" is overstocked (${item.quantity} ${item.unit} on hand, maximum: ${item.maxStockLevel})`,
      'info'
    );
  }
}

// ============ Item Management ============

export function createItem(data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): InventoryItem {
  const item: InventoryItem = {
    ...data,
    id: generateId('INV'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  items.set(item.id, item);
  checkAndCreateAlerts(item);
  return item;
}

export function getItem(itemId: string): InventoryItem | undefined {
  return items.get(itemId);
}

export function getItemsByRestaurant(restaurantId: string): InventoryItem[] {
  return Array.from(items.values())
    .filter(item => item.restaurantId === restaurantId && item.isActive)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function updateItem(itemId: string, updates: Partial<InventoryItem>): InventoryItem | undefined {
  const item = items.get(itemId);
  if (!item) return undefined;

  const updated: InventoryItem = {
    ...item,
    ...updates,
    id: item.id, // Prevent ID change
    createdAt: item.createdAt, // Prevent createdAt change
    updatedAt: new Date(),
  };

  items.set(itemId, updated);
  checkAndCreateAlerts(updated);
  return updated;
}

export function deleteItem(itemId: string): boolean {
  const item = items.get(itemId);
  if (!item) return false;
  item.isActive = false;
  items.set(itemId, item);
  return true;
}

// ============ Stock Management ============

export function adjustStock(
  itemId: string,
  quantity: number,
  type: AdjustmentType,
  reason: string,
  performedBy: string
): InventoryItem | undefined {
  const item = items.get(itemId);
  if (!item || !item.isActive) return undefined;

  const previousQuantity = item.quantity;
  let newQuantity: number;

  switch (type) {
    case 'add':
      newQuantity = item.quantity + quantity;
      break;
    case 'remove':
      newQuantity = Math.max(0, item.quantity - quantity);
      break;
    case 'set':
      newQuantity = quantity;
      break;
    default:
      return undefined;
  }

  // Create adjustment record
  const adjustment: StockAdjustment = {
    id: generateId('ADJ'),
    itemId,
    quantity,
    previousQuantity,
    newQuantity,
    type,
    reason,
    performedBy,
    createdAt: new Date(),
  };
  adjustments.set(adjustment.id, adjustment);

  // Update item
  const updated: InventoryItem = {
    ...item,
    quantity: newQuantity,
    lastRestocked: type === 'add' ? new Date() : item.lastRestocked,
    updatedAt: new Date(),
  };

  items.set(itemId, updated);
  checkAndCreateAlerts(updated);
  return updated;
}

export function getAdjustment(adjustmentId: string): StockAdjustment | undefined {
  return adjustments.get(adjustmentId);
}

export function getAdjustmentsByItem(itemId: string): StockAdjustment[] {
  return Array.from(adjustments.values())
    .filter(adj => adj.itemId === itemId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getAdjustmentsByRestaurant(restaurantId: string, limit: number = 100): StockAdjustment[] {
  const restaurantItems = new Set(getItemsByRestaurant(restaurantId).map(i => i.id));
  return Array.from(adjustments.values())
    .filter(adj => restaurantItems.has(adj.itemId))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

// ============ Query Functions ============

export function getLowStockItems(restaurantId: string): InventoryItem[] {
  return Array.from(items.values())
    .filter(item =>
      item.restaurantId === restaurantId &&
      item.isActive &&
      item.quantity <= item.minStockLevel
    )
    .sort((a, b) => a.quantity / a.minStockLevel - b.quantity / b.minStockLevel);
}

export function getExpiringItems(restaurantId: string, daysAhead: number = 7): InventoryItem[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

  return Array.from(items.values())
    .filter(item => {
      if (item.restaurantId !== restaurantId || !item.isActive || !item.expiryDate) {
        return false;
      }
      const expiryDate = new Date(item.expiryDate);
      return expiryDate <= cutoffDate && expiryDate >= new Date();
    })
    .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime());
}

export function getOutOfStockItems(restaurantId: string): InventoryItem[] {
  return Array.from(items.values())
    .filter(item => item.restaurantId === restaurantId && item.isActive && item.quantity === 0);
}

export function getItemsByCategory(restaurantId: string, category: string): InventoryItem[] {
  return Array.from(items.values())
    .filter(item =>
      item.restaurantId === restaurantId &&
      item.isActive &&
      item.category.toLowerCase() === category.toLowerCase()
    );
}

export function getInventoryValue(restaurantId: string): number {
  return getItemsByRestaurant(restaurantId)
    .reduce((total, item) => total + item.costPrice * item.quantity, 0);
}

export function getCategoriesByRestaurant(restaurantId: string): string[] {
  const categories = new Set(
    getItemsByRestaurant(restaurantId).map(item => item.category)
  );
  return Array.from(categories).sort();
}

// ============ Supplier Management ============

export function createSupplier(data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Supplier {
  const supplier: Supplier = {
    ...data,
    id: generateId('SUP'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  suppliers.set(supplier.id, supplier);
  return supplier;
}

export function getSupplier(supplierId: string): Supplier | undefined {
  return suppliers.get(supplierId);
}

export function getSuppliersByRestaurant(restaurantId: string): Supplier[] {
  return Array.from(suppliers.values())
    .filter(s => s.restaurantId === restaurantId && s.isActive)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getSuppliersByItem(itemId: string): Supplier[] {
  return Array.from(suppliers.values())
    .filter(s => s.items.includes(itemId));
}

export function updateSupplier(supplierId: string, updates: Partial<Supplier>): Supplier | undefined {
  const supplier = suppliers.get(supplierId);
  if (!supplier) return undefined;

  const updated: Supplier = {
    ...supplier,
    ...updates,
    id: supplier.id,
    createdAt: supplier.createdAt,
    updatedAt: new Date(),
  };

  suppliers.set(supplierId, updated);
  return updated;
}

// ============ Alert Management ============

export function createAlert(
  itemId: string,
  restaurantId: string,
  type: InventoryAlert['type'],
  message: string,
  severity: InventoryAlert['severity']
): InventoryAlert {
  const alert: InventoryAlert = {
    id: generateId('ALT'),
    itemId,
    restaurantId,
    type,
    message,
    severity,
    isRead: false,
    createdAt: new Date(),
  };
  alerts.set(alert.id, alert);
  return alert;
}

export function getAlert(alertId: string): InventoryAlert | undefined {
  return alerts.get(alertId);
}

export function getAlertsByRestaurant(restaurantId: string, unreadOnly: boolean = false): InventoryAlert[] {
  return Array.from(alerts.values())
    .filter(alert => {
      if (alert.restaurantId !== restaurantId) return false;
      if (unreadOnly && !alert.isRead) return true;
      return true;
    })
    .sort((a, b) => {
      // Sort by severity first, then by date
      const severityOrder: Record<InventoryAlert['severity'], number> = { critical: 0, warning: 1, info: 2 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
}

export function markAlertRead(alertId: string): InventoryAlert | undefined {
  const alert = alerts.get(alertId);
  if (!alert) return undefined;
  alert.isRead = true;
  alerts.set(alertId, alert);
  return alert;
}

export function markAllAlertsRead(restaurantId: string): number {
  let count = 0;
  for (const [id, alert] of alerts.entries()) {
    if (alert.restaurantId === restaurantId && !alert.isRead) {
      alert.isRead = true;
      alerts.set(id, alert);
      count++;
    }
  }
  return count;
}

export function deleteAlert(alertId: string): boolean {
  return alerts.delete(alertId);
}

// ============ Purchase Order Management ============

export function createPurchaseOrder(data: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>): PurchaseOrder {
  const order: PurchaseOrder = {
    ...data,
    id: generateId('PO'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  purchaseOrders.set(order.id, order);
  return order;
}

export function getPurchaseOrder(orderId: string): PurchaseOrder | undefined {
  return purchaseOrders.get(orderId);
}

export function getPurchaseOrdersByRestaurant(restaurantId: string): PurchaseOrder[] {
  return Array.from(purchaseOrders.values())
    .filter(order => order.restaurantId === restaurantId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function updatePurchaseOrderStatus(
  orderId: string,
  status: PurchaseOrder['status']
): PurchaseOrder | undefined {
  const order = purchaseOrders.get(orderId);
  if (!order) return undefined;

  order.status = status;
  order.updatedAt = new Date();

  // If received, update inventory
  if (status === 'received') {
    for (const item of order.items) {
      adjustStock(item.itemId, item.quantity, 'add', `Received from PO ${order.id}`, 'system');
    }
  }

  purchaseOrders.set(orderId, order);
  return order;
}

// ============ Reports ============

export function getInventoryReport(restaurantId: string): InventoryReport {
  const restaurantItems = getItemsByRestaurant(restaurantId);

  // Category breakdown
  const categoryBreakdown: Record<string, { count: number; value: number }> = {};
  for (const item of restaurantItems) {
    if (!categoryBreakdown[item.category]) {
      categoryBreakdown[item.category] = { count: 0, value: 0 };
    }
    categoryBreakdown[item.category].count++;
    categoryBreakdown[item.category].value += item.costPrice * item.quantity;
  }

  // Top suppliers
  const supplierCounts: Record<string, { name: string; itemCount: number }> = {};
  for (const item of restaurantItems) {
    if (item.supplier) {
      const supplier = Array.from(suppliers.values()).find(s => s.name === item.supplier);
      if (supplier) {
        if (!supplierCounts[supplier.id]) {
          supplierCounts[supplier.id] = { name: supplier.name, itemCount: 0 };
        }
        supplierCounts[supplier.id].itemCount++;
      }
    }
  }

  const topSuppliers = Object.entries(supplierCounts)
    .map(([id, data]) => ({ supplierId: id, ...data }))
    .sort((a, b) => b.itemCount - a.itemCount)
    .slice(0, 5);

  return {
    restaurantId,
    totalItems: restaurantItems.length,
    totalValue: getInventoryValue(restaurantId),
    lowStockCount: getLowStockItems(restaurantId).length,
    expiringCount: getExpiringItems(restaurantId).length,
    outOfStockCount: getOutOfStockItems(restaurantId).length,
    categoryBreakdown,
    topSuppliers,
  };
}

// ============ Reset Function ============

export function resetStore(): void {
  items.clear();
  adjustments.clear();
  suppliers.clear();
  alerts.clear();
  purchaseOrders.clear();
}
