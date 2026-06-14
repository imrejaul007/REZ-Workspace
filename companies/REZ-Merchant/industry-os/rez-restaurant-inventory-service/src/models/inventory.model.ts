/**
 * Restaurant Inventory Service - Data Models
 */

export interface InventoryItem {
  id: string;
  merchantId: string;
  restaurantId: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit: string;
  minStockLevel: number;
  maxStockLevel: number;
  costPrice: number;
  sellingPrice: number;
  supplier?: string;
  expiryDate?: string;
  lastRestocked?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockAdjustment {
  id: string;
  itemId: string;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  type: 'add' | 'remove' | 'set';
  reason: string;
  performedBy: string;
  createdAt: Date;
}

export interface Supplier {
  id: string;
  merchantId: string;
  restaurantId: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  items: string[]; // Item IDs they supply
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryAlert {
  id: string;
  itemId: string;
  restaurantId: string;
  type: 'low_stock' | 'expiring' | 'out_of_stock' | 'overstock';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  isRead: boolean;
  createdAt: Date;
}

export interface InventoryReport {
  restaurantId: string;
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  expiringCount: number;
  outOfStockCount: number;
  categoryBreakdown: Record<string, { count: number; value: number }>;
  topSuppliers: Array<{ supplierId: string; name: string; itemCount: number }>;
}

export interface PurchaseOrder {
  id: string;
  restaurantId: string;
  supplierId: string;
  items: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
  }>;
  totalAmount: number;
  status: 'draft' | 'sent' | 'confirmed' | 'partial' | 'received' | 'cancelled';
  notes?: string;
  expectedDelivery?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type AdjustmentType = 'add' | 'remove' | 'set';
