import { z } from 'zod';

// ===================
// Search
// ===================

export const SearchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  location: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  cuisines: z.array(z.string()).optional(),
  dietary: z.array(z.string()).optional(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  rating: z.number().optional(),
  isOpen: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;

// ===================
// Dish
// ===================

export const DishSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  cuisine: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  }).optional(),
  category: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  }).optional(),
  nutrition: z.object({
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
    fiber: z.number(),
  }).optional(),
  allergens: z.array(z.string()),
  dietaryTags: z.array(z.string()),
  origin: z.string().optional(),
  story: z.string().optional(),
  ingredients: z.array(z.string()),
  similarDishes: z.array(z.string()),
  images: z.array(z.string()),
  viewCount: z.number(),
  searchCount: z.number(),
});

export type DishInput = z.infer<typeof DishSchema>;

// ===================
// Price Comparison
// ===================

export const PriceComparisonSchema = z.object({
  dishId: z.string(),
  restaurantId: z.string().optional(),
});

export type PriceComparisonInput = z.infer<typeof PriceComparisonSchema>;

// ===================
// Deals
// ===================

export const DealSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  type: z.enum(['PERCENTAGE_OFF', 'FLAT_OFF', 'FREE_DELIVERY', 'BUY_ONE_GET_ONE', 'CASHBACK']),
  value: z.number(),
  applicableTo: z.enum(['ALL', 'RESTAURANT', 'DISH', 'USER']),
  code: z.string().optional(),
  codeType: z.enum(['USER_ENTRY', 'AUTO_APPLIED']),
  minOrder: z.number().optional(),
  maxDiscount: z.number().optional(),
  source: z.enum(['REZ', 'RESTAURANT', 'BANK', 'PLATFORM']),
  bankName: z.string().optional(),
  cardType: z.string().optional(),
  startsAt: z.date(),
  endsAt: z.date(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  usedCount: z.number(),
});

export const DealsQuerySchema = z.object({
  type: z.enum(['PERCENTAGE_OFF', 'FLAT_OFF', 'FREE_DELIVERY', 'BUY_ONE_GET_ONE', 'CASHBACK']).optional(),
  source: z.enum(['REZ', 'RESTAURANT', 'BANK', 'PLATFORM']).optional(),
  restaurantId: z.string().optional(),
  city: z.string().optional(),
  sortBy: z.enum(['popular', 'expiring', 'newest']).default('popular'),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type DealsQuery = z.infer<typeof DealsQuerySchema>;

// ===================
// Community
// ===================

export const FoodPostSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  authorId: z.string(),
  type: z.enum(['REVIEW', 'DEAL', 'QUESTION', 'DISCOVERY', 'TIP']),
  title: z.string().optional(),
  content: z.string(),
  images: z.array(z.string()),
  restaurantId: z.string().optional(),
  dishId: z.string().optional(),
  dealId: z.string().optional(),
});

export const CreatePostSchema = z.object({
  groupId: z.string(),
  type: z.enum(['REVIEW', 'DEAL', 'QUESTION', 'DISCOVERY', 'TIP']),
  title: z.string().optional(),
  content: z.string().min(1).max(5000),
  images: z.array(z.string()).max(10).default([]),
  restaurantId: z.string().optional(),
  dishId: z.string().optional(),
  dealId: z.string().optional(),
});

export type CreatePostInput = z.infer<typeof CreatePostSchema>;

export const CreateCommentSchema = z.object({
  postId: z.string(),
  content: z.string().min(1).max(2000),
  parentId: z.string().optional(),
});

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;

// ===================
// AI Advisor
// ===================

export const AdvisorMessageSchema = z.object({
  message: z.string().min(1).max(1000),
  conversationId: z.string().optional(),
  location: z.string().optional(),
  budget: z.number().optional(),
  preferences: z.array(z.string()).optional(),
});

export type AdvisorMessageInput = z.infer<typeof AdvisorMessageSchema>;

// ===================
// User Preferences
// ===================

export const UserPreferencesSchema = z.object({
  dietaryPrefs: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  favoriteCuisines: z.array(z.string()).default([]),
  favoriteDishes: z.array(z.string()).default([]),
  avgOrderValue: z.number().optional(),
  orderFrequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  defaultLocation: z.string().optional(),
});

export type UserPreferencesInput = z.infer<typeof UserPreferencesSchema>;

// ===================
// Redirect
// ===================

export const RedirectSchema = z.object({
  platform: z.enum(['rez', 'swiggy', 'zomato', 'magicpin', 'direct']),
  restaurantId: z.string().optional(),
  dishId: z.string().optional(),
  dealCode: z.string().optional(),
});

export type RedirectInput = z.infer<typeof RedirectSchema>;
