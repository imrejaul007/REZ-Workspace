import { z } from 'zod';

export const productSchema = z.object({
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  price: z.number().positive(),
  cost: z.number().nonnegative(),
  stock: z.number().int().nonnegative().default(0),
  lowStockThreshold: z.number().int().nonnegative().default(10),
  isActive: z.boolean().default(true),
});

export const customerSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(1).max(20),
  email: z.string().email().optional(),
  loyaltyPoints: z.number().int().nonnegative().default(0),
  tier: z.enum(['bronze', 'silver', 'gold', 'platinum']).default('bronze'),
  totalSpent: z.number().nonnegative().default(0),
  purchaseCount: z.number().int().nonnegative().default(0),
});

export const saleItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
  discount: z.number().nonnegative().default(0),
});

export const saleSchema = z.object({
  customerId: z.string().optional(),
  items: z.array(saleItemSchema).min(1),
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative().default(0),
  discount: z.number().nonnegative().default(0),
  total: z.number().nonnegative(),
  paymentMethod: z.enum(['cash', 'card', 'digital', 'loyalty']),
  status: z.enum(['pending', 'completed', 'refunded', 'cancelled']).default('completed'),
});

export const inventorySchema = z.object({
  productId: z.string(),
  quantity: z.number().int().nonnegative().default(0),
  lastRestocked: z.date().optional(),
  minStock: z.number().int().nonnegative().default(5),
  maxStock: z.number().int().positive().default(100),
});

export const updateStockSchema = z.object({
  quantity: z.number().int(),
  operation: z.enum(['add', 'subtract', 'set']).default('add'),
});

export const updateLoyaltySchema = z.object({
  points: z.number().int(),
  operation: z.enum(['add', 'subtract', 'set']).default('add'),
});

export const posSaleSchema = z.object({
  customerId: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
  })),
  paymentMethod: z.enum(['cash', 'card', 'digital', 'loyalty']).default('cash'),
  discountCode: z.string().optional(),
});

export type ProductInput = z.infer<typeof productSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type SaleInput = z.infer<typeof saleSchema>;
export type InventoryInput = z.infer<typeof inventorySchema>;
export type UpdateStockInput = z.infer<typeof updateStockSchema>;
export type UpdateLoyaltyInput = z.infer<typeof updateLoyaltySchema>;
export type PosSaleInput = z.infer<typeof posSaleSchema>;