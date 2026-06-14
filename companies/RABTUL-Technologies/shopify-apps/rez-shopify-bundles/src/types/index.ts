import { z } from 'zod';

export const BundleItemSchema = z.object({
  shopifyProductId: z.string(),
  shopifyVariantId: z.string().optional(),
  quantity: z.number().min(1).default(1),
  discountType: z.enum(['percentage', 'fixed', 'price']).default('percentage'),
  discountValue: z.number().min(0)
});
export type BundleItem = z.infer<typeof BundleItemSchema>;

export const BundleSchema = z.object({
  id: z.string().optional(),
  shopifyProductId: z.string(),
  shopifyVariantId: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  bundleType: z.enum(['fixed', 'dynamic', 'build_your_own', 'subscription']).default('fixed'),
  items: z.array(BundleItemSchema).min(2),
  discountPercentage: z.number().min(0).max(100).default(0),
  minItems: z.number().min(1).optional(),
  maxItems: z.number().min(1).optional(),
  minPurchaseAmount: z.number().min(0).optional(),
  isActive: z.boolean().default(true),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});
export type Bundle = z.infer<typeof BundleSchema>;

export const BundleRecommendationSchema = z.object({
  bundleId: z.string(),
  shopifyProductId: z.string(),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
  discountApplied: z.number().optional()
});
export type BundleRecommendation = z.infer<typeof BundleRecommendationSchema>;

export const BundleStatsSchema = z.object({
  bundleId: z.string(),
  totalOrders: z.number(),
  totalRevenue: z.number(),
  avgOrderValue: z.number(),
  conversionRate: z.number(),
  topProducts: z.array(z.object({
    shopifyProductId: z.string(),
    count: z.number()
  })).default([])
});
export type BundleStats = z.infer<typeof BundleStatsSchema>;
