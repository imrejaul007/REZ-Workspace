/**
 * Zod Validation Schemas for DPA Engine
 */

import { z } from 'zod';

// Element styles validation
const elementStyleSchema = z.object({
  fontFamily: z.string().optional(),
  fontSize: z.number().optional(),
  fontWeight: z.union([z.string(), z.number()]).optional(),
  color: z.string().optional(),
  backgroundColor: z.string().optional(),
  borderRadius: z.number().optional(),
  borderWidth: z.number().optional(),
  borderColor: z.string().optional(),
  padding: z.number().optional(),
  margin: z.number().optional(),
  textAlign: z.enum(['left', 'center', 'right']).optional(),
  lineHeight: z.number().optional(),
  letterSpacing: z.number().optional(),
  opacity: z.number().min(0).max(1).optional(),
  zIndex: z.number().optional(),
});

// Element position validation
const elementPositionSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

// Template element type enum
const templateElementTypeSchema = z.enum([
  'product_image',
  'product_name',
  'price',
  'original_price',
  'discount',
  'cta',
  'logo',
  'badge',
  'rating',
  'description',
  'brand',
  'availability',
]);

// Template element schema
const templateElementSchema = z.object({
  type: templateElementTypeSchema,
  position: elementPositionSchema,
  style: elementStyleSchema,
  content: z.string().optional(),
  dynamicField: z.string().optional(),
});

// Layout type enum
const layoutTypeSchema = z.enum(['grid', 'carousel', 'single', 'hero', 'collection']);

// Ad template schema
const adTemplateSchema = z.object({
  layout: layoutTypeSchema,
  dimensions: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  elements: z.array(templateElementSchema).min(1),
  backgroundColor: z.string().optional(),
  borderRadius: z.number().optional(),
  spacing: z.number().optional(),
});

// Targeting rules schema
const targetingRulesSchema = z.object({
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  categories: z.array(z.string()).optional(),
  excludeProducts: z.array(z.string()).optional(),
  discountThreshold: z.number().min(0).max(100).optional(),
  inStockOnly: z.boolean().optional(),
  brandWhitelist: z.array(z.string()).optional(),
  brandBlacklist: z.array(z.string()).optional(),
});

// User targeting schema
const userTargetingSchema = z.object({
  userSegments: z.array(z.string()).optional(),
  browsingHistory: z.boolean().optional(),
  cartAbandoners: z.boolean().optional(),
  lookalikeAudience: z.boolean().optional(),
  retargetingDays: z.number().min(1).max(90).optional(),
});

// Product schema
const productSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  category: z.string().min(1),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  price: z.number().positive(),
  originalPrice: z.number().positive().optional(),
  currency: z.string().length(3).default('INR'),
  imageUrl: z.string().url(),
  images: z.array(z.string().url()).optional(),
  url: z.string(),
  availability: z.enum(['in_stock', 'out_of_stock', 'limited']),
  stockQuantity: z.number().int().min(0).optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().min(0).optional(),
  tags: z.array(z.string()).optional(),
  attributes: z.record(z.string()).optional(),
});

// Feed source enum
const feedSourceSchema = z.enum(['manual', 'shopify', 'woocommerce', 'magento', 'bigcommerce', 'api']);

// Feed sync config schema
const feedSyncConfigSchema = z.object({
  enabled: z.boolean().default(true),
  frequency: z.enum(['hourly', 'daily', 'weekly']).default('daily'),
  lastSync: z.date().optional(),
  nextSync: z.date().optional(),
  apiKey: z.string().optional(),
  webhookUrl: z.string().url().optional(),
});

// Feed upload schema
export const feedUploadSchema = z.object({
  name: z.string().min(1).max(200),
  merchantId: z.string().min(1),
  source: feedSourceSchema.default('manual'),
  sourceUrl: z.string().url().optional(),
  products: z.array(productSchema).min(1).max(50000),
  syncConfig: feedSyncConfigSchema.optional(),
});

// Campaign metrics schema
const campaignMetricsSchema = z.object({
  impressions: z.number().int().min(0).default(0),
  clicks: z.number().int().min(0).default(0),
  orders: z.number().int().min(0).default(0),
  revenue: z.number().min(0).default(0),
  ctr: z.number().min(0).max(100).default(0),
  conversionRate: z.number().min(0).max(100).default(0),
  costPerClick: z.number().min(0).default(0),
  costPerOrder: z.number().min(0).default(0),
  roas: z.number().min(0).default(0),
});

// Campaign budget schema
const campaignBudgetSchema = z.object({
  daily: z.number().positive().optional(),
  total: z.number().positive().optional(),
  spent: z.number().min(0).default(0),
});

// Campaign schedule schema
const campaignScheduleSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  timezone: z.string().default('Asia/Kolkata'),
});

// Create campaign schema
export const createCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  advertiserId: z.string().min(1),
  feedId: z.string().min(1),
  template: adTemplateSchema,
  rules: targetingRulesSchema.optional(),
  targeting: userTargetingSchema.optional(),
  budget: campaignBudgetSchema.optional(),
  schedule: campaignScheduleSchema.optional(),
});

// Update campaign schema
export const updateCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  template: adTemplateSchema.optional(),
  rules: targetingRulesSchema.optional(),
  targeting: userTargetingSchema.optional(),
  budget: campaignBudgetSchema.optional(),
  schedule: campaignScheduleSchema.optional(),
  status: z.enum(['active', 'paused', 'completed', 'draft']).optional(),
});

// Render context schema
const renderContextSchema = z.object({
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  deviceType: z.enum(['mobile', 'desktop', 'tablet']).optional(),
  location: z.object({
    country: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
  }).optional(),
  browsingHistory: z.array(z.string()).optional(),
  cartItems: z.array(z.string()).optional(),
  userSegments: z.array(z.string()).optional(),
  preferences: z.object({
    language: z.string().optional(),
    currency: z.string().optional(),
  }).optional(),
});

// Preview request schema
export const previewRequestSchema = z.object({
  campaignId: z.string().min(1),
  productId: z.string().optional(),
  context: renderContextSchema.optional(),
});

// Render request schema
export const renderRequestSchema = z.object({
  campaignId: z.string().min(1),
  productId: z.string().optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  context: renderContextSchema.optional(),
});

// Batch render request schema
export const batchRenderRequestSchema = z.object({
  campaignId: z.string().min(1),
  productIds: z.array(z.string()).optional(),
  count: z.number().int().min(1).max(100).default(10),
  context: renderContextSchema.optional(),
});

// List queries schema
export const listFeedsQuerySchema = z.object({
  merchantId: z.string().optional(),
  status: z.enum(['active', 'syncing', 'paused', 'error']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const listCampaignsQuerySchema = z.object({
  advertiserId: z.string().optional(),
  status: z.enum(['active', 'paused', 'completed', 'draft']).optional(),
  feedId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ID param schema
export const idParamSchema = z.object({
  id: z.string().min(1),
});

// Export all schemas
export const schemas = {
  feedUpload: feedUploadSchema,
  createCampaign: createCampaignSchema,
  updateCampaign: updateCampaignSchema,
  previewRequest: previewRequestSchema,
  renderRequest: renderRequestSchema,
  batchRenderRequest: batchRenderRequestSchema,
  listFeedsQuery: listFeedsQuerySchema,
  listCampaignsQuery: listCampaignsQuerySchema,
  idParam: idParamSchema,
};

export type FeedUploadInput = z.infer<typeof feedUploadSchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type PreviewRequestInput = z.infer<typeof previewRequestSchema>;
export type RenderRequestInput = z.infer<typeof renderRequestSchema>;
export type BatchRenderRequestInput = z.infer<typeof batchRenderRequestSchema>;
export type ListFeedsQueryInput = z.infer<typeof listFeedsQuerySchema>;
export type ListCampaignsQueryInput = z.infer<typeof listCampaignsQuerySchema>;