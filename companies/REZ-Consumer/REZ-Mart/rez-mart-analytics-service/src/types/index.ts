import { z } from 'zod';

// Event Types
export const EventTypeSchema = z.enum([
  'order',
  'view',
  'search',
  'add_to_cart',
  'checkout',
  'signup'
]);

export type EventType = z.infer<typeof EventTypeSchema>;

// Analytics Event Schema for API validation
export const AnalyticsEventSchema = z.object({
  eventId: z.string().optional(),
  eventType: EventTypeSchema,
  userId: z.string().optional(),
  sessionId: z.string(),
  storeId: z.string().optional(),
  productId: z.string().optional(),
  metadata: z.record(z.any()).optional().default({}),
  timestamp: z.string().datetime().or(z.date()).optional(),
});

export type AnalyticsEventInput = z.infer<typeof AnalyticsEventSchema>;

// Batch Events Schema
export const BatchEventsSchema = z.object({
  events: z.array(AnalyticsEventSchema).min(1).max(1000),
});

export type BatchEventsInput = z.infer<typeof BatchEventsSchema>;

// Query Filters Schema
export const EventFiltersSchema = z.object({
  eventType: EventTypeSchema.optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  storeId: z.string().optional(),
  productId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(1000).default(100),
  offset: z.number().int().min(0).default(0),
});

export type EventFilters = z.infer<typeof EventFiltersSchema>;

// Stats Response Types
export interface OverviewStats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalSessions: number;
  totalProducts: number;
  averageOrderValue: number;
  conversionRate: number;
  topCategories: Array<{ category: string; count: number }>;
  periodStats: {
    ordersToday: number;
    ordersThisWeek: number;
    ordersThisMonth: number;
    revenueToday: number;
    revenueThisWeek: number;
    revenueThisMonth: number;
  };
}

export interface StoreStats {
  storeId: string;
  totalOrders: number;
  totalRevenue: number;
  totalViews: number;
  totalAddToCart: number;
  conversionRate: number;
  averageOrderValue: number;
  popularProducts: Array<{ productId: string; count: number; revenue: number }>;
  hourlyDistribution: Array<{ hour: number; orders: number; revenue: number }>;
}

export interface UserStats {
  userId: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: Date | null;
  favoriteStore: string | null;
  favoriteProducts: Array<{ productId: string; count: number }>;
  sessionCount: number;
  cartAbandonmentRate: number;
}

export interface PopularProduct {
  productId: string;
  viewCount: number;
  addToCartCount: number;
  orderCount: number;
  revenue: number;
  conversionRate: number;
}

export interface RevenueStats {
  period: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  data: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

// MongoDB Document Interface
export interface IAnalyticsEvent {
  eventId: string;
  eventType: EventType;
  userId?: string;
  sessionId: string;
  storeId?: string;
  productId?: string;
  metadata: Record<string, any>;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}
