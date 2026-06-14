import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Product category enum
export enum ProductCategory {
  GROCERIES = 'groceries',
  FRESH_PRODUCE = 'fresh_produce',
  DAIRY = 'dairy',
  BEVERAGES = 'beverages',
  SNACKS = 'snacks',
  HOUSEHOLD = 'household',
  PERSONAL_CARE = 'personal_care',
  FROZEN = 'frozen',
  BAKERY = 'bakery',
  MEAT_SEAFOOD = 'meat_seafood',
  ORGANIC = 'organic',
  INTERNATIONAL = 'international'
}

// Product unit types
export enum ProductUnit {
  PIECE = 'piece',
  KG = 'kg',
  GRAM = 'gram',
  LITER = 'liter',
  ML = 'ml',
  PACK = 'pack',
  DOZEN = 'dozen',
  BUNCH = 'bunch'
}

// Zod schema for product validation
export const ProductSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: z.nativeEnum(ProductCategory),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  sku: z.string().min(1).max(50),
  barcode: z.string().max(50).optional(),
  unit: z.nativeEnum(ProductUnit),
  unitValue: z.number().positive(),
  price: z.number().positive(),
  mrp: z.number().positive().optional(),
  discount: z.number().min(0).max(100).optional(),
  currency: z.string().default('INR'),
  images: z.array(z.string().url()).optional(),
  thumbnail: z.string().url().optional(),
  stock: z.number().int().min(0).default(0),
  stockStatus: z.enum(['in_stock', 'low_stock', 'out_of_stock']).default('in_stock'),
  isOrganic: z.boolean().default(false),
  isVeg: z.boolean().optional(),
  isAvailable: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
  attributes: z.record(z.any()).optional(),
  weight: z.number().optional(),
  dimensions: z.object({
    length: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional()
  }).optional(),
  // Shelf info
  shelfLife: z.string().optional(),
  storageInfo: z.string().optional(),
  // Nutritional info (optional for food items)
  nutritionalInfo: z.object({
    calories: z.number().optional(),
    protein: z.number().optional(),
    carbs: z.number().optional(),
    fat: z.number().optional(),
    fiber: z.number().optional()
  }).optional(),
  // Seller info
  sellerId: z.string().optional(),
  sellerName: z.string().optional(),
  // Ratings and reviews
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().min(0).default(0),
  // Timestamps
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

// Type inference from schema
export type ProductInput = z.infer<typeof ProductSchema>;
export type Product = Required<ProductInput> & {
  id: string;
  createdAt: string;
  updatedAt: string;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
};

// Product response type
export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Search params type
export interface SearchParams {
  query?: string;
  category?: ProductCategory;
  subcategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  isOrganic?: boolean;
  isVeg?: boolean;
  inStock?: boolean;
  sortBy?: 'price' | 'name' | 'rating' | 'newest';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

// Recommendation params
export interface RecommendationParams {
  userId?: string;
  category?: ProductCategory;
  limit?: number;
}

// Factory function to create a product
export function createProduct(input: ProductInput): Product {
  const now = new Date().toISOString();
  return {
    ...input,
    id: input.id || uuidv4(),
    createdAt: input.createdAt || now,
    updatedAt: now,
    stockStatus: calculateStockStatus(input.stock ?? 0),
    images: input.images || [],
    tags: input.tags || [],
    attributes: input.attributes || {},
    reviewCount: input.reviewCount ?? 0
  } as Product;
}

// Calculate stock status
export function calculateStockStatus(stock: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
  if (stock === 0) return 'out_of_stock';
  if (stock <= 10) return 'low_stock';
  return 'in_stock';
}

// Calculate discounted price
export function calculateDiscountedPrice(price: number, discount?: number): number {
  if (!discount || discount <= 0) return price;
  return Math.round(price * (1 - discount / 100) * 100) / 100;
}
