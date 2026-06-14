import { z } from 'zod';

// Product Category Enum
export const ProductCategoryEnum = z.enum([
  'shampoo',
  'conditioner',
  'styling',
  'color',
  'skincare',
  'nail',
  'makeup',
  'equipment',
  'supplies',
  'other'
]);
export type ProductCategory = z.infer<typeof ProductCategoryEnum>;

// Product Schema
export const ProductSchema = z.object({
  productId: z.string(),
  salonId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: ProductCategoryEnum,
  brand: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  costPrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  stockQuantity: z.number().min(0).default(0),
  minStockLevel: z.number().min(0).default(5),
  unit: z.string().default('piece'),
  supplierId: z.string().optional(),
  expiryDate: z.string().optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

export type IProduct = z.infer<typeof ProductSchema>;

// Supplier Schema
export const SupplierSchema = z.object({
  supplierId: z.string(),
  salonId: z.string(),
  name: z.string().min(1).max(100),
  contactPerson: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type ISupplier = z.infer<typeof SupplierSchema>;

// Stock Adjustment Schema
export const StockAdjustmentSchema = z.object({
  productId: z.string(),
  adjustmentType: z.enum(['add', 'remove', 'audit', 'damage', 'return']),
  quantity: z.number(),
  reason: z.string().optional(),
  reference: z.string().optional(),
  adjustedBy: z.string().optional(),
});

export type IStockAdjustment = z.infer<typeof StockAdjustmentSchema>;

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
