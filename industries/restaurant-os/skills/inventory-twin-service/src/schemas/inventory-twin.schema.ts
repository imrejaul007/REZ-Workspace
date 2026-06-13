// Inventory Twin Schema - Defines types and validation for Inventory Twin Service

export enum ItemCategory {
  PROTEIN = 'protein',
  VEGETABLES = 'vegetables',
  DAIRY = 'dairy',
  GRAINS = 'grains',
  SPICES = 'spices',
  BEVERAGES = 'beverages',
  CONDIMENTS = 'condiments',
  PREPARED = 'prepared',
  PACKAGING = 'packaging',
  OTHER = 'other'
}

export enum UrgencyLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface Supplier {
  supplierId: string;
  name: string;
  leadTimeDays: number;
  costPerUnit: number;
  minOrderQuantity: number;
}

export interface InventoryItem {
  itemId: string;
  name: string;
  category: ItemCategory;
  currentStock: number;
  unit: string;
  reorderPoint: number;
  reorderQuantity: number;
  costPerUnit: number;
  expiryDate?: string;
  location: string;
  suppliers: Supplier[];
  consumptionRate: number;
  daysUntilStockout: number;
}

export interface WasteLog {
  date: string;
  itemId: string;
  itemName: string;
  quantity: number;
  reason: string;
  estimatedCost: number;
}

export interface ReorderAlert {
  itemId: string;
  itemName: string;
  currentStock: number;
  reorderPoint: number;
  urgency: UrgencyLevel;
  suggestedQuantity: number;
  estimatedCost: number;
}

export interface ExpiryAlert {
  itemId: string;
  itemName: string;
  expiryDate: string;
  daysUntilExpiry: number;
  currentStock: number;
  estimatedValue: number;
}

export interface InventoryTwinDocument {
  twinId: string;
  inventoryId: string;
  restaurantId: string;
  items: InventoryItem[];
  wasteLog: WasteLog[];
  totalValue: number;
  reorderAlerts: ReorderAlert[];
  expiringAlerts: ExpiryAlert[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryTwinRequest {
  restaurantId: string;
  items?: {
    name: string;
    category: ItemCategory;
    currentStock: number;
    unit: string;
    reorderPoint: number;
    reorderQuantity?: number;
    costPerUnit?: number;
    expiryDate?: string;
    location?: string;
  }[];
}

export interface CreateInventoryTwinResponse {
  twinId: string;
  inventoryId: string;
  twinOsEntityId: string;
  createdAt: string;
}

export interface GetInventoryTwinResponse extends InventoryTwinDocument {
  twinOsEntityId: string;
}

export interface AddInventoryItemRequest {
  name: string;
  category: ItemCategory;
  currentStock: number;
  unit: string;
  reorderPoint: number;
  reorderQuantity?: number;
  costPerUnit?: number;
  expiryDate?: string;
  location?: string;
  suppliers?: Supplier[];
}

export interface AdjustStockRequest {
  itemId: string;
  quantity: number;
  reason: string;
  isAddition?: boolean;
}

export interface LogWasteRequest {
  itemId: string;
  quantity: number;
  reason: string;
}

export interface CreatePurchaseOrderRequest {
  items: {
    itemId: string;
    quantity: number;
    supplierId?: string;
  }[];
}

export interface GetInventoryAnalyticsResponse {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  expiringCount: number;
  wasteThisMonth: number;
  avgFoodCostPercentage: number;
  topConsumedItems: { itemId: string; name: string; consumption: number }[];
}
