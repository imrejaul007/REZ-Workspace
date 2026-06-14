import { z } from 'zod';

// Goal Types
export const GoalTypeSchema = z.enum(['leads', 'sales', 'bookings', 'traffic', 'awareness']);

// Build Status
export const BuildStatusSchema = z.enum(['parsing', 'generating', 'completed', 'failed']);

// Campaign Status
export const CampaignStatusSchema = z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']);

// Channel Types
export const ChannelTypeSchema = z.enum([
  'google', 'facebook', 'instagram', 'youtube', 'linkedin', 'twitter', 'tiktok', 'display', 'native'
]);

// Demographics Schema
export const DemographicsSchema = z.object({
  age: z.string().optional(),
  gender: z.string().optional(),
  income: z.string().optional(),
  education: z.string().optional(),
  occupation: z.array(z.string()).optional()
}).optional();

// Audience Targeting Schema
export const AudienceTargetingSchema = z.object({
  location: z.array(z.string()).min(1, 'At least one location is required'),
  demographics: DemographicsSchema,
  interests: z.array(z.string()).optional(),
  income: z.string().optional(),
  behaviors: z.array(z.string()).optional(),
  customSegments: z.array(z.string()).optional()
});

// Product Schema
export const ProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  price: z.number().positive().optional(),
  category: z.string().optional(),
  sku: z.string().optional(),
  description: z.string().optional()
});

// Budget Configuration Schema
export const BudgetConfigSchema = z.object({
  amount: z.number().positive('Budget amount must be positive'),
  currency: z.string().default('INR'),
  allocation: z.object({
    channels: z.record(z.string(), z.number()),
    creative: z.number().optional(),
    testing: z.number().optional()
  }).optional(),
  optimization: z.enum(['aggressive', 'moderate', 'conservative']).default('moderate')
});

// Campaign Goal Schema
export const CampaignGoalSchema = z.object({
  type: GoalTypeSchema,
  target: z.number().positive('Target must be positive'),
  timeline: z.string().optional(),
  kpi: z.string().optional(),
  conversionMetric: z.string().optional()
});

// Parsed Intent Schema
export const ParsedIntentSchema = z.object({
  goal: CampaignGoalSchema,
  audience: AudienceTargetingSchema,
  budget: BudgetConfigSchema,
  products: z.array(ProductSchema).optional(),
  channels: z.array(ChannelTypeSchema).optional(),
  timeline: z.object({
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    duration: z.string().optional()
  }).optional(),
  additionalContext: z.record(z.unknown()).optional()
});

// Campaign Ad Schema
export const CampaignAdSchema = z.object({
  id: z.string(),
  type: z.enum(['image', 'video', 'carousel', 'text', 'story']),
  headline: z.string().min(1, 'Headline is required'),
  description: z.string().optional(),
  callToAction: z.string().min(1, 'Call to action is required'),
  creativeAssets: z.object({
    images: z.array(z.string()).optional(),
    videos: z.array(z.string()).optional(),
    copyVariants: z.array(z.string()).optional()
  }).optional(),
  targetingOverrides: z.object({
    location: z.array(z.string()).optional(),
    ageRange: z.object({ min: z.number(), max: z.number() }).optional(),
    interests: z.array(z.string()).optional()
  }).optional()
});

// A/B Test Schema
export const ABTestConfigSchema = z.object({
  enabled: z.boolean().default(false),
  variants: z.array(z.object({
    id: z.string(),
    name: z.string(),
    weight: z.number().min(0).max(100),
    changes: z.record(z.unknown())
  })).optional(),
  metric: z.string().default('conversions'),
  sampleSize: z.number().positive().optional(),
  confidence: z.number().min(0).max(1).optional()
});

// Campaign Targeting Schema
export const CampaignTargetingSchema = z.object({
  locations: z.array(z.string()).min(1),
  ageRange: z.object({ min: z.number().min(13), max: z.number().max(65) }).optional(),
  gender: z.array(z.string()).optional(),
  interests: z.array(z.string()).default([]),
  behaviors: z.array(z.string()).default([]),
  customAudiences: z.array(z.string()).optional(),
  lookalikeAudiences: z.array(z.string()).optional(),
  placement: z.array(z.string()).optional(),
  deviceTypes: z.array(z.enum(['desktop', 'mobile', 'tablet'])).optional()
});

// Bid Strategy Schema
export const BidStrategySchema = z.object({
  type: z.enum(['cpc', 'cpm', 'cpa', 'cpv', 'auto']),
  bidAmount: z.number().positive().optional(),
  maxBid: z.number().positive().optional(),
  targetCost: z.number().positive().optional()
});

// Generated Campaign Schema
export const GeneratedCampaignSchema = z.object({
  name: z.string().min(1),
  objective: GoalTypeSchema,
  status: CampaignStatusSchema.default('draft'),
  budget: BudgetConfigSchema,
  targeting: CampaignTargetingSchema,
  ads: z.array(CampaignAdSchema).min(1, 'At least one ad is required'),
  schedule: z.object({
    startDate: z.date(),
    endDate: z.date().optional(),
    frequencyCap: z.number().positive().optional()
  }),
  bidStrategy: BidStrategySchema,
  tracking: z.object({
    pixelIds: z.array(z.string()).optional(),
    conversionEvents: z.array(z.string()).optional(),
    utmParams: z.record(z.string()).optional()
  }).optional(),
  optimization: z.object({
    bidOptimization: z.boolean().default(true),
    audienceExpansion: z.boolean().default(false),
    placements: z.array(z.string()).default([])
  }).optional()
});

// NL Campaign Build Schema
export const NLCampaignBuildSchema = z.object({
  buildId: z.string().uuid(),
  advertiserId: z.string().min(1),
  naturalLanguage: z.string().min(1),
  parsed: ParsedIntentSchema,
  generatedCampaign: GeneratedCampaignSchema,
  confidence: z.number().min(0).max(1),
  suggestions: z.array(z.string()).default([]),
  status: BuildStatusSchema,
  errors: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional(),
  metadata: z.object({
    model: z.string().optional(),
    processingTime: z.number().optional(),
    tokensUsed: z.number().optional()
  }).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// API Request Schemas
export const BuildCampaignRequestSchema = z.object({
  naturalLanguage: z.string().min(10, 'Please provide more details for better results'),
  advertiserId: z.string().min(1, 'Advertiser ID is required'),
  context: z.object({
    previousCampaigns: z.array(z.string()).optional(),
    industry: z.string().optional(),
    brandGuidelines: z.record(z.string(), z.string()).optional()
  }).optional()
});

export const ValidateCampaignRequestSchema = z.object({
  campaign: GeneratedCampaignSchema.partial(),
  strict: z.boolean().default(false)
});

export const AdjustCampaignRequestSchema = z.object({
  feedback: z.string().min(1),
  changes: GeneratedCampaignSchema.partial().optional()
});

// Export types
export type GoalType = z.infer<typeof GoalTypeSchema>;
export type BuildStatus = z.infer<typeof BuildStatusSchema>;
export type CampaignStatus = z.infer<typeof CampaignStatusSchema>;
export type ChannelType = z.infer<typeof ChannelTypeSchema>;
export type Demographics = z.infer<typeof DemographicsSchema>;
export type AudienceTargeting = z.infer<typeof AudienceTargetingSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type BudgetConfig = z.infer<typeof BudgetConfigSchema>;
export type CampaignGoal = z.infer<typeof CampaignGoalSchema>;
export type ParsedIntent = z.infer<typeof ParsedIntentSchema>;
export type CampaignAd = z.infer<typeof CampaignAdSchema>;
export type ABTestConfig = z.infer<typeof ABTestConfigSchema>;
export type CampaignTargeting = z.infer<typeof CampaignTargetingSchema>;
export type BidStrategy = z.infer<typeof BidStrategySchema>;
export type GeneratedCampaign = z.infer<typeof GeneratedCampaignSchema>;
export type NLCampaignBuild = z.infer<typeof NLCampaignBuildSchema>;
export type BuildCampaignRequest = z.infer<typeof BuildCampaignRequestSchema>;
export type ValidateCampaignRequest = z.infer<typeof ValidateCampaignRequestSchema>;
export type AdjustCampaignRequest = z.infer<typeof AdjustCampaignRequestSchema>;