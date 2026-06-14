import { z } from 'zod';

export const PriceRuleSchema = z.object({
  id: z.string().optional(),
  shopifyShopId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  ruleType: z.enum(['percentage', 'fixed', 'bogo', 'tiered', 'bundle']),
  value: z.number(),
  conditions: z.array(z.object({
    type: z.enum(['product', 'collection', 'customer_tag', 'customer_segment', 'country', 'cart_total', 'quantity']),
    operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'in', 'not_in']),
    value: z.union([z.string(), z.number(), z.array(z.string())])
  })).default([]),
  discountType: z.enum(['percentage', 'fixed_amount', 'fixed_price', 'free_shipping']),
  maxUses: z.number().optional(),
  currentUses: z.number().default(0),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().default(true),
  priority: z.number().default(0),
  stackable: z.boolean().default(false),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});
export type PriceRule = z.infer<typeof PriceRuleSchema>;

export const TieredPricingSchema = z.object({
  id: z.string().optional(),
  shopifyProductId: z.string(),
  tiers: z.array(z.object({
    minQuantity: z.number(),
    maxQuantity: z.number().optional(),
    price: z.number()
  })).default([]),
  isActive: z.boolean().default(true)
});
export type TieredPricing = z.infer<typeof TieredPricingSchema>;

export const PriceRuleStatsSchema = z.object({
  ruleId: z.string(),
  totalUses: z.number(),
  totalDiscount: z.number(),
  avgDiscount: z.number(),
  conversionRate: z.number(),
  revenue: z.number()
});
export type PriceRuleStats = z.infer<typeof PriceRuleStatsSchema>;
