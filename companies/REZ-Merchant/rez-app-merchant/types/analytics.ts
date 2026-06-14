// Analytics date range types
export type DateRangePreset = '7d' | '14d' | '30d' | '90d' | '1y' | 'custom';

export interface DateRange {
  startDate: string; // ISO 8601 format (YYYY-MM-DD)
  endDate: string; // ISO 8601 format (YYYY-MM-DD)
}

// DateRangeFilter can be either:
// 1. A preset only: { preset: '30d' }
// 2. Custom dates: { startDate: '...', endDate: '...' }
// 3. Both: { preset: 'custom', startDate: '...', endDate: '...' }
export interface DateRangeFilter {
  startDate?: string; // ISO 8601 format (YYYY-MM-DD) - optional when using preset
  endDate?: string; // ISO 8601 format (YYYY-MM-DD) - optional when using preset
  preset?: DateRangePreset;
}

// Sales Forecast Types
export interface SalesForecast {
  period: string; // e.g., "2024-01-15"
  forecasted: number; // Forecasted sales amount
  confidence: number; // 0-100, confidence level
  actual?: number; // Actual sales if available
  variance?: number; // Difference between forecast and actual
  lower: number; // Lower bound of confidence interval
  upper: number; // Upper bound of confidence interval
  trend: 'up' | 'down' | 'stable';
}

export interface SalesForecastResponse {
  timeRange: DateRange;
  forecastDays: number; // 7, 30, 60, or 90
  method: 'arima' | 'exponential_smoothing' | 'linear_regression' | 'ml_ensemble';
  accuracy: number; // Historical accuracy percentage
  forecasts: SalesForecast[];
  summary: {
    averageForecast: number;
    totalForecast: number;
    trend: 'up' | 'down' | 'stable';
    growthRate: number;
  };
  metadata?: {
    seasonalityDetected: boolean;
    volatility: 'low' | 'medium' | 'high';
    dataPoints: number;
    isSampleData?: boolean; // Flag indicating demo data when no historical orders
  };
}

// Inventory/Stockout Prediction Types
export interface StockoutPrediction {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  dailyAvgUsage: number;
  daysUntilStockout: number | null; // null if won't stockout
  confidence: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  predictedStockoutDate?: string; // ISO 8601 format
  recommendedReorderQty: number;
  recommendedReorderDate: string;
  lead_time_days: number;
}

export interface InventoryStockoutResponse {
  timeRange: DateRange;
  totalProducts: number;
  productsAtRisk: number;
  highRisk: StockoutPrediction[];
  mediumRisk: StockoutPrediction[];
  safeStock: StockoutPrediction[];
  summary: {
    averageDaysToStockout: number;
    totalReorderValue: number;
    criticalItems: number;
  };
  recommendations: {
    urgentReorders: string[]; // Product IDs needing immediate reorder
    optimizeStockLevels: string[]; // Product IDs with sub-optimal levels
  };
}

// Customer Insights Types
export interface CustomerLifetimeValue {
  customerId: string;
  totalPurchases: number;
  totalSpent: number;
  averageOrderValue: number;
  estimatedLTV: number;
  purchaseFrequency: number; // orders per month
  lastPurchaseDate?: string;
  nextPredictedPurchase?: string;
  segment: 'high_value' | 'medium_value' | 'low_value' | 'churned';
}

export interface CustomerRetention {
  cohortDate: string;
  cohortSize: number;
  retention: Array<{
    day: number;
    percentage: number;
    count: number;
  }>;
  avgRetentionRate: number;
}

export interface ChurnPrediction {
  customerId: string;
  email: string;
  lastPurchaseDate: string;
  daysSinceLastPurchase: number;
  churnProbability: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[]; // Factors contributing to churn risk
  recommendedActions: string[]; // Suggested retention strategies
}

export interface CustomerInsights {
  timeRange: DateRange;
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  churnedCustomers: number;

  ltv: {
    averageLTV: number;
    highValueCount: number;
    highValueThreshold: number;
    ltv90Days: CustomerLifetimeValue[];
  };

  retention: {
    overallRetentionRate: number;
    cohorts: CustomerRetention[];
    repeatCustomerRate: number;
    repeatCustomerCount: number;
  };

  churn: {
    churnRate: number;
    churnedCount: number;
    atRiskCount: number;
    predictions: ChurnPrediction[];
  };

  segments: {
    highValue: number;
    mediumValue: number;
    lowValue: number;
    dormant: number;
    new: number;
    // Extended segment names used in some screens
    champion?: number;
    loyalist?: number;
    at_risk?: number;
    lost?: number;
  };

  summary: {
    averageCustomerAge: number; // days as customer
    avgOrdersPerCustomer: number;
    avgSpendPerCustomer: number;
    topSegment: string;
  };
}

// Seasonal Trend Analysis Types
export interface SeasonalTrend {
  season: string; // e.g., "Q1 2024", "Winter"
  year: number;
  dataPoints: Array<{
    period: string; // e.g., "2024-01-15"
    value: number;
    index: number; // Seasonality index (1.0 = average)
  }>;
  average: number;
  peak: number;
  trough: number;
  volatility: number; // Standard deviation
}

export interface TrendAnalysis {
  category?: string;
  trend: 'up' | 'down' | 'stable' | 'cyclic';
  strength: number; // 0-100, how strong the trend
  seasonality: number; // 0-100, seasonality strength
  cyclicity: number; // 0-100, cyclical pattern strength
  growthRate: number; // percentage per period
}

export interface SeasonalTrendResponse {
  timeRange: DateRange;
  dataType: 'sales' | 'orders' | 'customers' | 'products';
  granularity: 'daily' | 'weekly' | 'monthly';

  seasonalTrends: SeasonalTrend[];

  byCategory: Array<{
    category: string;
    trends: SeasonalTrend[];
    analysis: TrendAnalysis;
  }>;

  overallAnalysis: TrendAnalysis;

  peaks: Array<{
    period: string;
    value: number;
    dayOfWeek?: string;
    seasonalIndex: number;
  }>;

  troughs: Array<{
    period: string;
    value: number;
    dayOfWeek?: string;
    seasonalIndex: number;
  }>;

  predictions: {
    nextSeason: string;
    expectedTrend: 'up' | 'down' | 'stable';
    expectedValue: number;
    confidence: number;
  };
}

// Product Performance Analytics
export interface ProductPerformance {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  imageUrl?: string | null;

  sales: {
    quantity: number;
    revenue: number;
    trend: number; // percentage change
    avgUnitPrice: number;
  };

  inventory: {
    currentStock: number;
    isAvailable?: boolean;
    stockTurnovers: number; // times per period
    avgDaysToSell: number;
    outOfStockDays: number;
  };

  customer: {
    uniqueBuyers: number;
    repeatBuyerRate: number;
    avgRating: number;
    reviewCount: number;
  };

  profitability: {
    grossProfit: number;
    netProfit: number;
    marginPercentage: number;
    roas: number; // Return on ad spend if tracked
  };

  performance: {
    rank: number; // ranking in category
    ranking: 'top_tier' | 'mid_tier' | 'low_tier';
    health: 'excellent' | 'good' | 'fair' | 'poor';
  };
}

export interface ProductPerformanceResponse {
  timeRange: DateRange;
  totalProducts: number;
  analyzedProducts: number;

  byPerformance: {
    topPerformers: ProductPerformance[];
    middlePerformers: ProductPerformance[];
    underperformers: ProductPerformance[];
  };

  byCategory: Array<{
    category: string;
    productCount: number;
    totalSales: number;
    totalRevenue: number;
    topProduct: ProductPerformance;
  }>;

  summary: {
    totalSalesQty: number;
    totalRevenue: number;
    avgProductRevenue: number;
    avgMargin: number;
    topCategory: string;
  };
}

// Revenue Breakdown Types
export interface RevenueBreakdown {
  byPaymentMethod: Array<{
    method: string;
    amount: number;
    percentage: number;
    transactionCount: number;
  }>;

  byCategory: Array<{
    category: string;
    amount: number;
    percentage: number;
    growthRate: number;
  }>;

  byCustomerSegment: Array<{
    segment: string;
    amount: number;
    percentage: number;
    customerCount: number;
    avgOrderValue: number;
  }>;

  byChannel?: Array<{
    channel: string;
    amount: number;
    percentage: number;
  }>;

  refunds: {
    totalAmount: number;
    percentage: number;
    count: number;
    avgRefund: number;
  };

  netRevenue: number;
}

export interface RevenueBreakdownResponse {
  timeRange: DateRange;
  totalRevenue: number;
  breakdown: RevenueBreakdown;

  trends: Array<{
    period: string;
    revenue: number;
    breakdown: RevenueBreakdown;
  }>;

  comparison?: {
    previousPeriod: number;
    growth: number;
    growthPercentage: number;
  };
}

// Analytics Overview/Summary
export interface AnalyticsOverview {
  timeRange: DateRange;
  generatedAt: string;

  // Flat aliases (for screens that access overview.totalRevenue directly)
  totalRevenue?: number;
  totalOrders?: number;
  averageOrderValue?: number;
  totalCustomers?: number;
  revenueGrowth?: number;
  orderGrowth?: number;

  sales: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    revenueGrowth: number;
  };

  customers: {
    totalCustomers: number;
    newCustomers: number;
    activeCustomers: number;
    churnRate: number;
    retentionRate: number;
  };

  inventory: {
    totalProductValue: number;
    stockTurnoverRate: number;
    outOfStockCount: number;
    lowStockCount: number;
  };

  profitability: {
    grossProfit: number;
    netProfit: number;
    profitMargin: number;
    cogs: number;
  };

  health: {
    overallScore: number; // 0-100
    trend: 'up' | 'down' | 'stable';
    alerts: Array<{
      severity: 'low' | 'medium' | 'high';
      title: string;
      description: string;
    }>;
  };
}

// Export Types
export interface ExportRequest {
  format: 'csv' | 'excel' | 'pdf';
  reportTypes: Array<
    'overview' | 'sales_forecast' | 'inventory' | 'customers' | 'trends' | 'products' | 'revenue'
  >;
  timeRange?: DateRange;
  includeCharts?: boolean;
  includeComparisons?: boolean;
}

export interface ExportResponse {
  exportId: string;
  filename: string;
  url: string;
  fileSize: number;
  format: string;
  createdAt: string;
  expiresAt: string;
}

// Analytics Query Options
export interface AnalyticsQueryOptions {
  timeRange?: DateRange;
  dateRangePreset?: DateRangePreset;
  granularity?: 'daily' | 'weekly' | 'monthly';
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  category?: string;
  includeComparison?: boolean;
  includeForecasts?: boolean;
}

// Comparison Response
export interface PeriodComparison {
  current: {
    startDate: string;
    endDate: string;
    revenue: number;
    orders: number;
    customers: number;
  };
  previous: {
    startDate: string;
    endDate: string;
    revenue: number;
    orders: number;
    customers: number;
  };
  change: {
    revenue: number;
    revenuePercentage: number;
    orders: number;
    ordersPercentage: number;
    customers: number;
    customersPercentage: number;
  };
}

// Real-time Analytics
export interface RealTimeMetrics {
  lastUpdated: string;
  onlineCustomers: number;
  ordersInProgress: number;
  ordersCompletedToday?: number;
  avgResponseTime: number;
  systemHealth: 'healthy' | 'degraded' | 'offline';
  recentTransactions: Array<{
    orderId: string;
    amount: number;
    timestamp: string;
    status: string;
  }>;
}

// Daily Performance Data
export interface DailyPerformanceData {
  date: string;
  dayOfWeek: string;
  revenue: number;
  orders: number;
  customers: number;
}

export interface SalesByDayResponse {
  timeRange: DateRange;
  data: DailyPerformanceData[];
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    avgDailyRevenue: number;
    avgDailyOrders: number;
    bestDay: string;
    worstDay: string;
  };
}

// Peak Hours Data
export interface HourlyPerformanceData {
  hour: number;
  hourLabel: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
}

export interface SalesByTimeResponse {
  timeRange: DateRange;
  data: HourlyPerformanceData[];
  peakHours: {
    start: number;
    end: number;
    label: string;
    ordersPercentage: number;
    revenuePercentage: number;
  }[];
  summary: {
    busiestHour: number;
    quietestHour: number;
    avgOrdersPerHour: number;
    avgRevenuePerHour: number;
  };
}

// Top Selling Products
export interface TopSellingProduct {
  productId: string;
  productName: string;
  sku: string;
  imageUrl?: string;
  quantitySold: number;
  revenue: number;
  orderCount: number;
  trend: number;
  rank: number;
}

export interface TopSellingProductsResponse {
  timeRange: DateRange;
  products: TopSellingProduct[];
  summary: {
    totalProductsSold: number;
    totalRevenue: number;
    topCategoryName: string;
  };
}

// Customer Segments for Dashboard
export interface CustomerSegmentData {
  segment: string;
  count: number;
  percentage: number;
  revenue: number;
  avgOrderValue: number;
  color: string;
}

export interface CustomerSegmentsResponse {
  timeRange: DateRange;
  segments: CustomerSegmentData[];
  totalCustomers: number;
  summary: {
    highValuePercentage: number;
    newCustomerPercentage: number;
    atRiskPercentage: number;
  };
}

// Top Offers
export interface TopOffer {
  offerId: string;
  offerName: string;
  discountType: 'percentage' | 'fixed' | 'bogo';
  discountValue: number;
  redemptions: number;
  revenue: number;
  avgOrderValue: number;
  conversionRate: number;
}

export interface TopOffersResponse {
  timeRange: DateRange;
  offers: TopOffer[];
  summary: {
    totalRedemptions: number;
    totalRevenue: number;
    avgConversionRate: number;
  };
}

// Helper type for common analytics response
export interface AnalyticsResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

// ============================================
// Churn Prediction Types
// ============================================

export interface RFMScore {
  userId: string;
  recency: number;
  frequency: number;
  monetary: number;
  recencyScore: number;
  frequencyScore: number;
  monetaryScore: number;
  totalScore: number;
}

export interface ChurnPrediction {
  userId: string;
  churnProbability: number;
  churnRisk: 'low' | 'medium' | 'high' | 'critical';
  daysSinceLastOrder: number;
  lastOrderDate: string | null;
  predictedChurnDate: string | null;
  rfmScore: RFMScore;
  reasons: string[];
  recommendedActions: string[];
}

export interface ChurnAlert {
  userId: string;
  merchantId: string;
  alertType: 'at_risk' | 'churned' | 'reactivation';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  churnProbability: number;
  daysSinceLastOrder: number;
  createdAt: string;
}

export interface ChurnAnalysisResult {
  merchantId: string;
  analyzedAt: string;
  totalCustomers: number;
  atRiskCustomers: ChurnPrediction[];
  churnedCustomers: ChurnPrediction[];
  healthyCustomers: ChurnPrediction[];
  summary: {
    churnRate: number;
    averageChurnProbability: number;
    criticalCount: number;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    criticalPercentage: number;
    highRiskPercentage: number;
    mediumRiskPercentage: number;
    lowRiskPercentage: number;
  };
  alerts: ChurnAlert[];
}

export interface ChurnSummary {
  totalCustomers: number;
  churnRate: number;
  averageChurnProbability: number;
  riskDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  criticalAlerts: number;
  warnings: number;
  analyzedAt: string;
}

// ============================================
// LTV (Lifetime Value) Types
// ============================================

export type LTVSegment = 'Low' | 'Medium' | 'High' | 'VIP';

export interface LTVMetrics {
  userId: string;
  averageOrderValue: number;
  orderFrequency: number;
  customerLifespan: number;
  totalOrders: number;
  totalSpent: number;
  ltv: number;
  ltvSegment: LTVSegment;
  confidence: 'high' | 'medium' | 'low';
  calculatedAt: string;
}

export interface LTVAnalysisResult {
  merchantId: string;
  analyzedAt: string;
  totalCustomers: number;
  withSufficientData: number;
  customers: LTVMetrics[];
  segmentDistribution: {
    vip: number;
    high: number;
    medium: number;
    low: number;
  };
  summary: {
    totalLTV: number;
    averageLTV: number;
    medianLTV: number;
    topPercentile: number;
    vipTotalLTV: number;
    vipPercentage: number;
  };
}

export interface LTVSegmentProfile {
  segment: LTVSegment;
  count: number;
  averageLTV: number;
  totalLTV: number;
  averageOrderValue: number;
  averageOrderFrequency: number;
  averageCustomerLifespan: number;
  percentageOfCustomers: number;
  percentageOfTotalLTV: number;
  characteristics: string[];
  recommendedActions: string[];
}

export interface LTVSummary {
  totalCustomers: number;
  totalLTV: number;
  averageLTV: number;
  medianLTV: number;
  segmentDistribution: {
    vip: number;
    high: number;
    medium: number;
    low: number;
  };
  vipPercentage: number;
  vipTotalLTV: number;
  analyzedAt: string;
}

// ============================================
// Customer Segments Types
// ============================================

export interface CustomerSegment {
  id: string;
  userId: string;
  segments: {
    churnRisk: 'low' | 'medium' | 'high' | 'critical' | null;
    ltvSegment: LTVSegment | null;
  };
  metrics: {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    orderFrequency: number;
    daysSinceLastOrder: number;
    firstOrderDate: string | null;
    lastOrderDate: string | null;
  };
  churnProbability: number;
  ltv: number;
  computedAt: string;
}

export interface CustomerSegmentsSummary {
  churnSummary: {
    totalCustomers: number;
    churnRate: number;
    averageChurnProbability: number;
    criticalCount: number;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
  };
  ltvSummary: {
    totalLTV: number;
    averageLTV: number;
    medianLTV: number;
    vipCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    vipPercentage: number;
  };
  segmentDistribution: {
    vip: number;
    high: number;
    medium: number;
    low: number;
  };
  analyzedAt: string;
}

export interface ActionableSegment {
  id: string;
  name: string;
  description: string;
  churnRisk: string[];
  ltvSegment: string[];
  priority: number;
  actions: string[];
  customerCount: number;
}
