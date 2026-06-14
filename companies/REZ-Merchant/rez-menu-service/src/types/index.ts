import { z } from 'zod';

// Variant Schema
export const VariantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  priceModifier: z.number().min(0),
  available: z.boolean().default(true),
  sku: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type Variant = z.infer<typeof VariantSchema>;

// Modifier Option Schema
export const ModifierOptionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  price: z.number().min(0).default(0),
  available: z.boolean().default(true),
});

export type ModifierOption = z.infer<typeof ModifierOptionSchema>;

// Modifier Schema
export const ModifierSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  options: z.array(ModifierOptionSchema).min(1),
  required: z.boolean().default(false),
  multiSelect: z.boolean().default(false),
  maxSelections: z.number().min(1).optional(),
});

export type Modifier = z.infer<typeof ModifierSchema>;

// Category Schema
export const CategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  available: z.boolean().default(true),
  sortOrder: z.number().default(0),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Category = z.infer<typeof CategorySchema>;

// Menu Item Schema
export const MenuItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  price: z.number().min(0),
  categoryId: z.string().uuid(),
  imageUrl: z.string().url().optional(),
  calories: z.number().min(0).optional(),
  allergens: z.array(z.string()).default([]),
  dietaryFlags: z.array(z.enum(['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher'])).default([]),
  variants: z.array(VariantSchema).default([]),
  modifiers: z.array(ModifierSchema).default([]),
  available: z.boolean().default(true),
  preparationTime: z.number().min(0).optional(),
  sortOrder: z.number().default(0),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type MenuItem = z.infer<typeof MenuItemSchema>;

// Menu Schema
export const MenuSchema = z.object({
  id: z.string().uuid(),
  restaurantId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  categories: z.array(CategorySchema).default([]),
  items: z.array(MenuItemSchema).default([]),
  active: z.boolean().default(true),
  version: z.number().default(1),
  publishedAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Menu = z.infer<typeof MenuSchema>;

// Analytics Schema
export const ItemAnalyticsSchema = z.object({
  itemId: z.string().uuid(),
  itemName: z.string(),
  categoryId: z.string().uuid(),
  views: z.number().default(0),
  orders: z.number().default(0),
  conversionRate: z.number().default(0),
  revenue: z.number().default(0),
  averageRating: z.number().optional(),
  reviewCount: z.number().default(0),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
});

export type ItemAnalytics = z.infer<typeof ItemAnalyticsSchema>;

// Recommendation Types
export interface RecommendationRequest {
  menuId: string;
  userId?: string;
  context?: {
    timeOfDay?: 'breakfast' | 'lunch' | 'dinner' | 'late-night';
    dietaryRestrictions?: string[];
    budget?: { min: number; max: number };
    previousOrders?: string[];
    preferences?: string[];
  };
  limit?: number;
}

export interface Recommendation {
  itemId: string;
  itemName: string;
  score: number;
  reasons: string[];
  categoryName?: string;
  price?: number;
  imageUrl?: string;
}

// API Request/Response Types
export interface CreateMenuRequest {
  restaurantId: string;
  name: string;
  description?: string;
}

export interface UpdateMenuRequest {
  name?: string;
  description?: string;
  active?: boolean;
}

export interface CreateCategoryRequest {
  menuId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  imageUrl?: string;
  available?: boolean;
  sortOrder?: number;
}

export interface CreateItemRequest {
  menuId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  calories?: number;
  allergens?: string[];
  dietaryFlags?: Array<'vegetarian' | 'vegan' | 'gluten-free' | 'dairy-free' | 'nut-free' | 'halal' | 'kosher'>;
  variants?: Array<Omit<Variant, 'id'>>;
  modifiers?: Array<Omit<Modifier, 'id'>>;
  preparationTime?: number;
  sortOrder?: number;
}

export interface UpdateItemRequest {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  imageUrl?: string;
  calories?: number;
  allergens?: string[];
  dietaryFlags?: Array<'vegetarian' | 'vegan' | 'gluten-free' | 'dairy-free' | 'nut-free' | 'halal' | 'kosher'>;
  available?: boolean;
  preparationTime?: number;
  sortOrder?: number;
}

export interface ToggleAvailabilityRequest {
  type: 'menu' | 'category' | 'item';
  id: string;
  available: boolean;
}

export interface AnalyticsQuery {
  menuId: string;
  periodStart: string;
  periodEnd: string;
  categoryId?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}
