import { z } from 'zod';

export const InventoryItemSchema = z.object({
  id: z.string().optional(),
  shopifyProductId: z.string(),
  shopifyVariantId: z.string().optional(),
  sku: z.string(),
  barcode: z.string().optional(),
  title: z.string(),
  quantity: z.number().min(0).default(0),
  reservedQuantity: z.number().min(0).default(0),
  availableQuantity: z.number().min(0).default(0),
  lowStockThreshold: z.number().min(0).default(10),
  outOfStockThreshold: z.number().min(0).default(0),
  warehouseLocations: z.array(z.object({
    warehouseId: z.string(),
    warehouseName: z.string(),
    quantity: z.number().min(0),
    reserved: z.number().min(0).default(0)
  })).default([]),
  incomingStock: z.number().min(0).default(0),
  expectedDeliveryDate: z.string().optional(),
  reorderPoint: z.number().min(0).optional(),
  reorderQuantity: z.number().min(0).optional(),
  lastRestockedAt: z.string().optional(),
  lastSoldAt: z.string().optional(),
  status: z.enum(['in_stock', 'low_stock', 'out_of_stock', 'discontinued']).default('in_stock'),
  metadata: z.record(z.any()).default({}),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});
export type InventoryItem = z.infer<typeof InventoryItemSchema>;

export const StockAdjustmentSchema = z.object({
  id: z.string().optional(),
  inventoryItemId: z.string(),
  shopifyProductId: z.string(),
  adjustmentType: z.enum(['sale', 'return', 'receive', 'adjust', 'damage', 'theft', 'transfer']),
  quantity: z.number(),
  previousQuantity: z.number(),
  newQuantity: z.number(),
  reason: z.string().optional(),
  reference: z.string().optional(),
  warehouseId: z.string().optional(),
  performedBy: z.string().optional(),
  createdAt: z.string().optional()
});
export type StockAdjustment = z.infer<typeof StockAdjustmentSchema>;

export const WarehouseSchema = z.object({
  id: z.string().optional(),
  shopifyLocationId: z.string(),
  name: z.string(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().default('India')
  }),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  createdAt: z.string().optional()
});
export type Warehouse = z.infer<typeof WarehouseSchema>;

export const InventoryAlertSchema = z.object({
  id: z.string().optional(),
  inventoryItemId: z.string(),
  shopifyProductId: z.string(),
  alertType: z.enum(['low_stock', 'out_of_stock', 'overstock', 'expiry_warning']),
  threshold: z.number(),
  currentValue: z.number(),
  message: z.string(),
  isAcknowledged: z.boolean().default(false),
  createdAt: z.string().optional()
});
export type InventoryAlert = z.infer<typeof InventoryAlertSchema>;

export const InventoryReportSchema = z.object({
  inventoryItemId: z.string(),
  sku: z.string(),
  title: z.string(),
  totalQuantity: z.number(),
  availableQuantity: z.number(),
  reservedQuantity: z.number(),
  incomingQuantity: z.number(),
  turnoverRate: z.number().optional(),
  daysOfSupply: z.number().optional(),
  value: z.number().optional()
});
export type InventoryReport = z.infer<typeof InventoryReportSchema>;
