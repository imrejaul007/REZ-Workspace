import { z } from 'zod';

// Product Variants Schema
export const ProductVariantSchema = z.object({
  id: z.string(),
  sku: z.string(),
  name: z.string(),
  price: z.number().positive(),
  attributes: z.record(z.string()).optional(),
  inventory: z.number().int().min(0).default(0),
  images: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

export type ProductVariant = z.infer<typeof ProductVariantSchema>;

// Product Schema
export const ProductSchema = z.object({
  id: z.string().uuid(),
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  variants: z.array(ProductVariantSchema).default([]),
  inventory: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(10),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  weight: z.number().positive().optional(),
  dimensions: z.object({
    length: z.number().positive().optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Product = z.infer<typeof ProductSchema>;
export type ProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

// Category Schema
export const CategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  parentId: z.string().uuid().optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Category = z.infer<typeof CategorySchema>;
export type CategoryInput = Omit<Category, 'id' | 'createdAt' | 'updatedAt'>;

// Inventory Schema
export const InventoryMovementSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['in', 'out', 'adjustment', 'return', 'transfer']),
  quantity: z.number().int(),
  reason: z.string().optional(),
  reference: z.string().optional(),
  createdBy: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
});

export const InventorySchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  sku: z.string(),
  warehouseId: z.string().optional(),
  quantity: z.number().int().min(0),
  reservedQuantity: z.number().int().min(0).default(0),
  availableQuantity: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).default(10),
  reorderPoint: z.number().int().min(0).default(20),
  reorderQuantity: z.number().int().positive().default(50),
  lastRestocked: z.date().optional(),
  movements: z.array(InventoryMovementSchema).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Inventory = z.infer<typeof InventorySchema>;
export type InventoryMovement = z.infer<typeof InventoryMovementSchema>;

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
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter Types
export interface ProductFilter {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  inStock?: boolean;
}

export interface InventoryFilter {
  productId?: string;
  sku?: string;
  warehouseId?: string;
  lowStock?: boolean;
  outOfStock?: boolean;
}

// Stock Adjustment Types
export interface StockAdjustment {
  productId: string;
  quantity: number;
  type: 'in' | 'out' | 'adjustment' | 'return';
  reason?: string;
  reference?: string;
  createdBy?: string;
}
