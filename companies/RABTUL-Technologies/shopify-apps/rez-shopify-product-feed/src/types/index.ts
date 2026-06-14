import { z } from 'zod';

export const ProductFeedSchema = z.object({
  id: z.string().optional(),
  shopifyShopId: z.string(),
  name: z.string(),
  format: z.enum(['xml', 'csv', 'json', 'tsv']).default('xml'),
  feedUrl: z.string().url().optional(),
  googleCategory: z.string().optional(),
  includeOutOfStock: z.boolean().default(false),
  includeVariants: z.boolean().default(true),
  customMappings: z.record(z.string()).default({}),
  filterRules: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'contains', 'starts_with', 'greater_than', 'less_than']),
    value: z.string()
  })).default([]),
  isActive: z.boolean().default(true),
  lastGenerated: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});
export type ProductFeed = z.infer<typeof ProductFeedSchema>;

export const FeedItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  link: z.string(),
  imageLink: z.string(),
  price: z.string(),
  salePrice: z.string().optional(),
  availability: z.enum(['in_stock', 'out_of_stock', 'preorder', 'backorder']),
  condition: z.enum(['new', 'refurbished', 'used']).default('new'),
  brand: z.string().optional(),
  mpn: z.string().optional(),
  gtin: z.string().optional(),
  googleProductCategory: z.string().optional(),
  productType: z.string().optional(),
  shipping: z.object({
    country: z.string(),
    region: z.string().optional(),
    service: z.string(),
    price: z.string()
  }).optional(),
  taxes: z.array(z.object({
    country: z.string(),
    region: z.string().optional(),
    tax: z.string()
  })).optional()
});
export type FeedItem = z.infer<typeof FeedItemSchema>;

export const ChannelSchema = z.object({
  id: z.string().optional(),
  shopifyShopId: z.string(),
  channel: z.enum(['google', 'facebook', 'instagram', 'bing', 'tiktok', 'pinterest', 'amazon', 'custom']),
  isActive: z.boolean().default(true),
  feedIds: z.array(z.string()).default([]),
  lastSync: z.string().optional(),
  syncStatus: z.enum(['success', 'failed', 'pending']).optional(),
  errorMessage: z.string().optional()
});
export type Channel = z.infer<typeof ChannelSchema>;
