/**
 * REZ Revenue AI - Unified Types
 * Core type definitions for dynamic pricing and revenue intelligence
 */

// ================== ENUMS ==================

export type Vertical =
  | 'restaurant'
  | 'hotel'
  | 'clinic'
  | 'salon'
  | 'gym'
  | 'events'
  | 'retail'
  | 'home_services'
  | 'corp_perks';

export type PriceAdjustmentType =
  | 'surge'
  | 'discount'
  | 'loyalty'
  | 'bundle'
  | 'time_based'
  | 'inventory_based';

export type AudienceSegment = 'new' | 'regular' | 'vip' | 'at_risk' | 'dormant';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export type WeatherCondition = 'clear' | 'rainy' | 'stormy' | 'hot' | 'cold' | 'cloudy';

export type PricingStrategy = 'aggressive' | 'balanced' | 'conservative';

export type InventoryVelocity = 'fast' | 'normal' | 'slow';

export type TrendDirection = 'increasing' | 'stable' | 'decreasing';

export type CityTier = 1 | 2 | 3;

export type PricingTier = 'smb' | 'growth' | 'enterprise';

export type SurgeTrigger =
  | 'demand'
  | 'time'
  | 'weather'
  | 'events'
  | 'competition'
  | 'inventory'
  | 'seasonality';

export type OfferType =
  | 'percentage_discount'
  | 'fixed_discount'
  | 'buy_x_get_y'
  | 'cashback'
  | 'bundle'
  | 'free_item'
  | 'upgrade';

export type OfferConstraint = 'new_users_only' | 'first_order_only' | 'min_order_value' | 'max_uses' | 'valid_hours';

export type CalculationSource = 'rules' | 'ml' | 'hybrid';

// ================== CORE CONTEXT TYPES ==================

export interface EntityInfo {
  id: string;
  type: 'product' | 'service' | 'ad_inventory' | 'room' | 'appointment' | 'slot';
  category: string;
  subcategory?: string;
  vertical: Vertical;
  name: string;
  basePrice: number;
  cost: number;
  sku?: string;
}

export interface TimeContext {
  timestamp: Date;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  hourOfDay: number;
  isPeakHour: boolean;
  isWeekend: boolean;
  season: Season;
  month: number;
  isHoliday: boolean;
  eventNearby: boolean;
  upcomingEvent?: {
    name: string;
    date: Date;
    expectedAttendees: number;
  };
}

export interface DemandContext {
  current: number;        // 0-100
  predicted: number;     // 0-100
  historical: number;     // 0-100
  realTime: number;       // 0-100
  trend: TrendDirection;
  confidence: number;     // 0-1
  comparisonToAverage: number; // percentage difference
}

export interface InventoryContext {
  level: number;
  max: number;
  percentage: number;     // 0-100
  daysUntilExpiry?: number;
  slotsRemaining?: number;
  totalSlots?: number;
  velocity: InventoryVelocity;
  reorderPoint?: number;
  isLowStock: boolean;
  isOverstock: boolean;
}

export interface CompetitionContext {
  avgPrice: number;
  lowestPrice: number;
  highestPrice: number;
  competitorCount: number;
  prices: {
    competitorId: string;
    competitorName: string;
    price: number;
    distance?: number; // km
    lastUpdated: Date;
  }[];
  marketPosition: 'premium' | 'mid_market' | 'economy';
}

export interface AudienceContext {
  userId?: string;
  segment: AudienceSegment;
  ltv: number;
  churnRisk: number;      // 0-1
  engagementScore: number; // 0-100
  orderCount: number;
  daysSinceLastOrder: number;
  preferredTimeSlot?: string;
  preferredDays?: number[];
  walletBalance?: number;
  loyaltyPoints?: number;
}

export interface LocationContext {
  city: string;
  tier: CityTier;
  area?: string;
  latitude?: number;
  longitude?: number;
  nearbyEvents: number;
  weather: WeatherCondition;
  footfallIndex: number;   // 0-100
  trafficIndex?: number;    // 0-100
  isCommercialArea: boolean;
  isResidentialArea: boolean;
}

export interface PricingConstraints {
  minMargin: number;       // percentage
  maxDiscount: number;    // percentage
  maxSurge: number;       // multiplier
  strategy: PricingStrategy;
  allowNegativePricing: boolean;
  roundToNearest?: number; // e.g., 1, 5, 10, 50, 100
}

// ================== UNIFIED PRICING CONTEXT ==================

export interface PricingContext {
  entity: EntityInfo;
  time: TimeContext;
  demand: DemandContext;
  inventory: InventoryContext;
  competition: CompetitionContext;
  audience?: AudienceContext;
  location: LocationContext;
  constraints: PricingConstraints;
}

// ================== PRICING DECISION TYPES ==================

export interface PriceFactor {
  name: string;
  category: 'time' | 'demand' | 'inventory' | 'competition' | 'audience' | 'location' | 'weather' | 'events';
  value: number;          // decimal value (e.g., 0.15 for 15%)
  contribution: number;   // percentage contribution to total adjustment
  weight: number;         // importance weight 0-1
  reason: string;
  details?: Record<string, unknown>;
}

export interface AlternativePrice {
  label: string;
  price: number;
  adjustment: number;     // percentage
  offer?: string;
  validUntil?: Date;
  conditions?: OfferConstraint[];
}

export interface PricingDecision {
  entityId: string;
  finalPrice: number;
  originalPrice: number;
  adjustment: number;           // net percentage adjustment
  adjustmentType: PriceAdjustmentType;
  confidence: number;           // 0-1
  source: CalculationSource;
  factors: PriceFactor[];
  validUntil: Date;
  calculatedAt: Date;
  calculationTimeMs: number;
  alternativePrices?: AlternativePrice[];
  warnings?: string[];
  metadata?: Record<string, unknown>;
}

export interface BatchPricingRequest {
  items: {
    entityId: string;
    entityType: 'product' | 'service' | 'ad_inventory' | 'room' | 'appointment';
    basePrice: number;
    cost: number;
    category: string;
    vertical: Vertical;
  }[];
  context: Omit<PricingContext, 'entity'>;
  options?: {
    includeAlternatives?: boolean;
    maxItems?: number;
  };
}

export interface BatchPricingResponse {
  results: PricingDecision[];
  summary: {
    totalItems: number;
    successful: number;
    failed: number;
    averageAdjustment: number;
    totalSavings: number;
    totalSurge: number;
  };
  calculatedAt: Date;
}

// ================== OFFER TYPES ==================

export interface OfferConstraintRule {
  type: OfferConstraint;
  value: number | string | boolean;
}

export interface Offer {
  id: string;
  name: string;
  description: string;
  type: OfferType;
  value: number;           // e.g., 20 for 20% or ₹200
  isPercentage: boolean;
  conditions: OfferConstraintRule[];
  minOrderValue?: number;
  maxDiscountAmount?: number;
  maxUses?: number;
  currentUses?: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  priority: number;        // higher = more important
  vertical?: Vertical[];
  categories?: string[];
}

export interface OfferOptimizationRequest {
  merchantId: string;
  entityId: string;
  basePrice: number;
  currentOffer?: Offer;
  audience?: AudienceContext;
  context: PricingContext;
  optimizationGoal: 'revenue' | 'conversion' | 'retention' | 'acquisition';
}

export interface OfferOptimizationResponse {
  recommendedOffer: Offer | null;
  alternatives: {
    offer: Offer;
    expectedRevenue: number;
    conversionLift: number;
    marginImpact: number;
  }[];
  noOfferRecommendation: {
    shouldOffer: boolean;
    reason: string;
    expectedRevenue: number;
  };
  confidence: number;
}

// ================== CASHBACK TYPES ==================

export interface CashbackSegmentConfig {
  segment: AudienceSegment;
  baseRate: number;
  minRate: number;
  maxRate: number;
  conditions?: {
    minOrderValue?: number;
    maxCashbackAmount?: number;
    newUserOnly?: boolean;
  };
}

export interface CashbackOptimizationRequest {
  merchantId: string;
  userId: string;
  orderValue: number;
  category: string;
  vertical: Vertical;
  context: PricingContext;
}

export interface CashbackOptimizationResponse {
  recommendedCashback: number;
  rate: number;           // percentage
  segment: AudienceSegment;
  reason: string;
  alternatives: {
    rate: number;
    cashback: number;
    reason: string;
    impact: 'positive' | 'negative' | 'neutral';
  }[];
  totalCashbackExpense: number;
  expectedLTV: number;
  roi: number;            // return on investment
}

// ================== DEMAND FORECAST TYPES ==================

export interface HourlyForecast {
  hour: number;
  predictedDemand: number;
  confidence: number;
  isPeakHour: boolean;
  recommendedPricing: 'discount' | 'normal' | 'surge';
}

export interface DailyForecast {
  date: Date;
  dayOfWeek: number;
  totalDemand: number;
  peakHour: number;
  peakDemand: number;
  confidence: number;
  hourlyBreakdown: HourlyForecast[];
  events: {
    name: string;
    expectedImpact: number;
  }[];
}

export interface DemandForecastRequest {
  merchantId: string;
  vertical: Vertical;
  category: string;
  location: LocationContext;
  horizon: 'day' | 'week' | 'month';
  startDate?: Date;
}

export interface DemandForecastResponse {
  merchantId: string;
  forecasts: DailyForecast[];
  summary: {
    avgDailyDemand: number;
    peakDay: Date;
    lowestDay: Date;
    totalPredictedOrders: number;
    confidence: number;
  };
  factors: {
    name: string;
    impact: number;
    description: string;
  }[];
}

// ================== MERCHANT ADVISOR TYPES ==================

export interface DiagnosisFactor {
  factor: string;
  impact: number;         // negative = bad, positive = good
  description: string;
  evidence: string[];
  trend: TrendDirection;
}

export interface Recommendation {
  action: string;
  expectedImpact: number;  // percentage
  confidence: number;
  priority: 'quick_win' | 'medium' | 'strategic';
  implementationEffort: 'low' | 'medium' | 'high';
  estimatedCost?: number;
}

export interface MerchantDiagnosisRequest {
  merchantId: string;
  period: 'day' | 'week' | 'month' | 'quarter';
  compareTo?: 'previous_period' | 'last_year' | 'benchmark';
}

export interface MerchantDiagnosisResponse {
  merchantId: string;
  period: string;
  summary: {
    revenueChange: number;
    orderChange: number;
    avgOrderValueChange: number;
    customerChange: number;
    diagnosis: string;
  };
  factors: DiagnosisFactor[];
  recommendations: Recommendation[];
  quickWins: string[];
  warnings: string[];
  comparedTo?: {
    period: string;
    revenueChange: number;
    orderChange: number;
  };
}

// ================== CROSS-MERCHANT INTELLIGENCE TYPES ==================

export interface CategoryTrend {
  category: string;
  vertical: Vertical;
  demandChange: number;       // percentage
  avgPriceChange: number;
  orderVolumeChange: number;
  topPerformers: {
    merchantId: string;
    merchantName: string;
    revenueUplift: number;
  }[];
  emergingPlayers: {
    merchantId: string;
    merchantName: string;
    growthRate: number;
  }[];
  recommendations: string[];
}

export interface UpcomingDemandEvent {
  id: string;
  name: string;
  type: 'festival' | 'sports' | 'concert' | 'holiday' | 'weather' | 'cultural';
  date: Date;
  expectedFootfall: number;
  affectedCategories: string[];
  affectedVerticals: Vertical[];
  recommendedActions: string[];
  daysUntil: number;
}

export interface CompetitiveLandscape {
  category: string;
  merchantId: string;
  marketAvgPrice: number;
  yourPrice: number;
  pricePosition: 'below' | 'at' | 'above';
  priceDifference: number;    // percentage
  opportunityScore: number;    // 0-100
  recommendations: string[];
}

export interface CrossMerchantInsightsRequest {
  merchantId?: string;
  vertical?: Vertical;
  category?: string;
  location?: LocationContext;
  period: 'week' | 'month' | 'quarter';
}

export interface CrossMerchantInsightsResponse {
  categoryTrends: CategoryTrend[];
  upcomingEvents: UpcomingDemandEvent[];
  competitiveLandscape?: CompetitiveLandscape[];
  generatedAt: Date;
}

// ================== ANALYTICS TYPES ==================

export interface PricingAnalytics {
  merchantId: string;
  period: {
    start: Date;
    end: Date;
  };
  pricing: {
    totalTransactions: number;
    avgOriginalPrice: number;
    avgFinalPrice: number;
    avgAdjustment: number;
    discountCount: number;
    surgeCount: number;
    totalDiscountAmount: number;
    totalSurgeAmount: number;
  };
  revenue: {
    totalRevenue: number;
    revenueFromSurge: number;
    revenueFromDiscounts: number;
    netRevenueChange: number;
  };
  conversion: {
    withDynamicPricing: number;
    withoutDynamicPricing: number;
    lift: number;
  };
  topFactors: {
    factor: string;
    frequency: number;
    avgContribution: number;
  }[];
}

// ================== CONFIG TYPES ==================

export interface VerticalConfig {
  vertical: Vertical;
  displayName: string;
  surge: {
    maxCap: number;
    triggers: SurgeTrigger[];
    floors: Record<string, number>; // e.g., "lunch": 0.9, "dinner": 1.3
  };
  cashback: CashbackSegmentConfig[];
  inventoryFactors: {
    enabled: boolean;
    lowStockThreshold: number;
    overstockThreshold: number;
    expiryThresholds: number[];
  };
  timeMultipliers: {
    dayOfWeek: Record<number, number>;
    hourOfDay: Record<number, number>;
    weekend: number;
    holiday: number;
  };
}

export interface MerchantConfig {
  merchantId: string;
  vertical: Vertical;
  pricingTier: PricingTier;
  enabled: boolean;
  customConfig?: Partial<VerticalConfig>;
  overrides: {
    maxSurge?: number;
    maxDiscount?: number;
    minMargin?: number;
    strategy?: PricingStrategy;
  };
}

// ================== API RESPONSE TYPES ==================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    timestamp: Date;
    requestId: string;
    calculationTimeMs?: number;
  };
}

// ================== ML FEATURES TYPES ==================

export interface RevenueAIFeatures {
  // Demand signals
  demand_level_1h: number;
  demand_level_24h: number;
  demand_trend: number;

  // Competitive signals
  price_competitiveness: number;
  market_position_index: number;

  // Revenue signals
  avg_order_value_trend: number;
  conversion_rate_trend: number;
  revenue_per_slot: number;

  // Inventory signals
  inventory_turnover_rate: number;
  days_of_inventory: number;
  stockout_probability: number;

  // Audience signals
  engagement_score: number;
  churn_risk: number;
  ltv_estimate: number;
}
