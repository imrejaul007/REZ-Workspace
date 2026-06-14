import { z } from 'zod';

// Campaign Types
export const CampaignTypeSchema = z.enum(['sponsored_products', 'display', 'video', 'search']);
export type CampaignType = z.infer<typeof CampaignTypeSchema>;

export const AudienceTypeSchema = z.enum(['shoppers', 'repeat_buyers', 'cart_abandoners']);
export type AudienceType = z.infer<typeof AudienceTypeSchema>;

export const CampaignStatusSchema = z.enum(['active', 'paused', 'completed']);
export type CampaignStatus = z.infer<typeof CampaignStatusSchema>;

// Product Schema
export const ProductBidSchema = z.object({
  productId: z.string().min(1),
  bidAmount: z.number().positive(),
  dailyBudget: z.number().positive(),
});

export type ProductBid = z.infer<typeof ProductBidSchema>;

// Targeting Schema
export const TargetingSchema = z.object({
  category: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  priceRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
  }).optional(),
  audienceType: AudienceTypeSchema.optional(),
});

export type Targeting = z.infer<typeof TargetingSchema>;

// Budget Schema
export const BudgetSchema = z.object({
  total: z.number().positive(),
  spent: z.number().min(0).default(0),
});

export type Budget = z.infer<typeof BudgetSchema>;

// Metrics Schema
export const MetricsSchema = z.object({
  impressions: z.number().int().min(0).default(0),
  clicks: z.number().int().min(0).default(0),
  orders: z.number().int().min(0).default(0),
  revenue: z.number().min(0).default(0),
  acos: z.number().min(0).default(0), // Advertising Cost of Sales
});

export type Metrics = z.infer<typeof MetricsSchema>;

// Retail Media Campaign Schema
export const RetailMediaCampaignSchema = z.object({
  campaignId: z.string(),
  merchantId: z.string().min(1),
  name: z.string().min(1).max(200),
  type: CampaignTypeSchema,
  products: z.array(ProductBidSchema).optional(),
  targeting: TargetingSchema,
  budget: BudgetSchema,
  metrics: MetricsSchema,
  status: CampaignStatusSchema.default('active'),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type RetailMediaCampaign = z.infer<typeof RetailMediaCampaignSchema>;

// API Request Schemas
export const CreateCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  type: CampaignTypeSchema,
  products: z.array(ProductBidSchema).optional(),
  targeting: TargetingSchema,
  budget: z.object({
    total: z.number().positive(),
  }),
});

export type CreateCampaignRequest = z.infer<typeof CreateCampaignSchema>;

export const UpdateCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  products: z.array(ProductBidSchema).optional(),
  targeting: TargetingSchema.optional(),
  budget: z.object({
    total: z.number().positive(),
  }).optional(),
  status: CampaignStatusSchema.optional(),
});

export type UpdateCampaignRequest = z.infer<typeof UpdateCampaignSchema>;

export const SponsoredProductSchema = z.object({
  productId: z.string().min(1),
  campaignName: z.string().min(1).max(200),
  bidAmount: z.number().positive(),
  dailyBudget: z.number().positive(),
  targeting: TargetingSchema.optional(),
});

export type SponsoredProductRequest = z.infer<typeof SponsoredProductSchema>;

// Inventory Schema
export const InventoryItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  category: z.string(),
  availableImpressions: z.number().int().min(0),
  estimatedCPM: z.number().positive(), // Cost per thousand impressions
  averageConversionRate: z.number().min(0).max(1),
});

export type InventoryItem = z.infer<typeof InventoryItemSchema>;

// Analytics Schema
export const AnalyticsQuerySchema = z.object({
  campaignId: z.string().optional(),
  merchantId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  groupBy: z.enum(['day', 'week', 'month']).optional(),
});

export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;

export const AnalyticsResponseSchema = z.object({
  summary: MetricsSchema,
  trends: z.array(z.object({
    date: z.string(),
    impressions: z.number(),
    clicks: z.number(),
    orders: z.number(),
    revenue: z.number(),
    acos: z.number(),
  })),
  topProducts: z.array(z.object({
    productId: z.string(),
    productName: z.string(),
    impressions: z.number(),
    clicks: z.number(),
    orders: z.number(),
    revenue: z.number(),
  })),
});

export type AnalyticsResponse = z.infer<typeof AnalyticsResponseSchema>;

// User Types
export interface JwtPayload {
  userId: string;
  merchantId: string;
  role: 'merchant' | 'admin';
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Express.Request {
  user?: JwtPayload;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
