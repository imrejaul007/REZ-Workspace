import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validate = (schema: z.ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
      const parsed = schema.parse(data);
      if (source === 'body') req.body = parsed;
      else if (source === 'query') req.query = parsed as any;
      else req.params = parsed as any;
      next();
    } catch (error) { next(error); }
  };
};

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const createProductSchema = z.object({
  merchantId: z.string().min(1),
  name: z.string().min(1),
  sku: z.string().min(1).toUpperCase(),
  barcode: z.string().optional(),
  category: z.enum(['tops', 'bottoms', 'dresses', 'ethnic', 'western', 'accessories', 'footwear']),
  gender: z.enum(['men', 'women', 'unisex', 'kids']),
  sizes: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  material: z.string().optional(),
  brand: z.string().optional(),
  season: z.string().optional(),
  collection: z.string().optional(),
  mrp: z.number().min(0),
  sellingPrice: z.number().min(0),
  costPrice: z.number().min(0),
  stock: z.coerce.number().int().min(0).default(0),
  minStock: z.coerce.number().int().min(0).default(5),
  reorderLevel: z.coerce.number().int().min(0).default(10),
  images: z.array(z.string().url()).default([]),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export const updateProductSchema = createProductSchema.partial().omit({ merchantId: true });

export const createCollectionSchema = z.object({
  merchantId: z.string().min(1),
  name: z.string().min(1),
  season: z.string().min(1),
  year: z.coerce.number().int().min(2020).max(2099),
  description: z.string().optional(),
  productIds: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const createStyleProfileSchema = z.object({
  merchantId: z.string().min(1),
  customerId: z.string().min(1),
  bodyType: z.string().optional(),
  stylePreferences: z.array(z.string()).default([]),
  favoriteCategories: z.array(z.enum(['tops', 'bottoms', 'dresses', 'ethnic', 'western', 'accessories', 'footwear'])).default([]),
  sizePreferences: z.record(z.string(), z.number()).default({}),
  occasionPreferences: z.array(z.string()).default([]),
  colorPreferences: z.array(z.string()).default([]),
  budgetRange: z.object({ min: z.number().default(0), max: z.number().default(10000) }).optional(),
  lastPurchase: z.string().datetime().optional(),
});

export const productSearchSchema = z.object({
  ...paginationSchema.shape,
  merchantId: z.string().optional(),
  category: z.enum(['tops', 'bottoms', 'dresses', 'ethnic', 'western', 'accessories', 'footwear']).optional(),
  gender: z.enum(['men', 'women', 'unisex', 'kids']).optional(),
  brand: z.string().optional(),
  status: z.enum(['active', 'out_of_stock', 'discontinued']).optional(),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  search: z.string().optional(),
});