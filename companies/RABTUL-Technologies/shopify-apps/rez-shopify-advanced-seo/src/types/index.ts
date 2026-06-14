import { z } from 'zod';

export const SEOMetaSchema = z.object({
  id: z.string().optional(),
  shopifyProductId: z.string().optional(),
  shopifyCollectionId: z.string().optional(),
  shopifyPageId: z.string().optional(),
  title: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  keywords: z.array(z.string()).default([]),
  canonicalUrl: z.string().url().optional(),
  ogImage: z.string().url().optional(),
  structuredData: z.record(z.any()).optional(),
  focusKeyword: z.string().optional(),
  seoScore: z.number().min(0).max(100).optional(),
  readabilityScore: z.number().min(0).max(100).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});
export type SEOMeta = z.infer<typeof SEOMetaSchema>;

export const SEOScoreSchema = z.object({
  productId: z.string(),
  overallScore: z.number(),
  titleScore: z.number(),
  descriptionScore: z.number(),
  imageScore: z.number(),
  urlScore: z.number(),
  structuredDataScore: z.number(),
  issues: z.array(z.object({
    type: z.enum(['error', 'warning', 'info']),
    message: z.string(),
    field: z.string().optional()
  })).default([])
});
export type SEOScore = z.infer<typeof SEOScoreSchema>;

export const SitemapConfigSchema = z.object({
  id: z.string().optional(),
  shopifyShopId: z.string(),
  includeProducts: z.boolean().default(true),
  includeCollections: z.boolean().default(true),
  includePages: z.boolean().default(true),
  includeBlogPosts: z.boolean().default(false),
  changefreq: z.enum(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']).default('weekly'),
  priority: z.record(z.number()).default({}),
  lastGenerated: z.string().optional()
});
export type SitemapConfig = z.infer<typeof SitemapConfigSchema>;

export const RedirectRuleSchema = z.object({
  id: z.string().optional(),
  shopifyShopId: z.string(),
  oldPath: z.string(),
  newPath: z.string(),
  type: z.enum(['301', '302', '307']).default('301'),
  isActive: z.boolean().default(true),
  hitCount: z.number().default(0),
  createdAt: z.string().optional()
});
export type RedirectRule = z.infer<typeof RedirectRuleSchema>;
