// Merchant Intelligence OS - Type Definitions

export interface Merchant {
  _id: string;
  merchantId: string;
  name: string;
  category: string;
  subcategory?: string;
  location: {
    city: string;
    state: string;
    pincode: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
}

export interface RevenueAnalysis {
  merchantId: string;
  period: {
    start: string;
    end: string;
  };
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueGrowth: number;
  ordersGrowth: number;
  trend: 'up' | 'down' | 'stable';
  benchmarkComparison: {
    industryAverage: number;
    merchantValue: number;
    percentile: number;
  };
  dailyRevenue: RevenueData[];
  weeklyRevenue: RevenueData[];
  monthlyRevenue: RevenueData[];
}

export interface MarginAnalysis {
  merchantId: string;
  period: {
    start: string;
    end: string;
  };
  grossMargin: number;
  netMargin: number;
  marginTrend: 'improving' | 'declining' | 'stable';
  costBreakdown: {
    cogs: number;
    marketing: number;
    operations: number;
    other: number;
  };
  marginOpportunities: {
    category: string;
    potentialSavings: number;
    action: string;
  }[];
}

export interface ProductPerformance {
  productId: string;
  name: string;
  sku: string;
  category: string;
  revenue: number;
  unitsSold: number;
  margin: number;
  returnRate: number;
  trend: 'rising' | 'falling' | 'stable';
  rank: number;
  performance: 'top' | 'mid' | 'low';
}

export interface ProductAnalysis {
  merchantId: string;
  period: {
    start: string;
    end: string;
  };
  totalProducts: number;
  topProducts: ProductPerformance[];
  underperformers: ProductPerformance[];
  categoryBreakdown: {
    category: string;
    revenue: number;
    percentage: number;
  }[];
  recommendations: string[];
}

export interface CustomerSegment {
  segmentId: string;
  name: string;
  count: number;
  averageOrderValue: number;
  purchaseFrequency: number;
  churnRisk: 'high' | 'medium' | 'low';
  lifetimeValue: number;
}

export interface CustomerCohortAnalysis {
  merchantId: string;
  period: {
    start: string;
    end: string;
  };
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  retentionRate: number;
  segments: CustomerSegment[];
  rfmAnalysis: {
    recency: { low: number; medium: number; high: number };
    frequency: { low: number; medium: number; high: number };
    monetary: { low: number; medium: number; high: number };
  };
  cohortRetention: {
    cohort: string;
    weeks: number[];
    retentionRates: number[];
  }[];
}

export interface CompetitorData {
  competitorId: string;
  name: string;
  location: string;
  pricePosition: 'premium' | 'mid' | 'budget';
  estimatedRevenue: number;
  rating: number;
  reviewCount: number;
  strengths: string[];
  weaknesses: string[];
  lastUpdated: Date;
}

export interface CompetitorAnalysis {
  merchantId: string;
  merchant: {
    name: string;
    rating: number;
    estimatedRevenue: number;
  };
  competitors: CompetitorData[];
  positioning: {
    relativeToMarket: 'leader' | 'challenger' | 'follower' | 'niche';
    pricePosition: 'premium' | 'mid' | 'budget';
    strengths: string[];
    weaknesses: string[];
  };
  marketShare: {
    merchantShare: number;
    competitorsShare: { name: string; share: number }[];
  };
  opportunities: {
    gap: string;
    potential: string;
    action: string;
  }[];
}

export interface DemandForecast {
  productId: string;
  productName: string;
  currentDemand: number;
  predictedDemand: {
    week1: number;
    week2: number;
    week3: number;
    week4: number;
  };
  confidence: number;
  factors: {
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
  }[];
  seasonality: {
    pattern: 'increasing' | 'decreasing' | 'stable' | 'seasonal';
    peakMonths: string[];
    lowMonths: string[];
  };
}

export interface DemandAnalysis {
  merchantId: string;
  period: {
    start: string;
    end: string;
  };
  overallTrend: 'growing' | 'declining' | 'stable';
  growthRate: number;
  forecasts: DemandForecast[];
  recommendations: {
    productId: string;
    action: string;
    urgency: 'high' | 'medium' | 'low';
    reason: string;
  }[];
}

export interface Recommendation {
  id: string;
  category: 'revenue' | 'marketing' | 'inventory' | 'pricing' | 'customer';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  expectedImpact: {
    metric: string;
    value: number;
    unit: string;
  };
  effort: 'low' | 'medium' | 'high';
  timeframe: string;
  enabled: boolean;
}

export interface RecommendationsResponse {
  merchantId: string;
  generatedAt: string;
  priorityScore: number;
  recommendations: Recommendation[];
  summary: {
    immediate: string[];
    thisWeek: string[];
    thisMonth: string[];
  };
}

export interface MerchantInsights {
  merchantId: string;
  generatedAt: string;
  summary: {
    healthScore: number;
    trend: 'improving' | 'stable' | 'declining';
    keyMetrics: {
      revenue: number;
      orders: number;
      customers: number;
      avgOrderValue: number;
    };
  };
  revenue: RevenueAnalysis;
  margin: MarginAnalysis;
  products: ProductAnalysis;
  customers: CustomerCohortAnalysis;
  competitors: CompetitorAnalysis;
  demand: DemandAnalysis;
  recommendations: RecommendationsResponse;
}

// API Request/Response Types
export interface GetMerchantInsightsParams {
  merchantId: string;
  period?: 'week' | 'month' | 'quarter' | 'year';
}

export interface GetRevenueParams {
  merchantId: string;
  startDate?: string;
  endDate?: string;
  granularity?: 'daily' | 'weekly' | 'monthly';
}

export interface GetProductsParams {
  merchantId: string;
  sortBy?: 'revenue' | 'units' | 'margin' | 'growth';
  limit?: number;
}

export interface GetRecommendationsParams {
  merchantId: string;
  category?: 'all' | 'revenue' | 'marketing' | 'inventory' | 'pricing' | 'customer';
  priority?: 'all' | 'critical' | 'high' | 'medium' | 'low';
}

export interface GetCompetitorsParams {
  merchantId: string;
  radius?: number;
  limit?: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    timestamp: string;
    duration: number;
  };
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  timestamp: string;
  version: string;
  uptime: number;
  checks?: {
    database: 'ok' | 'error';
    externalServices: 'ok' | 'error';
  };
}

// Configuration Types
export interface ServiceConfig {
  port: number;
  nodeEnv: string;
  mongodb: {
    uri: string;
    options: {
      maxPoolSize: number;
      serverSelectionTimeoutMS: number;
      socketTimeoutMS: number;
    };
  };
  services: {
    hojaiApi: string;
    rabtulWallet: string;
    rezMerchant: string;
  };
  logging: {
    level: string;
    format: string;
  };
  metrics: {
    enabled: boolean;
    path: string;
  };
}

// Metric Types
export interface InsightMetrics {
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
  cacheHitRate: number;
}