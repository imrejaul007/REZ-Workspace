// Type definitions for POS ↔ Inventory Sync Service

export interface SaleItem {
  sku: string;
  quantity: number;
  unitPrice: number;
}

export interface Sale {
  _id: string;
  storeId: string;
  items: SaleItem[];
  total: number;
  timestamp: Date;
}

export interface ReturnItem {
  sku: string;
  quantity: number;
  reason: string;
}

export interface Return {
  _id: string;
  storeId: string;
  sku: string;
  quantity: number;
  reason: string;
  timestamp: Date;
}

export interface PurchaseOrderItem {
  sku: string;
  quantity: number;
  unitCost: number;
}

export interface PurchaseOrder {
  _id: string;
  storeId: string;
  items: PurchaseOrderItem[];
  supplierId: string;
  timestamp: Date;
}

export interface LowStockAlert {
  _id: string;
  storeId: string;
  sku: string;
  productName: string;
  currentStock: number;
  reorderPoint: number;
  timestamp: Date;
}

// Inventory Engine Types
export interface DeductStockRequest {
  sku: string;
  quantity: number;
  storeId: string;
  reason: 'sale' | 'adjustment' | 'damaged' | 'lost';
  referenceId: string;
}

export interface AddStockRequest {
  sku: string;
  quantity: number;
  storeId: string;
  reason: 'return' | 'received' | 'adjustment';
  referenceId: string;
}

export interface Stock {
  sku: string;
  storeId: string;
  quantity: number;
  lastUpdated: Date;
}

export interface Product {
  sku: string;
  barcode: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  category: string;
  imageUrl?: string;
}

// POS Client Types
export interface SyncProductRequest {
  storeId: string;
  products: Array<{
    sku: string;
    name: string;
    price: number;
    stock: number;
  }>;
}

export interface LowStockNotification {
  storeId: string;
  sku: string;
  productName: string;
  currentStock: number;
  reorderPoint: number;
}

// Sync Status Types
export interface SyncStatus {
  lastFullSync: Date | null;
  lastPartialSync: Date | null;
  pendingSyncs: number;
  failedSyncs: number;
  status: 'idle' | 'syncing' | 'error';
  errors: Array<{
    timestamp: Date;
    type: string;
    message: string;
    retryable: boolean;
  }>;
}

export interface SyncRecord {
  _id: string;
  type: 'full' | 'product' | 'webhook';
  status: 'pending' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  itemsProcessed: number;
  errors: string[];
  metadata?: Record<string, unknown>;
}
