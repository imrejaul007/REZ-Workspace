import { z } from 'zod';

export const ProductStockSchema = z.object({
  productId: z.string(),
  sku: z.string(),
  warehouseId: z.string(),
  quantity: z.number().int().min(0),
  reservedQuantity: z.number().int().min(0).default(0),
  availableQuantity: z.number().int().min(0),
  reorderPoint: z.number().int().min(0).default(10),
  reorderQuantity: z.number().int().min(0).default(100),
  maxStock: z.number().int().optional()
});
export type ProductStock = z.infer<typeof ProductStockSchema>;

export const WarehouseSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    pincode: z.string(),
    country: z.string().default('India')
  }),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false)
});
export type Warehouse = z.infer<typeof WarehouseSchema>;

export const StockMovementSchema = z.object({
  id: z.string().optional(),
  productId: z.string(),
  warehouseId: z.string(),
  type: z.enum(['in', 'out', 'transfer', 'adjustment', 'return']),
  quantity: z.number().int(),
  reference: z.string().optional(),
  reason: z.string().optional(),
  createdAt: z.date().optional()
});
export type StockMovement = z.infer<typeof StockMovementSchema>;

export const StockTransferSchema = z.object({
  id: z.string().optional(),
  fromWarehouseId: z.string(),
  toWarehouseId: z.string(),
  productId: z.string(),
  quantity: z.number().int().min(1),
  status: z.enum(['pending', 'in_transit', 'completed', 'cancelled']).default('pending')
});
export type StockTransfer = z.infer<typeof StockTransferSchema>;
