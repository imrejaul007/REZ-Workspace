/**
 * REZ Revenue AI - Validation Schemas
 * Zod schemas for API request/response validation
 */

import { z } from 'zod';

// ================== ENUMS AS ZOD ==================

export const VerticalSchema = z.enum([
  'restaurant',
  'hotel',
  'clinic',
  'salon',
  'gym',
  'events',
  'retail',
  'home_services',
  'corp_perks',
]);

export const PriceAdjustmentTypeSchema = z.enum([
  'surge',
  'discount',
  'loyalty',
  'bundle',
  'time_based',
  'inventory_based',
]);

export const AudienceSegmentSchema = z.enum(['new', 'regular', 'vip', 'at_risk', 'dormant']);

export const SeasonSchema = z.enum(['spring', 'summer', 'autumn', 'winter']);

export const WeatherConditionSchema = z.enum(['clear', 'rainy', 'stormy', 'hot', 'cold', 'cloudy']);

export const PricingStrategySchema = z.enum(['aggressive', 'balanced', 'conservative']);

export const InventoryVelocitySchema = z.enum(['fast', 'normal', 'slow']);

export const TrendDirectionSchema = z.enum(['increasing', 'stable', 'decreasing']);

export const CityTierSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export const PricingTierSchema = z.enum(['smb', 'growth', 'enterprise']);

export const OfferTypeSchema = z.enum([
  'percentage_discount',
  'fixed_discount',
  'buy_x_get_y',
  'cashback',
  'bundle',
  'free_item',
  'upgrade',
]);

// ================== ENTITY CONTEXT ==================

export const EntityInfoSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['product', 'service', 'ad_inventory', 'room', 'appointment', 'slot']),
  category: z.string().min(1),
  subcategory: z.string().optional(),
  vertical: VerticalSchema,
  name: z.string().min(1),
  basePrice: z.number().positive(),
  cost: z.number().min(0),
  sku: z.string().optional(),
});

export const TimeContextSchema = z.object({
  timestamp: z.date(),
  dayOfWeek: z.union([
    z.literal(0), z.literal(1), z.literal(2), z.literal(3),
    z.literal(4), z.literal(5), z.literal(6),
  ]),
  hourOfDay: z.number().int().min(0).max(23),
  isPeakHour: z.boolean(),
  isWeekend: z.boolean(),
  season: SeasonSchema,
  month: z.number().int().min(1).max(12),
  isHoliday: z.boolean(),
  eventNearby: z.boolean(),
  upcomingEvent: z.object({
    name: z.string(),
    date: z.date(),
    expectedAttendees: z.number().positive(),
  }).optional(),
});

export const DemandContextSchema = z.object({
  current: z.number().min(0).max(100),
  predicted: z.number().min(0).max(100),
  historical: z.number().min(0).max(100),
  realTime: z.number().min(0).max(100),
  trend: TrendDirectionSchema,
  confidence: z.number().min(0).max(1),
  comparisonToAverage: z.number(),
});

export const InventoryContextSchema = z.object({
  level: z.number().min(0),
  max: z.number().positive(),
  percentage: z.number().min(0).max(100),
  daysUntilExpiry: z.number().positive().optional(),
  slotsRemaining: z.number().int().min(0).optional(),
  totalSlots: z.number().positive().optional(),
  velocity: InventoryVelocitySchema,
  reorderPoint: z.number().min(0).optional(),
  isLowStock: z.boolean(),
  isOverstock: z.boolean(),
});

export const CompetitionPriceSchema = z.object({
  competitorId: z.string(),
  competitorName: z.string(),
  price: z.number().positive(),
  distance: z.number().positive().optional(),
  lastUpdated: z.date(),
});

export const CompetitionContextSchema = z.object({
  avgPrice: z.number().positive(),
  lowestPrice: z.number().positive(),
  highestPrice: z.number().positive(),
  competitorCount: z.number().int().nonnegative(),
  prices: z.array(CompetitionPriceSchema),
  marketPosition: z.enum(['premium', 'mid_market', 'economy']),
});

export const AudienceContextSchema = z.object({
  userId: z.string().optional(),
  segment: AudienceSegmentSchema,
  ltv: z.number().nonnegative(),
  churnRisk: z.number().min(0).max(1),
  engagementScore: z.number().min(0).max(100),
  orderCount: z.number().int().nonnegative(),
  daysSinceLastOrder: z.number().int().nonnegative(),
  preferredTimeSlot: z.string().optional(),
  preferredDays: z.array(z.number()).optional(),
  walletBalance: z.number().nonnegative().optional(),
  loyaltyPoints: z.number().nonnegative().optional(),
});

export const LocationContextSchema = z.object({
  city: z.string().min(1),
  tier: CityTierSchema,
  area: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  nearbyEvents: z.number().int().nonnegative(),
  weather: WeatherConditionSchema,
  footfallIndex: z.number().min(0).max(100),
  trafficIndex: z.number().min(0).max(100).optional(),
  isCommercialArea: z.boolean(),
  isResidentialArea: z.boolean(),
});

export const PricingConstraintsSchema = z.object({
  minMargin: z.number().min(0).max(1),
  maxDiscount: z.number().min(0).max(1),
  maxSurge: z.number().min(1),
  strategy: PricingStrategySchema,
  allowNegativePricing: z.boolean(),
  roundToNearest: z.number().positive().optional(),
});

// ================== UNIFIED PRICING CONTEXT ==================

export const PricingContextSchema = z.object({
  entity: EntityInfoSchema,
  time: TimeContextSchema,
  demand: DemandContextSchema,
  inventory: InventoryContextSchema,
  competition: CompetitionContextSchema,
  audience: AudienceContextSchema.optional(),
  location: LocationContextSchema,
  constraints: PricingConstraintsSchema,
});

// ================== PRICING DECISION ==================

export const PriceFactorSchema = z.object({
  name: z.string(),
  category: z.enum(['time', 'demand', 'inventory', 'competition', 'audience', 'location', 'weather', 'events']),
  value: z.number(),
  contribution: z.number(),
  weight: z.number().min(0).max(1),
  reason: z.string(),
  details: z.record(z.unknown()).optional(),
});

export const AlternativePriceSchema = z.object({
  label: z.string(),
  price: z.number().positive(),
  adjustment: z.number(),
  offer: z.string().optional(),
  validUntil: z.date().optional(),
  conditions: z.array(z.string()).optional(),
});

export const PricingDecisionSchema = z.object({
  entityId: z.string(),
  finalPrice: z.number(),
  originalPrice: z.number(),
  adjustment: z.number(),
  adjustmentType: PriceAdjustmentTypeSchema,
  confidence: z.number().min(0).max(1),
  source: z.enum(['rules', 'ml', 'hybrid']),
  factors: z.array(PriceFactorSchema),
  validUntil: z.date(),
  calculatedAt: z.date(),
  calculationTimeMs: z.number(),
  alternativePrices: z.array(AlternativePriceSchema).optional(),
  warnings: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ================== BATCH PRICING ==================

export const BatchPricingItemSchema = z.object({
  entityId: z.string().min(1),
  entityType: z.enum(['product', 'service', 'ad_inventory', 'room', 'appointment']),
  basePrice: z.number().positive(),
  cost: z.number().min(0),
  category: z.string().min(1),
  vertical: VerticalSchema,
});

export const BatchPricingRequestSchema = z.object({
  items: z.array(BatchPricingItemSchema).min(1).max(100),
  context: PricingContextSchema.omit({ entity: true }),
  options: z.object({
    includeAlternatives: z.boolean().optional(),
    maxItems: z.number().int().positive().optional(),
  }).optional(),
});

export const BatchPricingResponseSchema = z.object({
  results: z.array(PricingDecisionSchema),
  summary: z.object({
    totalItems: z.number(),
    successful: z.number(),
    failed: z.number(),
    averageAdjustment: z.number(),
    totalSavings: z.number(),
    totalSurge: z.number(),
  }),
  calculatedAt: z.date(),
});

// ================== OFFER OPTIMIZATION ==================

export const OfferConstraintRuleSchema = z.object({
  type: z.enum(['new_users_only', 'first_order_only', 'min_order_value', 'max_uses', 'valid_hours']),
  value: z.union([z.number(), z.string(), z.boolean()]),
});

export const OfferSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: OfferTypeSchema,
  value: z.number(),
  isPercentage: z.boolean(),
  conditions: z.array(OfferConstraintRuleSchema),
  minOrderValue: z.number().positive().optional(),
  maxDiscountAmount: z.number().positive().optional(),
  maxUses: z.number().int().positive().optional(),
  currentUses: z.number().int().nonnegative().optional(),
  validFrom: z.date(),
  validUntil: z.date(),
  isActive: z.boolean(),
  priority: z.number().int(),
  vertical: z.array(VerticalSchema).optional(),
  categories: z.array(z.string()).optional(),
});

export const OfferOptimizationRequestSchema = z.object({
  merchantId: z.string().min(1),
  entityId: z.string().min(1),
  basePrice: z.number().positive(),
  currentOffer: OfferSchema.optional(),
  audience: AudienceContextSchema.optional(),
  context: PricingContextSchema,
  optimizationGoal: z.enum(['revenue', 'conversion', 'retention', 'acquisition']),
});

export const OfferOptimizationResponseSchema = z.object({
  recommendedOffer: OfferSchema.nullable(),
  alternatives: z.array(z.object({
    offer: OfferSchema,
    expectedRevenue: z.number(),
    conversionLift: z.number(),
    marginImpact: z.number(),
  })),
  noOfferRecommendation: z.object({
    shouldOffer: z.boolean(),
    reason: z.string(),
    expectedRevenue: z.number(),
  }),
  confidence: z.number().min(0).max(1),
});

// ================== CASHBACK OPTIMIZATION ==================

export const CashbackSegmentConfigSchema = z.object({
  segment: AudienceSegmentSchema,
  baseRate: z.number().min(0).max(1),
  minRate: z.number().min(0).max(1),
  maxRate: z.number().min(0).max(1),
  conditions: z.object({
    minOrderValue: z.number().positive().optional(),
    maxCashbackAmount: z.number().positive().optional(),
    newUserOnly: z.boolean().optional(),
  }).optional(),
});

export const CashbackOptimizationRequestSchema = z.object({
  merchantId: z.string().min(1),
  userId: z.string().min(1),
  orderValue: z.number().positive(),
  category: z.string().min(1),
  vertical: VerticalSchema,
  context: PricingContextSchema,
});

export const CashbackOptimizationResponseSchema = z.object({
  recommendedCashback: z.number(),
  rate: z.number(),
  segment: AudienceSegmentSchema,
  reason: z.string(),
  alternatives: z.array(z.object({
    rate: z.number(),
    cashback: z.number(),
    reason: z.string(),
    impact: z.enum(['positive', 'negative', 'neutral']),
  })),
  totalCashbackExpense: z.number(),
  expectedLTV: z.number(),
  roi: z.number(),
});

// ================== DEMAND FORECAST ==================

export const HourlyForecastSchema = z.object({
  hour: z.number().int().min(0).max(23),
  predictedDemand: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  isPeakHour: z.boolean(),
  recommendedPricing: z.enum(['discount', 'normal', 'surge']),
});

export const DailyForecastSchema = z.object({
  date: z.date(),
  dayOfWeek: z.number().int().min(0).max(6),
  totalDemand: z.number().min(0).max(100),
  peakHour: z.number().int().min(0).max(23),
  peakDemand: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  hourlyBreakdown: z.array(HourlyForecastSchema),
  events: z.array(z.object({
    name: z.string(),
    expectedImpact: z.number(),
  })),
});

export const DemandForecastRequestSchema = z.object({
  merchantId: z.string().min(1),
  vertical: VerticalSchema,
  category: z.string().min(1),
  location: LocationContextSchema,
  horizon: z.enum(['day', 'week', 'month']),
  startDate: z.date().optional(),
});

export const DemandForecastResponseSchema = z.object({
  merchantId: z.string(),
  forecasts: z.array(DailyForecastSchema),
  summary: z.object({
    avgDailyDemand: z.number(),
    peakDay: z.date(),
    lowestDay: z.date(),
    totalPredictedOrders: z.number(),
    confidence: z.number(),
  }),
  factors: z.array(z.object({
    name: z.string(),
    impact: z.number(),
    description: z.string(),
  })),
});

// ================== MERCHANT ADVISOR ==================

export const DiagnosisFactorSchema = z.object({
  factor: z.string(),
  impact: z.number(),
  description: z.string(),
  evidence: z.array(z.string()),
  trend: TrendDirectionSchema,
});

export const RecommendationSchema = z.object({
  action: z.string(),
  expectedImpact: z.number(),
  confidence: z.number().min(0).max(1),
  priority: z.enum(['quick_win', 'medium', 'strategic']),
  implementationEffort: z.enum(['low', 'medium', 'high']),
  estimatedCost: z.number().optional(),
});

export const MerchantDiagnosisRequestSchema = z.object({
  merchantId: z.string().min(1),
  period: z.enum(['day', 'week', 'month', 'quarter']),
  compareTo: z.enum(['previous_period', 'last_year', 'benchmark']).optional(),
});

export const MerchantDiagnosisResponseSchema = z.object({
  merchantId: z.string(),
  period: z.string(),
  summary: z.object({
    revenueChange: z.number(),
    orderChange: z.number(),
    avgOrderValueChange: z.number(),
    customerChange: z.number(),
    diagnosis: z.string(),
  }),
  factors: z.array(DiagnosisFactorSchema),
  recommendations: z.array(RecommendationSchema),
  quickWins: z.array(z.string()),
  warnings: z.array(z.string()),
  comparedTo: z.object({
    period: z.string(),
    revenueChange: z.number(),
    orderChange: z.number(),
  }).optional(),
});

// ================== CROSS-MERCHANT INSIGHTS ==================

export const CategoryTrendSchema = z.object({
  category: z.string(),
  vertical: VerticalSchema,
  demandChange: z.number(),
  avgPriceChange: z.number(),
  orderVolumeChange: z.number(),
  topPerformers: z.array(z.object({
    merchantId: z.string(),
    merchantName: z.string(),
    revenueUplift: z.number(),
  })),
  emergingPlayers: z.array(z.object({
    merchantId: z.string(),
    merchantName: z.string(),
    growthRate: z.number(),
  })),
  recommendations: z.array(z.string()),
});

export const UpcomingDemandEventSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['festival', 'sports', 'concert', 'holiday', 'weather', 'cultural']),
  date: z.date(),
  expectedFootfall: z.number(),
  affectedCategories: z.array(z.string()),
  affectedVerticals: z.array(VerticalSchema),
  recommendedActions: z.array(z.string()),
  daysUntil: z.number(),
});

export const CompetitiveLandscapeSchema = z.object({
  category: z.string(),
  merchantId: z.string(),
  marketAvgPrice: z.number(),
  yourPrice: z.number(),
  pricePosition: z.enum(['below', 'at', 'above']),
  priceDifference: z.number(),
  opportunityScore: z.number().min(0).max(100),
  recommendations: z.array(z.string()),
});

export const CrossMerchantInsightsRequestSchema = z.object({
  merchantId: z.string().optional(),
  vertical: VerticalSchema.optional(),
  category: z.string().optional(),
  location: LocationContextSchema.optional(),
  period: z.enum(['week', 'month', 'quarter']),
});

export const CrossMerchantInsightsResponseSchema = z.object({
  categoryTrends: z.array(CategoryTrendSchema),
  upcomingEvents: z.array(UpcomingDemandEventSchema),
  competitiveLandscape: z.array(CompetitiveLandscapeSchema).optional(),
  generatedAt: z.date(),
});

// ================== API RESPONSE ==================

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.unknown().optional(),
    }).optional(),
    metadata: z.object({
      timestamp: z.date(),
      requestId: z.string(),
      calculationTimeMs: z.number().optional(),
    }).optional(),
  });

// ================== VERTICAL CONFIGS ==================

export const VerticalConfigSchema = z.object({
  vertical: VerticalSchema,
  displayName: z.string(),
  surge: z.object({
    maxCap: z.number().min(1),
    triggers: z.array(z.string()),
    floors: z.record(z.string(), z.number()),
  }),
  cashback: z.array(CashbackSegmentConfigSchema),
  inventoryFactors: z.object({
    enabled: z.boolean(),
    lowStockThreshold: z.number(),
    overstockThreshold: z.number(),
    expiryThresholds: z.array(z.number()),
  }),
  timeMultipliers: z.object({
    dayOfWeek: z.record(z.string(), z.number()),
    hourOfDay: z.record(z.string(), z.number()),
    weekend: z.number(),
    holiday: z.number(),
  }),
});

export const MerchantConfigSchema = z.object({
  merchantId: z.string(),
  vertical: VerticalSchema,
  pricingTier: PricingTierSchema,
  enabled: z.boolean(),
  customConfig: VerticalConfigSchema.partial().optional(),
  overrides: z.object({
    maxSurge: z.number().min(1).optional(),
    maxDiscount: z.number().min(0).max(1).optional(),
    minMargin: z.number().min(0).max(1).optional(),
    strategy: PricingStrategySchema.optional(),
  }),
});

// ================== TYPE EXPORTS ==================

export type Vertical = z.infer<typeof VerticalSchema>;
export type PriceAdjustmentType = z.infer<typeof PriceAdjustmentTypeSchema>;
export type AudienceSegment = z.infer<typeof AudienceSegmentSchema>;
export type Season = z.infer<typeof SeasonSchema>;
export type WeatherCondition = z.infer<typeof WeatherConditionSchema>;
export type PricingStrategy = z.infer<typeof PricingStrategySchema>;
export type InventoryVelocity = z.infer<typeof InventoryVelocitySchema>;
export type TrendDirection = z.infer<typeof TrendDirectionSchema>;
export type CityTier = z.infer<typeof CityTierSchema>;
export type PricingTier = z.infer<typeof PricingTierSchema>;
export type OfferType = z.infer<typeof OfferTypeSchema>;

export type EntityInfo = z.infer<typeof EntityInfoSchema>;
export type TimeContext = z.infer<typeof TimeContextSchema>;
export type DemandContext = z.infer<typeof DemandContextSchema>;
export type InventoryContext = z.infer<typeof InventoryContextSchema>;
export type CompetitionContext = z.infer<typeof CompetitionContextSchema>;
export type AudienceContext = z.infer<typeof AudienceContextSchema>;
export type LocationContext = z.infer<typeof LocationContextSchema>;
export type PricingConstraints = z.infer<typeof PricingConstraintsSchema>;

export type PricingContextInput = z.infer<typeof PricingContextSchema>;
export type PriceFactor = z.infer<typeof PriceFactorSchema>;
export type AlternativePrice = z.infer<typeof AlternativePriceSchema>;
export type PricingDecision = z.infer<typeof PricingDecisionSchema>;

export type BatchPricingItem = z.infer<typeof BatchPricingItemSchema>;
export type BatchPricingRequest = z.infer<typeof BatchPricingRequestSchema>;
export type BatchPricingResponse = z.infer<typeof BatchPricingResponseSchema>;

export type Offer = z.infer<typeof OfferSchema>;
export type OfferOptimizationRequest = z.infer<typeof OfferOptimizationRequestSchema>;
export type OfferOptimizationResponse = z.infer<typeof OfferOptimizationResponseSchema>;

export type CashbackSegmentConfig = z.infer<typeof CashbackSegmentConfigSchema>;
export type CashbackOptimizationRequest = z.infer<typeof CashbackOptimizationRequestSchema>;
export type CashbackOptimizationResponse = z.infer<typeof CashbackOptimizationResponseSchema>;

export type HourlyForecast = z.infer<typeof HourlyForecastSchema>;
export type DailyForecast = z.infer<typeof DailyForecastSchema>;
export type DemandForecastRequest = z.infer<typeof DemandForecastRequestSchema>;
export type DemandForecastResponse = z.infer<typeof DemandForecastResponseSchema>;

export type DiagnosisFactor = z.infer<typeof DiagnosisFactorSchema>;
export type Recommendation = z.infer<typeof RecommendationSchema>;
export type MerchantDiagnosisRequest = z.infer<typeof MerchantDiagnosisRequestSchema>;
export type MerchantDiagnosisResponse = z.infer<typeof MerchantDiagnosisResponseSchema>;

export type CategoryTrend = z.infer<typeof CategoryTrendSchema>;
export type UpcomingDemandEvent = z.infer<typeof UpcomingDemandEventSchema>;
export type CompetitiveLandscape = z.infer<typeof CompetitiveLandscapeSchema>;
export type CrossMerchantInsightsRequest = z.infer<typeof CrossMerchantInsightsRequestSchema>;
export type CrossMerchantInsightsResponse = z.infer<typeof CrossMerchantInsightsResponseSchema>;

export type VerticalConfig = z.infer<typeof VerticalConfigSchema>;
export type MerchantConfig = z.infer<typeof MerchantConfigSchema>;
