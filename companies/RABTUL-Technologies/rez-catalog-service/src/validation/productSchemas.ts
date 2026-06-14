/**
 * Zod validation schemas for Catalog service.
 * These schemas validate all incoming requests at the API boundary.
 */

import { z } from 'zod';

export const ProductPricingSchema = z.object({
  selling: z.number().positive('Selling price must be positive'),
  mrp: z.number().positive('MRP must be positive'),
  discount: z.number().min(0).max(100).optional(),
  currency: z.string().optional().default('INR'),
});

export const ProductImageSchema = z.object({
  url: z.string().url().optional(),
  alt: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(200),
  // Canonical pricing format (preferred) — provides selling, mrp, discount, currency
  pricing: ProductPricingSchema.optional(),
  // Legacy pricing fields (backward compatibility)
  price: z.number().positive().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  stock: z.number().nonnegative().optional(),
  merchantId: z.string().min(1),
  storeId: z.string().optional(),
}).refine(
  (data) => data.pricing || data.price,
  { message: 'Either pricing (canonical format) or price (legacy) must be provided' }
);

export const UpdateProductSchema = z.object({
  merchantId: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  // Canonical pricing format (preferred) — allows partial updates to pricing object
  pricing: ProductPricingSchema.partial().optional(),
  // Legacy pricing fields (backward compatibility)
  price: z.number().positive().optional(),
  compareAtPrice: z.number().positive().optional(),
  images: z.array(z.union([z.string().url(), ProductImageSchema])).optional(),
  thumbnail: z.string().url().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  stock: z.number().nonnegative().optional(),
  unit: z.string().optional(),
  weight: z.number().nonnegative().optional(),
  dimensions: z.record(z.unknown()).optional(),
  variants: z.array(z.record(z.unknown())).optional(),
  addOns: z.array(z.record(z.unknown())).optional(),
  preparationTime: z.number().nonnegative().optional(),
  taxRate: z.number().nonnegative().optional(),
  discount: z.number().min(0).max(100).optional(),
  isAvailable: z.boolean().optional(),
  sortOrder: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const ProductListQuerySchema = z.object({
  storeId: z.string().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const FeaturedProductsQuerySchema = z.object({
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export const MerchantProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
});
