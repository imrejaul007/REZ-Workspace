// Inventory Types
export interface InventorySlot {
  id: string;
  type: 'banner' | 'video' | 'native' | 'interstitial';
  format: 'display' | 'video' | 'audio';
  size: { width: number; height: number };
  context: string;
  placement?: string;
  floorPrice?: number;
  minBid?: number;
}

export interface UserContext {
  segments: string[];
  intentScore: number;
  userId?: string;
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  location?: string;
  timeOfDay?: number;
  dayOfWeek?: number;
}

// Ad Types
export interface AdCreative {
  id: string;
  advertiserId: string;
  advertiserName: string;
  campaignId: string;
  type: 'image' | 'video' | 'text' | 'html';
  format: string;
  bid: number;
  ctr: number;
  conversionRate: number;
  cpa: number;
  frequency: number;
  lastSeen?: Date;
  qualityScore?: number;
  category?: string[];
}

export interface EligibleAd {
  ad: AdCreative;
  eligibility: {
    matched: boolean;
    reason?: string;
  };
}

// Yield Decision Types
export interface YieldDecisionRequest {
  inventorySlot: InventorySlot;
  userContext: UserContext;
  eligibleAds: EligibleAd[];
  optimizationGoal?: 'revenue' | 'conversions' | 'ltv';
  constraints?: YieldConstraints;
}

export interface YieldConstraints {
  minCTR?: number;
  maxFrequency?: number;
  maxAdsPerUser?: number;
  brandSafetyThreshold?: number;
  pacingLimits?: {
    advertiserId: string;
    maxSpendPerHour: number;
    dailyBudget: number;
  }[];
}

export interface YieldDecision {
  selectedAd: AdCreative | null;
  bid: number;
  floorPrice: number;
  expectedRevenue: number;
  expectedCTR: number;
  expectedCVR: number;
  confidence: number;
  decisionReason: string;
  alternativeAds?: {
    ad: AdCreative;
    expectedRevenue: number;
    probability: number;
  }[];
  metadata: {
    timestamp: Date;
    decisionId: string;
    processingTimeMs: number;
    optimizationGoal: string;
  };
}

// Floor Price Types
export interface FloorPriceRequest {
  inventoryId: string;
  context?: Partial<UserContext>;
  eligibleBidderCount?: number;
}

export interface FloorPriceResponse {
  inventoryId: string;
  floorPrice: number;
  dynamicFloor: boolean;
  factors: {
    name: string;
    impact: number;
    weight: number;
  }[];
  recommendations: {
    action: string;
    expectedLift: number;
  }[];
}

// Bid Landscape Types
export interface BidLandscapeRequest {
  inventoryType?: string;
  context?: string;
  timeRange?: '1h' | '24h' | '7d' | '30d';
}

export interface BidDistribution {
  bid: number;
  count: number;
  percentage: number;
  cumulativePercentage: number;
}

export interface BidLandscapeResponse {
  timeRange: string;
  inventoryType: string;
  context: string;
  distribution: BidDistribution[];
  statistics: {
    min: number;
    max: number;
    median: number;
    mean: number;
    p25: number;
    p75: number;
    p90: number;
    p95: number;
  };
  trends: {
    direction: 'up' | 'down' | 'stable';
    changePercent: number;
    velocity: number;
  };
  insights: string[];
}

// Revenue Attribution Types
export interface RevenueAttributionRequest {
  startDate: Date;
  endDate: Date;
  granularity?: 'hour' | 'day' | 'week' | 'month';
  groupBy?: 'ad' | 'advertiser' | 'placement' | 'format' | 'segment';
  filters?: {
    advertiserId?: string;
    placementId?: string;
    format?: string;
  };
}

export interface RevenueAttribution {
  dimension: string;
  impressions: number;
  revenue: number;
  rpm: number;
  ctr: number;
  conversions: number;
  conversionRate: number;
  ltv: number;
  attributes: {
    impressions: number;
    revenue: number;
    percentage: number;
  };
}

export interface RevenueAttributionResponse {
  request: RevenueAttributionRequest;
  summary: {
    totalImpressions: number;
    totalRevenue: number;
    averageRPM: number;
    totalConversions: number;
    averageCVR: number;
  };
  attribution: RevenueAttribution[];
  topPerformers: {
    dimension: string;
    value: number;
    metric: string;
  }[];
  insights: string[];
}

// Predictive Yield Types
export interface YieldPredictionRequest {
  horizon: '1h' | '6h' | '24h' | '7d';
  inventoryType?: string;
  context?: string;
}

export interface YieldPrediction {
  horizon: string;
  predictedYield: number;
  confidence: number;
  factors: {
    name: string;
    contribution: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }[];
  recommendations: {
    action: string;
    expectedImpact: number;
    priority: 'high' | 'medium' | 'low';
  }[];
  riskFactors: {
    factor: string;
    probability: number;
    impact: 'high' | 'medium' | 'low';
  }[];
}

// A/B Testing Types
export interface YieldStrategy {
  id: string;
  name: string;
  type: 'floor_price' | 'bid_allocation' | 'audience_targeting' | 'format_optimization';
  config: Record<string, unknown>;
  weights: {
    revenue: number;
    conversions: number;
    ltv: number;
    ctr: number;
    brandSafety: number;
  };
  status: 'active' | 'paused' | 'archived';
}

export interface ABTestRequest {
  name: string;
  description: string;
  strategies: string[];
  trafficAllocation: number[];
  duration: number;
  successMetrics: string[];
}

export interface ABTestResult {
  testId: string;
  name: string;
  status: 'running' | 'completed' | 'paused';
  startDate: Date;
  endDate?: Date;
  strategies: {
    strategyId: string;
    impressions: number;
    revenue: number;
    rpm: number;
    ctr: number;
    conversions: number;
    cvr: number;
    confidence: number;
    winner: boolean;
  }[];
  recommendations: string[];
  statisticalSignificance: number;
}

// Analytics Types
export interface YieldMetrics {
  totalImpressions: number;
  totalRevenue: number;
  averageRPM: number;
  fillRate: number;
  averageBid: number;
  averageCTR: number;
  averageCVR: number;
  revenuePerUser: number;
}

export interface TimeSeriesMetrics {
  timestamp: Date;
  impressions: number;
  revenue: number;
  rpm: number;
  ctr: number;
  bidFloor: number;
  avgBid: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: Date;
    requestId: string;
    processingTimeMs: number;
  };
}

// Health Check Types
export interface HealthStatus {
  status: 'ok' | 'degraded' | 'unhealthy';
  service: string;
  version: string;
  timestamp: Date;
  uptime: number;
  dependencies: {
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    latencyMs?: number;
    error?: string;
  }[];
  metrics?: {
    requestsPerMinute: number;
    errorRate: number;
    averageResponseTime: number;
  };
}