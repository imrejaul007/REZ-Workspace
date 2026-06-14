import { z } from 'zod';

// Bid Strategy Types
export const BidStrategySchema = z.enum(['manual', 'auto', 'rule-based']);
export type BidStrategy = z.infer<typeof BidStrategySchema>;

// Sponsored Product Status
export const SponsoredProductStatusSchema = z.enum(['active', 'paused', 'outbid']);
export type SponsoredProductStatus = z.infer<typeof SponsoredProductStatusSchema>;

// Product Info Schema
export const ProductInfoSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  price: z.number().positive(),
  imageUrl: z.string().url().optional(),
});
export type ProductInfo = z.infer<typeof ProductInfoSchema>;

// Bid Configuration Schema
export const BidConfigSchema = z.object({
  amount: z.number().min(0.01),
  strategy: BidStrategySchema,
  maxBid: z.number().min(0.01),
});
export type BidConfig = z.infer<typeof BidConfigSchema>;

// Budget Schema
export const BudgetSchema = z.object({
  daily: z.number().min(0),
  total: z.number().min(0),
  spent: z.number().min(0).default(0),
});
export type Budget = z.infer<typeof BudgetSchema>;

// Targeting Schema
export const TargetingSchema = z.object({
  keywords: z.array(z.string()).default([]),
  categoryMatch: z.boolean().default(false),
  priceRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
  }).optional(),
});
export type Targeting = z.infer<typeof TargetingSchema>;

// Performance Metrics Schema
export const PerformanceSchema = z.object({
  impressions: z.number().min(0).default(0),
  clicks: z.number().min(0).default(0),
  ctr: z.number().min(0).default(0),
  orders: z.number().min(0).default(0),
  revenue: z.number().min(0).default(0),
  acos: z.number().min(0).default(0),
  searchRank: z.number().min(0).default(0),
});
export type Performance = z.infer<typeof PerformanceSchema>;

// Main Sponsored Product Interface
export interface ISponsoredProduct {
  sponsoredId: string;
  campaignId: string;
  merchantId: string;
  productId: string;
  product: ProductInfo;
  bid: BidConfig;
  budget: Budget;
  targeting: Targeting;
  performance: Performance;
  status: SponsoredProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Create Sponsored Product DTO
export const CreateSponsoredProductSchema = z.object({
  campaignId: z.string().min(1),
  productId: z.string().min(1),
  product: ProductInfoSchema,
  bid: BidConfigSchema,
  budget: BudgetSchema.omit({ spent: true }),
  targeting: TargetingSchema.optional(),
});
export type CreateSponsoredProductDTO = z.infer<typeof CreateSponsoredProductSchema>;

// Update Sponsored Product DTO
export const UpdateSponsoredProductSchema = z.object({
  bid: BidConfigSchema.partial().optional(),
  budget: BudgetSchema.partial().optional(),
  targeting: TargetingSchema.partial().optional(),
  status: SponsoredProductStatusSchema.optional(),
});
export type UpdateSponsoredProductDTO = z.infer<typeof UpdateSponsoredProductSchema>;

// Place Bid DTO
export const PlaceBidSchema = z.object({
  sponsoredId: z.string().min(1),
  amount: z.number().min(0.01),
  maxBid: z.number().min(0.01).optional(),
});
export type PlaceBidDTO = z.infer<typeof PlaceBidSchema>;

// Search Products DTO
export const SearchProductsSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  merchantId: z.string().optional(),
  status: SponsoredProductStatusSchema.optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});
export type SearchProductsDTO = z.infer<typeof SearchProductsSchema>;

// Performance Query DTO
export const PerformanceQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  groupBy: z.enum(['day', 'week', 'month']).optional(),
});
export type PerformanceQueryDTO = z.infer<typeof PerformanceQuerySchema>;

// Pagination Response
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  merchantId: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Request with User
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

// Performance History Entry
export interface PerformanceHistoryEntry {
  date: Date;
  impressions: number;
  clicks: number;
  orders: number;
  revenue: number;
  acos: number;
}

// Bid Event
export interface BidEvent {
  sponsoredId: string;
  amount: number;
  timestamp: Date;
  status: 'placed' | 'won' | 'lost' | 'outbid';
}

// Campaign Info (reference)
export interface CampaignInfo {
  campaignId: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
}

// Auto-bidding Rule
export interface AutoBidRule {
  ruleId: string;
  name: string;
  conditions: {
    targetAcos?: number;
    minImpressions?: number;
    maxClicks?: number;
  };
  actions: {
    adjustBidBy: number;
    adjustBidType: 'percentage' | 'fixed';
  };
  enabled: boolean;
}
