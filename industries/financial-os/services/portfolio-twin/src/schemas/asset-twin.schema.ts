import { z } from 'zod';

// ============================================================================
// ASSET TWIN SCHEMAS
// ============================================================================

// Enums
export const AssetClassSchema = z.enum(['equity', 'fixed_income', 'etf', 'mutual_fund', 'commodity', 'crypto', 'forex']);
export const TrendSchema = z.enum(['bullish', 'bearish', 'neutral']);
export const SentimentSchema = z.enum(['positive', 'negative', 'neutral']);
export const IslamicComplianceStatusSchema = z.enum(['compliant', 'non_compliant', 'review']);

// ============================================================================
// PROFILE SCHEMA
// ============================================================================

export const AssetProfileSchema = z.object({
  ticker: z.string().min(1, 'Ticker is required'),
  name: z.string().min(1, 'Name is required'),
  asset_class: AssetClassSchema.default('equity'),
  exchange: z.string().min(1, 'Exchange is required'),
  cusip: z.string().optional(),
  isin: z.string().optional(),
});

export type AssetProfile = z.infer<typeof AssetProfileSchema>;

// ============================================================================
// PRICING SCHEMA
// ============================================================================

export const PricingSchema = z.object({
  last_price: z.number().min(0).default(0),
  bid: z.number().min(0).default(0),
  ask: z.number().min(0).default(0),
  bid_size: z.number().min(0).default(0),
  ask_size: z.number().min(0).default(0),
  volume: z.number().min(0).default(0),
  avg_volume_30d: z.number().min(0).default(0),
  updated_at: z.string().datetime().optional(),
});

export type Pricing = z.infer<typeof PricingSchema>;

// ============================================================================
// FUNDAMENTALS SCHEMA
// ============================================================================

export const FundamentalsSchema = z.object({
  market_cap: z.number().min(0).default(0),
  enterprise_value: z.number().min(0).default(0),
  pe_ratio: z.number().default(0),
  forward_pe: z.number().default(0),
  peg_ratio: z.number().default(0),
  pb_ratio: z.number().default(0),
  ps_ratio: z.number().default(0),
  dividend_yield: z.number().default(0),
  dividend_amount: z.number().default(0),
  beta: z.number().default(1),
  revenue: z.number().min(0).default(0),
  ebitda: z.number().min(0).default(0),
  eps: z.number().default(0),
  eps_growth: z.number().default(0),
});

export type Fundamentals = z.infer<typeof FundamentalsSchema>;

// ============================================================================
// TECHNICAL SCHEMA
// ============================================================================

export const TechnicalSchema = z.object({
  sma_50: z.number().default(0),
  sma_200: z.number().default(0),
  w52_high: z.number().default(0),
  w52_low: z.number().default(0),
  rsi_14: z.number().min(0).max(100).default(50),
  macd: z.string().default('neutral'),
  trend: TrendSchema.default('neutral'),
});

export type Technical = z.infer<typeof TechnicalSchema>;

// ============================================================================
// TOP HOLDER SCHEMA
// ============================================================================

export const TopHolderSchema = z.object({
  holder: z.string().min(1),
  shares: z.number().min(0),
  pct: z.number().min(0).max(100),
});

export type TopHolder = z.infer<typeof TopHolderSchema>;

// ============================================================================
// OWNERSHIP SCHEMA
// ============================================================================

export const OwnershipSchema = z.object({
  institutions_pct: z.number().min(0).max(100).default(0),
  insiders_pct: z.number().min(0).max(100).default(0),
  public_float_pct: z.number().min(0).max(100).default(100),
  top_holders: z.array(TopHolderSchema).default([]),
});

export type Ownership = z.infer<typeof OwnershipSchema>;

// ============================================================================
// ISLAMIC COMPLIANCE SCHEMA
// ============================================================================

export const IslamicComplianceSchema = z.object({
  screened: z.boolean().default(false),
  compliance_status: IslamicComplianceStatusSchema.default('review'),
  debt_ratio: z.number().min(0).max(100).default(0),
  interest_income_pct: z.number().min(0).max(100).default(0),
  cash_flow_operations: z.array(z.string()).default([]),
});

export type IslamicCompliance = z.infer<typeof IslamicComplianceSchema>;

// ============================================================================
// NEWS ITEM SCHEMA
// ============================================================================

export const NewsItemSchema = z.object({
  headline: z.string().min(1),
  source: z.string().min(1),
  sentiment: SentimentSchema.default('neutral'),
  published_at: z.string().datetime(),
});

export type NewsItem = z.infer<typeof NewsItemSchema>;

// ============================================================================
// ASSET TWIN FULL SCHEMA
// ============================================================================

export const AssetTwinSchema = z.object({
  asset_id: z.string().min(1, 'Asset ID is required'),
  twin_id: z.string().optional(),
  profile: AssetProfileSchema,
  pricing: PricingSchema.default({}),
  fundamentals: FundamentalsSchema.default({}),
  technical: TechnicalSchema.default({}),
  ownership: OwnershipSchema.default({}),
  islamic_compliance: IslamicComplianceSchema.default({}),
  news: z.array(NewsItemSchema).default([]),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  version: z.number().int().default(1),
});

export type AssetTwin = z.infer<typeof AssetTwinSchema>;

// ============================================================================
// API REQUEST/RESPONSE SCHEMAS
// ============================================================================

export const CreateAssetTwinRequestSchema = AssetTwinSchema.omit({
  twin_id: true,
  created_at: true,
  updated_at: true,
  version: true,
  pricing: true,
  fundamentals: true,
  technical: true,
  ownership: true,
  islamic_compliance: true,
  news: true,
}).extend({
  asset_id: z.string().min(1),
});

export const UpdateAssetTwinRequestSchema = z.object({
  profile: AssetProfileSchema.partial().optional(),
  pricing: PricingSchema.partial().optional(),
  fundamentals: FundamentalsSchema.partial().optional(),
  technical: TechnicalSchema.partial().optional(),
  ownership: OwnershipSchema.partial().optional(),
  islamic_compliance: IslamicComplianceSchema.partial().optional(),
});

export const UpdatePricingRequestSchema = z.object({
  last_price: z.number().min(0),
  bid: z.number().min(0).optional(),
  ask: z.number().min(0).optional(),
  bid_size: z.number().min(0).optional(),
  ask_size: z.number().min(0).optional(),
  volume: z.number().min(0).optional(),
});

export const AddNewsRequestSchema = z.object({
  headline: z.string().min(1),
  source: z.string().min(1),
  sentiment: SentimentSchema.default('neutral'),
});

// API Response schemas
export const AssetTwinResponseSchema = AssetTwinSchema;
export const AssetTwinListResponseSchema = z.object({
  twins: z.array(AssetTwinSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export type CreateAssetTwinRequest = z.infer<typeof CreateAssetTwinRequestSchema>;
export type UpdateAssetTwinRequest = z.infer<typeof UpdateAssetTwinRequestSchema>;
export type UpdatePricingRequest = z.infer<typeof UpdatePricingRequestSchema>;
export type AddNewsRequest = z.infer<typeof AddNewsRequestSchema>;
export type AssetTwinResponse = z.infer<typeof AssetTwinSchema>;
export type AssetTwinListResponse = z.infer<typeof AssetTwinListResponseSchema>;
