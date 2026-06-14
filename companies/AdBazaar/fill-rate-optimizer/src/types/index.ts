// Fill Rate Types

export interface FillRateRecord {
  date: Date;
  inventoryId: string;
  inventoryName?: string;
  impressions: number;
  filled: number;
  rate: number;
  requestId?: string;
}

export interface FillRateQuery {
  startDate?: Date;
  endDate?: Date;
  inventoryId?: string;
  granularity?: 'hour' | 'day' | 'week' | 'month';
  limit?: number;
}

export interface FillRateSummary {
  current: {
    rate: number;
    impressions: number;
    filled: number;
    timestamp: Date;
  };
  previous: {
    rate: number;
    impressions: number;
    filled: number;
    timestamp: Date;
  };
  change: {
    rate: number;
    impressions: number;
    filled: number;
  };
}

export interface FillAnalysis {
  inventoryId: string;
  inventoryName?: string;
  factors: {
    name: string;
    impact: number;
    description: string;
 }[];
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    action: string;
    expectedImpact: number;
    implementation: string;
  }[];
  analyzedAt: Date;
}

export interface FillAlert {
  id: string;
  inventoryId?: string;
  threshold: number;
  condition: 'above' | 'below' | 'equals';
  notification: {
    email?: string;
    webhook?: string;
    slack?: string;
  };
  status: 'active' | 'paused' | 'triggered';
  triggeredAt?: Date;
  createdAt: Date;
}

export interface FillForecast {
  date: Date;
  predicted: number;
  confidence: number;
  factors: {
    name: string;
    weight: number;
 }[];
  model: string;
}

export interface OptimizationRequest {
  inventoryId?: string;
  targetRate?: number;
  strategy?: 'aggressive' | 'moderate' | 'conservative';
  timeWindow?: '1h' | '6h' | '24h' | '7d';
}

export interface OptimizationResult {
  inventoryId?: string;
  currentRate: number;
  targetRate: number;
  actions: {
    type: string;
    description: string;
    priority: number;
    estimatedImpact: number;
  }[];
  expectedOutcome: {
    rate: number;
    impressions: number;
    revenue: number;
  };
  timestamp: Date;
}

export interface InventoryFillRate {
  inventoryId: string;
  inventoryName: string;
  fillRate: number;
  impressions: number;
  filled: number;
  unfilled: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface DemandSourceFillRate {
  source: string;
  fillRate: number;
  impressions: number;
  filled: number;
  revenue: number;
  percentage: number;
}

export interface FillRateRecommendation {
  id: string;
  type: 'inventory' | 'demand' | 'pricing' | 'technical';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: number;
  effort: 'low' | 'medium' | 'high';
  timeframe: string;
  actionItems: string[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
  requestId?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: Date;
}
