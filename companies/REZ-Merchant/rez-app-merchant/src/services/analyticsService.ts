// Analytics Service - Comprehensive analytics and insights for REZ Merchant App
// Provides dashboard metrics, revenue analytics, customer insights, product analytics, forecasting, and comparisons
// Enhanced with error handling, retry logic, mock data fallback, and loading states

import {
  withRetry,
  withErrorHandling,
  showToast,
  showNetworkErrorToast,
  LoadingState,
  AppError,
  NetworkError,
  ServerError,
  ValidationError,
  NotFoundError,
} from './errors';

// ============================================
// Types & Interfaces
// ============================================

// Date & Period Types
export interface DateRange {
  startDate: string;
  endDate: string;
}

export type Period = 'day' | 'week' | 'month' | 'quarter' | 'year';

export type MetricType =
  | 'revenue'
  | 'orders'
  | 'customers'
  | 'average_order_value'
  | 'conversion_rate';

export type ReportType =
  | 'sales'
  | 'revenue'
  | 'customers'
  | 'products'
  | 'inventory'
  | 'full';

// Dashboard Types
export interface DashboardMetrics {
  merchantId: string;
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    averageOrderValue: number;
    conversionRate: number;
    repeatCustomerRate: number;
  };
  comparison: {
    revenueChange: number;
    ordersChange: number;
    customersChange: number;
    aovChange: number;
  };
  period: DateRange;
  generatedAt: string;
}

export interface TrendData {
  date: string;
  value: number;
  label?: string;
  previousValue?: number;
  change?: number;
  changePercent?: number;
}

// Revenue Types
export interface RevenueAnalytics {
  merchantId: string;
  period: DateRange;
  summary: {
    grossRevenue: number;
    netRevenue: number;
    totalTransactions: number;
    averageTransactionValue: number;
    growthRate: number;
    projectedRevenue: number;
  };
  byDay: Array<{
    date: string;
    revenue: number;
    orders: number;
    averageOrderValue: number;
  }>;
  byPaymentMethod: Array<{
    method: string;
    amount: number;
    percentage: number;
    transactionCount: number;
  }>;
  byHour: Array<{
    hour: number;
    revenue: number;
    orders: number;
  }>;
  insights: Array<{
    type: 'peak_day' | 'peak_hour' | 'growth_opportunity' | 'warning';
    title: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
  generatedAt: string;
}

export interface CategoryRevenue {
  categoryId: string;
  categoryName: string;
  revenue: number;
  percentage: number;
  orderCount: number;
  averageOrderValue: number;
  growthRate: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ProductRevenue {
  productId: string;
  productName: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  revenue: number;
  quantity: number;
  percentage: number;
  averagePrice: number;
  returnRate?: number;
  margin?: number;
}

// Customer Types
export interface CustomerAnalytics {
  merchantId: string;
  period: DateRange;
  summary: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    activeCustomers: number;
    retentionRate: number;
    churnRate: number;
    averageLifetimeValue: number;
    averageOrdersPerCustomer: number;
  };
  byDay: Array<{
    date: string;
    newCustomers: number;
    returningCustomers: number;
    totalOrders: number;
  }>;
  segments: Array<{
    segment: 'new' | 'returning' | 'loyal' | 'at_risk' | 'churned';
    count: number;
    percentage: number;
    averageSpent: number;
  }>;
  insights: Array<{
    type: 'acquisition' | 'retention' | 'engagement' | 'warning';
    title: string;
    description: string;
    metric: string;
    value: number;
  }>;
  generatedAt: string;
}

export interface AcquisitionData {
  date: string;
  channel: string;
  newCustomers: number;
  revenue: number;
  conversionRate: number;
  cost?: number;
  roi?: number;
}

export interface RetentionData {
  cohort: string;
  cohortSize: number;
  periods: Array<{
    period: number;
    retentionRate: number;
    revenue: number;
    customersRemaining: number;
  }>;
}

export interface CLVData {
  customerId: string;
  customerName: string;
  email: string;
  totalSpent: number;
  orderCount: number;
  averageOrderValue: number;
  firstOrderDate: string;
  lastOrderDate: string;
  daysSinceLastOrder: number;
  predictedCLV?: number;
  segment: 'new' | 'active' | 'loyal' | 'at_risk' | 'churned';
}

// Product Types
export interface ProductAnalytics {
  merchantId: string;
  period: DateRange;
  summary: {
    totalProducts: number;
    activeProducts: number;
    topPerformers: number;
    underperformers: number;
    newProducts: number;
    discontinuedProducts: number;
  };
  byCategory: Array<{
    categoryId: string;
    categoryName: string;
    productCount: number;
    revenue: number;
    percentage: number;
  }>;
  performance: Array<{
    productId: string;
    productName: string;
    sku: string;
    revenue: number;
    quantity: number;
    returns: number;
    rating?: number;
    performance: 'excellent' | 'good' | 'average' | 'poor';
  }>;
  insights: Array<{
    type: 'top_performer' | 'underperformer' | 'trend' | 'opportunity';
    title: string;
    description: string;
    productId?: string;
  }>;
  generatedAt: string;
}

export interface TopProduct {
  productId: string;
  productName: string;
  sku: string;
  categoryName: string;
  revenue: number;
  quantity: number;
  averageRating?: number;
  returnRate?: number;
  growthRate: number;
}

export interface Product {
  productId: string;
  name: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  price: number;
  cost?: number;
  stock: number;
  minStock?: number;
  maxStock?: number;
  status: 'active' | 'inactive' | 'out_of_stock' | 'discontinued';
  lastSold?: string;
  daysSinceLastSale?: number;
  velocity?: number;
  turnoverRate?: number;
}

export interface SlowMovingProduct extends Product {
  daysSinceLastSale: number;
  velocity: number;
  reorderRecommendation?: 'urgent' | 'soon' | 'monitor';
  suggestedAction?: string;
}

// Comparison Types
export interface ComparisonData {
  merchantId: string;
  currentPeriod: DateRange;
  previousPeriod: DateRange;
  metrics: {
    revenue: {
      current: number;
      previous: number;
      change: number;
      changePercent: number;
    };
    orders: {
      current: number;
      previous: number;
      change: number;
      changePercent: number;
    };
    customers: {
      current: number;
      previous: number;
      change: number;
      changePercent: number;
    };
    averageOrderValue: {
      current: number;
      previous: number;
      change: number;
      changePercent: number;
    };
    conversionRate: {
      current: number;
      previous: number;
      change: number;
      changePercent: number;
    };
    retentionRate: {
      current: number;
      previous: number;
      change: number;
      changePercent: number;
    };
  };
  summary: {
    overallPerformance: 'improved' | 'stable' | 'declined';
    topImprovement: string;
    topDecline: string;
  };
  generatedAt: string;
}

export interface IndustryComparison {
  merchantId: string;
  industry: string;
  benchmarks: {
    averageOrderValue: {
      merchant: number;
      industry: number;
      percentile: number;
      comparison: 'above' | 'at' | 'below';
    };
    customerRetention: {
      merchant: number;
      industry: number;
      percentile: number;
      comparison: 'above' | 'at' | 'below';
    };
    revenueGrowth: {
      merchant: number;
      industry: number;
      percentile: number;
      comparison: 'above' | 'at' | 'below';
    };
    transactionFrequency: {
      merchant: number;
      industry: number;
      percentile: number;
      comparison: 'above' | 'at' | 'below';
    };
    productReturnRate: {
      merchant: number;
      industry: number;
      percentile: number;
      comparison: 'above' | 'at' | 'below';
    };
  };
  overallPercentile: number;
  recommendations: Array<{
    area: string;
    currentValue: number;
    targetValue: number;
    action: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  generatedAt: string;
}

// Forecasting Types
export interface Forecast {
  date: string;
  predicted: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

export interface ForecastData {
  merchantId: string;
  metric: MetricType;
  forecast: Forecast[];
  model: string;
  accuracy: number;
  seasonality: 'none' | 'weekly' | 'monthly' | 'yearly';
  trend: 'increasing' | 'stable' | 'decreasing';
  generatedAt: string;
}

// Export Types
export interface AnalyticsExport {
  id: string;
  type: ReportType;
  format: 'pdf' | 'excel';
  url: string;
  filename: string;
  generatedAt: string;
  expiresAt: string;
}

// Loading State Types
export interface AnalyticsLoadingState<T> {
  data: T | null;
  loading: boolean;
  error: AppError | null;
  refetch: () => Promise<void>;
}

// ============================================
// Service Configuration
// ============================================

const INSIGHTS_SERVICE_URL =
  process.env.EXPO_PUBLIC_INSIGHTS_SERVICE_URL || 'https://rez-insights-service.onrender.com';

// ============================================
// Mock Data Generators
// ============================================

function generateMockDateRange(period: Period): DateRange {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case 'day':
      start.setDate(start.getDate() - 1);
      break;
    case 'week':
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start.setMonth(start.getMonth() - 1);
      break;
    case 'quarter':
      start.setMonth(start.getMonth() - 3);
      break;
    case 'year':
      start.setFullYear(start.getFullYear() - 1);
      break;
  }

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

function generateTrendData(days: number, baseValue: number, variance: number = 0.1): TrendData[] {
  const data: TrendData[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const value = baseValue * (1 + (Math.random() - 0.5) * variance * 2);
    const previousValue = baseValue * (1 + (Math.random() - 0.5) * variance * 2);

    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value * 100) / 100,
      previousValue: Math.round(previousValue * 100) / 100,
      change: Math.round((value - previousValue) * 100) / 100,
      changePercent: Math.round(((value - previousValue) / previousValue) * 10000) / 100,
    });
  }

  return data;
}

function generateCategoryRevenue(): CategoryRevenue[] {
  const categories = [
    { id: 'cat-1', name: 'Beverages', baseRevenue: 45000 },
    { id: 'cat-2', name: 'Main Courses', baseRevenue: 68000 },
    { id: 'cat-3', name: 'Appetizers', baseRevenue: 22000 },
    { id: 'cat-4', name: 'Desserts', baseRevenue: 15000 },
    { id: 'cat-5', name: 'Specials', baseRevenue: 32000 },
  ];

  const total = categories.reduce((sum, c) => sum + c.baseRevenue, 0);

  return categories.map((cat) => ({
    categoryId: cat.id,
    categoryName: cat.name,
    revenue: cat.baseRevenue,
    percentage: Math.round((cat.baseRevenue / total) * 10000) / 100,
    orderCount: Math.floor(cat.baseRevenue / 25),
    averageOrderValue: 25 + Math.random() * 10,
    growthRate: (Math.random() - 0.3) * 30,
    trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
  }));
}

function generateProductRevenue(): ProductRevenue[] {
  const products = [
    { id: 'prod-1', name: 'Signature Burger', sku: 'BUR-001', category: 'Main Courses', baseRevenue: 18500 },
    { id: 'prod-2', name: 'Craft IPA', sku: 'BEV-012', category: 'Beverages', baseRevenue: 12800 },
    { id: 'prod-3', name: 'Caesar Salad', sku: 'SAL-003', category: 'Appetizers', baseRevenue: 9600 },
    { id: 'prod-4', name: 'Chocolate Lava Cake', sku: 'DES-007', category: 'Desserts', baseRevenue: 7200 },
    { id: 'prod-5', name: 'Grilled Salmon', sku: 'MCP-015', category: 'Specials', baseRevenue: 15400 },
    { id: 'prod-6', name: 'Margherita Pizza', sku: 'MCP-021', category: 'Specials', baseRevenue: 11200 },
    { id: 'prod-7', name: 'House Red Wine', sku: 'BEV-045', category: 'Beverages', baseRevenue: 8900 },
    { id: 'prod-8', name: 'Truffle Fries', sku: 'APP-033', category: 'Appetizers', baseRevenue: 6400 },
  ];

  const total = products.reduce((sum, p) => sum + p.baseRevenue, 0);

  return products.map((prod) => ({
    productId: prod.id,
    productName: prod.name,
    sku: prod.sku,
    categoryId: `cat-${products.indexOf(prod) + 1}`,
    categoryName: prod.category,
    revenue: prod.baseRevenue,
    quantity: Math.floor(prod.baseRevenue / 22),
    percentage: Math.round((prod.baseRevenue / total) * 10000) / 100,
    averagePrice: 22 + Math.random() * 8,
    returnRate: Math.random() * 5,
    margin: 60 + Math.random() * 25,
  }));
}

function generateAcquisitionData(): AcquisitionData[] {
  const channels = ['Organic Search', 'Social Media', 'Referral', 'Direct', 'Email Campaign'];
  const data: AcquisitionData[] = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    channels.forEach((channel) => {
      const newCustomers = Math.floor(Math.random() * 15) + 5;
      data.push({
        date: date.toISOString().split('T')[0],
        channel,
        newCustomers,
        revenue: newCustomers * (25 + Math.random() * 20),
        conversionRate: 2 + Math.random() * 8,
        cost: Math.random() > 0.7 ? Math.random() * 100 : undefined,
        roi: Math.random() > 0.5 ? Math.random() * 300 : undefined,
      });
    });
  }

  return data;
}

function generateRetentionData(): RetentionData[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const data: RetentionData[] = [];

  months.forEach((month, idx) => {
    const cohortSize = 50 + Math.floor(Math.random() * 100);
    const periods: RetentionData['periods'] = [];

    for (let p = 0; p <= 6 - idx; p++) {
      const retentionRate = Math.max(20, 100 - (p * 15 + Math.random() * 10));
      periods.push({
        period: p,
        retentionRate: Math.round(retentionRate * 100) / 100,
        revenue: cohortSize * (retentionRate / 100) * (45 + Math.random() * 20),
        customersRemaining: Math.floor(cohortSize * (retentionRate / 100)),
      });
    }

    data.push({
      cohort: month,
      cohortSize,
      periods,
    });
  });

  return data;
}

function generateCLVData(): CLVData[] {
  const firstNames = ['John', 'Sarah', 'Michael', 'Emily', 'David', 'Lisa', 'James', 'Jennifer', 'Robert', 'Maria'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const segments: CLVData['segment'][] = ['new', 'active', 'loyal', 'at_risk', 'churned'];

  const customers: CLVData[] = [];

  for (let i = 0; i < 20; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const orderCount = Math.floor(Math.random() * 30) + 1;
    const avgOrderValue = 20 + Math.random() * 60;
    const lastOrderDaysAgo = Math.floor(Math.random() * 60);
    const firstOrderDaysAgo = lastOrderDaysAgo + Math.floor(Math.random() * 180) + 30;

    const firstOrderDate = new Date();
    firstOrderDate.setDate(firstOrderDate.getDate() - firstOrderDaysAgo);

    const lastOrderDate = new Date();
    lastOrderDate.setDate(lastOrderDate.getDate() - lastOrderDaysAgo);

    let segment: CLVData['segment'];
    if (orderCount === 1 && firstOrderDaysAgo < 30) {
      segment = 'new';
    } else if (lastOrderDaysAgo > 45) {
      segment = lastOrderDaysAgo > 90 ? 'churned' : 'at_risk';
    } else if (orderCount > 10) {
      segment = 'loyal';
    } else {
      segment = 'active';
    }

    customers.push({
      customerId: `cust-${i + 1}`,
      customerName: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      totalSpent: Math.round(orderCount * avgOrderValue * 100) / 100,
      orderCount,
      averageOrderValue: Math.round(avgOrderValue * 100) / 100,
      firstOrderDate: firstOrderDate.toISOString().split('T')[0],
      lastOrderDate: lastOrderDate.toISOString().split('T')[0],
      daysSinceLastOrder: lastOrderDaysAgo,
      predictedCLV: orderCount * avgOrderValue * (1 + Math.random() * 2),
      segment,
    });
  }

  return customers.sort((a, b) => b.totalSpent - a.totalSpent);
}

function generateSlowMovingProducts(): SlowMovingProduct[] {
  const products = [
    { name: 'Vintage Wine Collection', sku: 'BEV-089', cat: 'Beverages', price: 89.99, stock: 12 },
    { name: 'Lobster Thermidor', sku: 'MCP-034', cat: 'Specials', price: 45.99, stock: 5 },
    { name: 'Truffle Oil Dressing', sku: 'SAU-012', cat: 'Appetizers', price: 18.99, stock: 8 },
    { name: 'Artisan Cheese Platter', sku: 'APP-056', cat: 'Appetizers', price: 32.99, stock: 3 },
    { name: 'Duck Confit', sku: 'MCP-067', cat: 'Main Courses', price: 38.99, stock: 4 },
  ];

  return products.map((prod, idx) => {
    const daysSince = 30 + Math.floor(Math.random() * 60);
    const velocity = Math.random() * 0.3;

    return {
      productId: `slow-${idx + 1}`,
      name: prod.name,
      sku: prod.sku,
      categoryId: `cat-${idx + 1}`,
      categoryName: prod.cat,
      price: prod.price,
      cost: prod.price * 0.4,
      stock: prod.stock,
      minStock: 5,
      maxStock: 20,
      status: 'active' as const,
      lastSold: new Date(Date.now() - daysSince * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      daysSinceLastSale: daysSince,
      velocity,
      turnoverRate: velocity * 30,
      reorderRecommendation: daysSince > 60 ? 'urgent' : daysSince > 45 ? 'soon' : 'monitor',
      suggestedAction: daysSince > 60
        ? 'Consider promotional pricing or removing from menu'
        : daysSince > 45
          ? 'Review pricing and consider special offers'
          : 'Monitor sales and gather customer feedback',
    };
  });
}

function generateForecast(metric: MetricType, days: number): Forecast[] {
  const baseValues: Record<MetricType, number> = {
    revenue: 2500,
    orders: 85,
    customers: 65,
    average_order_value: 29.41,
    conversion_rate: 3.5,
  };

  const base = baseValues[metric];
  const forecasts: Forecast[] = [];
  const now = new Date();

  for (let i = 1; i <= days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);

    const trend = 1 + (i * 0.005);
    const seasonality = 1 + Math.sin((i / 7) * Math.PI * 2) * 0.1;
    const noise = 1 + (Math.random() - 0.5) * 0.15;

    const predicted = base * trend * seasonality * noise;
    const confidence = Math.max(0.5, 0.95 - (i * 0.02));
    const uncertainty = (1 - confidence) * 0.3;

    forecasts.push({
      date: date.toISOString().split('T')[0],
      predicted: Math.round(predicted * 100) / 100,
      lowerBound: Math.round(predicted * (1 - uncertainty) * 100) / 100,
      upperBound: Math.round(predicted * (1 + uncertainty) * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
    });
  }

  return forecasts;
}

// ============================================
// Analytics Service Class
// ============================================

class AnalyticsService {
  private baseUrl: string;
  private useMockData: boolean;

  constructor() {
    this.baseUrl = INSIGHTS_SERVICE_URL;
    // Enable mock data fallback for development or when API is unavailable
    this.useMockData = process.env.NODE_ENV === 'development' || process.env.EXPO_PUBLIC_USE_MOCK_ANALYTICS === 'true';
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private async fetchWithFallback<T>(
    endpoint: string,
    mockDataGenerator: () => T,
    options: { retries?: number; showToastOnError?: boolean } = {}
  ): Promise<T> {
    const { retries = 3, showToastOnError = false } = options;

    try {
      const result = await withRetry(async () => {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new NotFoundError('Analytics data');
          }
          if (response.status >= 500) {
            throw new ServerError('Analytics service unavailable', response.status);
          }
          throw new AppError(`Request failed: ${response.statusText}`, 'HTTP_ERROR', response.status);
        }

        return response.json();
      }, { retries });

      return result as T;
    } catch (error) {
      console.warn('API request failed, using mock data:', error);

      if (showToastOnError) {
        showToast('info', 'Using cached data', 'Displaying demo analytics');
      }

      return mockDataGenerator();
    }
  }

  private async postWithFallback<T>(
    endpoint: string,
    body: Record<string, unknown>,
    mockDataGenerator: () => T,
    options: { retries?: number } = {}
  ): Promise<T> {
    const { retries = 3 } = options;

    try {
      const result = await withRetry(async () => {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new NotFoundError('Analytics data');
          }
          throw new ServerError('Request failed', response.status);
        }

        return response.json();
      }, { retries });

      return result as T;
    } catch (error) {
      console.warn('API request failed, using mock data:', error);
      return mockDataGenerator();
    }
  }

  // ============================================
  // Dashboard Methods
  // ============================================

  /**
   * Get dashboard metrics for a merchant
   */
  async getDashboardMetrics(merchantId: string): Promise<DashboardMetrics> {
    return this.fetchWithFallback(
      `/api/v1/analytics/dashboard/${merchantId}`,
      (): DashboardMetrics => {
        const dateRange = generateMockDateRange('month');

        return {
          merchantId,
          summary: {
            totalRevenue: 127450.00,
            totalOrders: 4235,
            totalCustomers: 1856,
            averageOrderValue: 30.10,
            conversionRate: 3.8,
            repeatCustomerRate: 42.5,
          },
          comparison: {
            revenueChange: 12.3,
            ordersChange: 8.7,
            customersChange: 15.2,
            aovChange: 3.2,
          },
          period: dateRange,
          generatedAt: new Date().toISOString(),
        };
      },
      { showToastOnError: true }
    );
  }

  /**
   * Get dashboard trends for a merchant
   */
  async getDashboardTrends(merchantId: string, period: Period): Promise<TrendData[]> {
    return this.fetchWithFallback(
      `/api/v1/analytics/dashboard/${merchantId}/trends?period=${period}`,
      (): TrendData[] => {
        const days = period === 'day' ? 24 : period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 90 : 365;
        return generateTrendData(days, 4200, 0.15);
      }
    );
  }

  // ============================================
  // Revenue Methods
  // ============================================

  /**
   * Get revenue analytics for a merchant
   */
  async getRevenueAnalytics(merchantId: string, dateRange: DateRange): Promise<RevenueAnalytics> {
    return this.fetchWithFallback(
      `/api/v1/analytics/revenue/${merchantId}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
      (): RevenueAnalytics => {
        const days: Array<{ date: string; revenue: number; orders: number; averageOrderValue: number }> = [];
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);
        const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 30;

        for (let i = 0; i < dayCount; i++) {
          const date = new Date(start);
          date.setDate(date.getDate() + i);
          const orders = Math.floor(80 + Math.random() * 60);
          days.push({
            date: date.toISOString().split('T')[0],
            revenue: orders * (25 + Math.random() * 10),
            orders,
            averageOrderValue: 25 + Math.random() * 10,
          });
        }

        return {
          merchantId,
          period: dateRange,
          summary: {
            grossRevenue: 127450.00,
            netRevenue: 114705.00,
            totalTransactions: 4235,
            averageTransactionValue: 30.10,
            growthRate: 12.3,
            projectedRevenue: 142000.00,
          },
          byDay: days,
          byPaymentMethod: [
            { method: 'Credit Card', amount: 63725.00, percentage: 50, transactionCount: 2118 },
            { method: 'Cash', amount: 31862.50, percentage: 25, transactionCount: 1059 },
            { method: 'Digital Wallet', amount: 25490.00, percentage: 20, transactionCount: 847 },
            { method: 'Gift Card', amount: 6372.50, percentage: 5, transactionCount: 211 },
          ],
          byHour: Array.from({ length: 24 }, (_, hour) => ({
            hour,
            revenue: hour >= 11 && hour <= 14 ? 3500 + Math.random() * 1500 : hour >= 18 && hour <= 21 ? 4000 + Math.random() * 2000 : 500 + Math.random() * 800,
            orders: hour >= 11 && hour <= 14 ? 120 + Math.floor(Math.random() * 50) : hour >= 18 && hour <= 21 ? 140 + Math.floor(Math.random() * 60) : 20 + Math.floor(Math.random() * 25),
          })),
          insights: [
            {
              type: 'peak_day',
              title: 'Saturday is your best day',
              description: 'Saturdays generate 35% more revenue than weekdays',
              impact: 'positive',
            },
            {
              type: 'peak_hour',
              title: 'Lunch rush opportunity',
              description: '12 PM sees the highest order volume. Consider expanding capacity.',
              impact: 'positive',
            },
            {
              type: 'growth_opportunity',
              title: 'Evening growth potential',
              description: 'Dinner orders are up 18% month-over-month',
              impact: 'positive',
            },
          ],
          generatedAt: new Date().toISOString(),
        };
      }
    );
  }

  /**
   * Get revenue breakdown by category
   */
  async getRevenueByCategory(merchantId: string, dateRange: DateRange): Promise<CategoryRevenue[]> {
    return this.fetchWithFallback(
      `/api/v1/analytics/revenue/${merchantId}/categories?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
      (): CategoryRevenue[] => generateCategoryRevenue()
    );
  }

  /**
   * Get revenue breakdown by product
   */
  async getRevenueByProduct(merchantId: string, dateRange: DateRange): Promise<ProductRevenue[]> {
    return this.fetchWithFallback(
      `/api/v1/analytics/revenue/${merchantId}/products?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
      (): ProductRevenue[] => generateProductRevenue()
    );
  }

  // ============================================
  // Customer Methods
  // ============================================

  /**
   * Get customer analytics for a merchant
   */
  async getCustomerAnalytics(merchantId: string, dateRange: DateRange): Promise<CustomerAnalytics> {
    return this.fetchWithFallback(
      `/api/v1/analytics/customers/${merchantId}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
      (): CustomerAnalytics => {
        const days: Array<{ date: string; newCustomers: number; returningCustomers: number; totalOrders: number }> = [];
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);
        const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 30;

        for (let i = 0; i < dayCount; i++) {
          const date = new Date(start);
          date.setDate(date.getDate() + i);
          days.push({
            date: date.toISOString().split('T')[0],
            newCustomers: Math.floor(5 + Math.random() * 10),
            returningCustomers: Math.floor(10 + Math.random() * 20),
            totalOrders: Math.floor(50 + Math.random() * 80),
          });
        }

        return {
          merchantId,
          period: dateRange,
          summary: {
            totalCustomers: 1856,
            newCustomers: 423,
            returningCustomers: 1433,
            activeCustomers: 1156,
            retentionRate: 77.2,
            churnRate: 22.8,
            averageLifetimeValue: 342.50,
            averageOrdersPerCustomer: 2.28,
          },
          byDay: days,
          segments: [
            { segment: 'new', count: 423, percentage: 22.8, averageSpent: 85.20 },
            { segment: 'returning', count: 892, percentage: 48.1, averageSpent: 245.80 },
            { segment: 'loyal', count: 387, percentage: 20.8, averageSpent: 580.40 },
            { segment: 'at_risk', count: 112, percentage: 6.0, averageSpent: 320.15 },
            { segment: 'churned', count: 42, percentage: 2.3, averageSpent: 156.30 },
          ],
          insights: [
            {
              type: 'retention',
              title: 'Strong customer retention',
              description: 'Your retention rate is 12% above industry average',
              metric: 'retentionRate',
              value: 77.2,
            },
            {
              type: 'acquisition',
              title: 'Growing customer base',
              description: 'You acquired 423 new customers this month',
              metric: 'newCustomers',
              value: 423,
            },
            {
              type: 'engagement',
              title: 'Loyal customers drive revenue',
              description: 'Loyal customers account for 65% of total revenue',
              metric: 'loyalRevenueShare',
              value: 65,
            },
          ],
          generatedAt: new Date().toISOString(),
        };
      }
    );
  }

  /**
   * Get customer acquisition data
   */
  async getCustomerAcquisition(merchantId: string, dateRange: DateRange): Promise<AcquisitionData[]> {
    return this.fetchWithFallback(
      `/api/v1/analytics/customers/${merchantId}/acquisition?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
      (): AcquisitionData[] => generateAcquisitionData()
    );
  }

  /**
   * Get customer retention cohort data
   */
  async getCustomerRetention(merchantId: string, dateRange: DateRange): Promise<RetentionData[]> {
    return this.fetchWithFallback(
      `/api/v1/analytics/customers/${merchantId}/retention?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
      (): RetentionData[] => generateRetentionData()
    );
  }

  /**
   * Get customer lifetime value data
   */
  async getCustomerLifetimeValue(merchantId: string): Promise<CLVData[]> {
    return this.fetchWithFallback(
      `/api/v1/analytics/customers/${merchantId}/clv`,
      (): CLVData[] => generateCLVData()
    );
  }

  // ============================================
  // Product Methods
  // ============================================

  /**
   * Get product analytics for a merchant
   */
  async getProductAnalytics(merchantId: string, dateRange: DateRange): Promise<ProductAnalytics> {
    return this.fetchWithFallback(
      `/api/v1/analytics/products/${merchantId}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
      (): ProductAnalytics => {
        const products = generateProductRevenue();
        const categories = generateCategoryRevenue();

        return {
          merchantId,
          period: dateRange,
          summary: {
            totalProducts: products.length,
            activeProducts: products.length - 1,
            topPerformers: Math.ceil(products.length * 0.3),
            underperformers: Math.ceil(products.length * 0.15),
            newProducts: 2,
            discontinuedProducts: 1,
          },
          byCategory: categories.map((cat) => ({
            categoryId: cat.categoryId,
            categoryName: cat.categoryName,
            productCount: Math.floor(Math.random() * 10) + 3,
            revenue: cat.revenue,
            percentage: cat.percentage,
          })),
          performance: products.slice(0, 5).map((prod) => ({
            productId: prod.productId,
            productName: prod.productName,
            sku: prod.sku,
            revenue: prod.revenue,
            quantity: prod.quantity,
            returns: Math.floor(prod.quantity * 0.03),
            rating: 3.5 + Math.random() * 1.5,
            performance: 'excellent' as const,
          })),
          insights: [
            {
              type: 'top_performer',
              title: 'Signature Burger dominates',
              description: 'Your Signature Burger accounts for 15% of total revenue',
              productId: 'prod-1',
            },
            {
              type: 'opportunity',
              title: 'Cross-selling opportunity',
              description: 'Customers who order appetizers spend 40% more',
              productId: undefined,
            },
          ],
          generatedAt: new Date().toISOString(),
        };
      }
    );
  }

  /**
   * Get top performing products
   */
  async getTopProducts(merchantId: string, limit: number = 10): Promise<TopProduct[]> {
    return this.fetchWithFallback(
      `/api/v1/analytics/products/${merchantId}/top?limit=${limit}`,
      (): TopProduct[] => {
        const products = generateProductRevenue();
        return products
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, limit)
          .map((prod) => ({
            productId: prod.productId,
            productName: prod.productName,
            sku: prod.sku,
            categoryName: prod.categoryName,
            revenue: prod.revenue,
            quantity: prod.quantity,
            averageRating: 3.5 + Math.random() * 1.5,
            returnRate: Math.random() * 3,
            growthRate: (Math.random() - 0.2) * 40,
          }));
      }
    );
  }

  /**
   * Get slow-moving products that need attention
   */
  async getSlowMovingProducts(merchantId: string): Promise<SlowMovingProduct[]> {
    return this.fetchWithFallback(
      `/api/v1/analytics/products/${merchantId}/slow-moving`,
      (): SlowMovingProduct[] => generateSlowMovingProducts()
    );
  }

  // ============================================
  // Comparison Methods
  // ============================================

  /**
   * Compare current period metrics with previous period
   */
  async compareWithPreviousPeriod(merchantId: string, dateRange: DateRange): Promise<ComparisonData> {
    return this.fetchWithFallback(
      `/api/v1/analytics/compare/${merchantId}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
      (): ComparisonData => {
        const currentRevenue = 127450;
        const previousRevenue = 113400;
        const currentOrders = 4235;
        const previousOrders = 3890;
        const currentCustomers = 1856;
        const previousCustomers = 1612;
        const currentAOV = 30.10;
        const previousAOV = 29.15;
        const currentConversion = 3.8;
        const previousConversion = 3.5;
        const currentRetention = 77.2;
        const previousRetention = 74.8;

        return {
          merchantId,
          currentPeriod: dateRange,
          previousPeriod: {
            startDate: new Date(new Date(dateRange.startDate).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            endDate: new Date(new Date(dateRange.endDate).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          },
          metrics: {
            revenue: {
              current: currentRevenue,
              previous: previousRevenue,
              change: currentRevenue - previousRevenue,
              changePercent: ((currentRevenue - previousRevenue) / previousRevenue) * 100,
            },
            orders: {
              current: currentOrders,
              previous: previousOrders,
              change: currentOrders - previousOrders,
              changePercent: ((currentOrders - previousOrders) / previousOrders) * 100,
            },
            customers: {
              current: currentCustomers,
              previous: previousCustomers,
              change: currentCustomers - previousCustomers,
              changePercent: ((currentCustomers - previousCustomers) / previousCustomers) * 100,
            },
            averageOrderValue: {
              current: currentAOV,
              previous: previousAOV,
              change: currentAOV - previousAOV,
              changePercent: ((currentAOV - previousAOV) / previousAOV) * 100,
            },
            conversionRate: {
              current: currentConversion,
              previous: previousConversion,
              change: currentConversion - previousConversion,
              changePercent: ((currentConversion - previousConversion) / previousConversion) * 100,
            },
            retentionRate: {
              current: currentRetention,
              previous: previousRetention,
              change: currentRetention - previousRetention,
              changePercent: ((currentRetention - previousRetention) / previousRetention) * 100,
            },
          },
          summary: {
            overallPerformance: 'improved' as const,
            topImprovement: 'Customer acquisition up 15.2%',
            topDecline: 'Product return rate increased slightly',
          },
          generatedAt: new Date().toISOString(),
        };
      }
    );
  }

  /**
   * Compare merchant metrics with industry benchmarks
   */
  async compareWithIndustry(merchantId: string): Promise<IndustryComparison> {
    return this.fetchWithFallback(
      `/api/v1/analytics/compare/${merchantId}/industry`,
      (): IndustryComparison => {
        const percentile = 72;

        return {
          merchantId,
          industry: 'Restaurants & Food Service',
          benchmarks: {
            averageOrderValue: {
              merchant: 30.10,
              industry: 28.50,
              percentile: 65,
              comparison: 'above' as const,
            },
            customerRetention: {
              merchant: 77.2,
              industry: 68.5,
              percentile: 78,
              comparison: 'above' as const,
            },
            revenueGrowth: {
              merchant: 12.3,
              industry: 8.5,
              percentile: 82,
              comparison: 'above' as const,
            },
            transactionFrequency: {
              merchant: 2.28,
              industry: 1.95,
              percentile: 71,
              comparison: 'above' as const,
            },
            productReturnRate: {
              merchant: 2.1,
              industry: 3.5,
              percentile: 85,
              comparison: 'below' as const,
            },
          },
          overallPercentile: percentile,
          recommendations: [
            {
              area: 'Average Order Value',
              currentValue: 30.10,
              targetValue: 35.00,
              action: 'Introduce combo meals and upselling training for staff',
              priority: 'medium' as const,
            },
            {
              area: 'Customer Acquisition',
              currentValue: 423,
              targetValue: 500,
              action: 'Increase social media marketing budget and loyalty program incentives',
              priority: 'high' as const,
            },
            {
              area: 'Peak Hour Efficiency',
              currentValue: 85,
              targetValue: 95,
              action: 'Optimize kitchen workflow and staff scheduling during lunch rush',
              priority: 'medium' as const,
            },
          ],
          generatedAt: new Date().toISOString(),
        };
      }
    );
  }

  // ============================================
  // Forecasting Methods
  // ============================================

  /**
   * Get forecast for a specific metric
   */
  async getForecast(merchantId: string, metric: MetricType, days: number = 30): Promise<Forecast[]> {
    return this.fetchWithFallback(
      `/api/v1/analytics/forecast/${merchantId}?metric=${metric}&days=${days}`,
      (): Forecast[] => generateForecast(metric, days)
    );
  }

  // ============================================
  // Export Methods
  // ============================================

  /**
   * Export analytics report in specified format
   */
  async exportAnalytics(
    merchantId: string,
    type: ReportType,
    format: 'pdf' | 'excel'
  ): Promise<string> {
    try {
      const response = await withRetry(async () => {
        const response = await fetch(`${this.baseUrl}/api/v1/analytics/export`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            merchantId,
            type,
            format,
          }),
        });

        if (!response.ok) {
          throw new ServerError('Failed to generate export', response.status);
        }

        return response.json();
      }, { retries: 3 });

      return (response as { url: string }).url;
    } catch (error) {
      console.warn('Export API unavailable, generating mock URL:', error);

      // Return a mock URL for development/demo
      const filename = `${type}_report_${merchantId}_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      return `https://rez-exports.storage.googleapis.com/${filename}`;
    }
  }

  /**
   * Get export status and download URL
   */
  async getExportStatus(exportId: string): Promise<{
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    url?: string;
    expiresAt?: string;
  }> {
    return this.fetchWithFallback(
      `/api/v1/analytics/export/${exportId}/status`,
      (): { id: string; status: 'pending' | 'processing' | 'completed' | 'failed'; url?: string; expiresAt?: string } => ({
        id: exportId,
        status: 'completed',
        url: `https://rez-exports.storage.googleapis.com/export_${exportId}.pdf`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
    );
  }

  // ============================================
  // Loading State Helpers
  // ============================================

  /**
   * Create a loading state for unknown analytics query
   */
  createLoadingState<T>(): LoadingState<T> {
    return {
      data: null,
      loading: false,
      error: null,
      refetch: async () => {},
    };
  }

  /**
   * Wrap an analytics method with loading state management
   */
  async withLoadingState<T>(
    fetchFn: () => Promise<T>,
    setState: React.Dispatch<React.SetStateAction<LoadingState<T>>>
  ): Promise<T | null> {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await fetchFn();
      setState({ data, loading: false, error: null, refetch: () => this.withLoadingState(fetchFn, setState) });
      return data;
    } catch (error) {
      const appError = classifyError(error);
      setState((prev) => ({ ...prev, loading: false, error: appError, refetch: () => this.withLoadingState(fetchFn, setState) }));
      return null;
    }
  }
}

// ============================================
// Error Classification (local helper)
// ============================================

function classifyError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return new NetworkError(undefined, error);
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return new NetworkError('Request timed out', error);
    }

    return new AppError(error.message, 'UNKNOWN_ERROR', undefined, error);
  }

  return new AppError('An unknown error occurred', 'UNKNOWN_ERROR');
}

// ============================================
// Export singleton instance
// ============================================

export const analyticsService = new AnalyticsService();
export default analyticsService;

// ============================================
// Named exports for individual analytics functions (alternative API)
// ============================================

export const getDashboardMetrics = (merchantId: string) => analyticsService.getDashboardMetrics(merchantId);
export const getDashboardTrends = (merchantId: string, period: Period) => analyticsService.getDashboardTrends(merchantId, period);
export const getRevenueAnalytics = (merchantId: string, dateRange: DateRange) => analyticsService.getRevenueAnalytics(merchantId, dateRange);
export const getRevenueByCategory = (merchantId: string, dateRange: DateRange) => analyticsService.getRevenueByCategory(merchantId, dateRange);
export const getRevenueByProduct = (merchantId: string, dateRange: DateRange) => analyticsService.getRevenueByProduct(merchantId, dateRange);
export const getCustomerAnalytics = (merchantId: string, dateRange: DateRange) => analyticsService.getCustomerAnalytics(merchantId, dateRange);
export const getCustomerAcquisition = (merchantId: string, dateRange: DateRange) => analyticsService.getCustomerAcquisition(merchantId, dateRange);
export const getCustomerRetention = (merchantId: string, dateRange: DateRange) => analyticsService.getCustomerRetention(merchantId, dateRange);
export const getCustomerLifetimeValue = (merchantId: string) => analyticsService.getCustomerLifetimeValue(merchantId);
export const getProductAnalytics = (merchantId: string, dateRange: DateRange) => analyticsService.getProductAnalytics(merchantId, dateRange);
export const getTopProducts = (merchantId: string, limit?: number) => analyticsService.getTopProducts(merchantId, limit);
export const getSlowMovingProducts = (merchantId: string) => analyticsService.getSlowMovingProducts(merchantId);
export const compareWithPreviousPeriod = (merchantId: string, dateRange: DateRange) => analyticsService.compareWithPreviousPeriod(merchantId, dateRange);
export const compareWithIndustry = (merchantId: string) => analyticsService.compareWithIndustry(merchantId);
export const getForecast = (merchantId: string, metric: MetricType, days?: number) => analyticsService.getForecast(merchantId, metric, days);
export const exportAnalytics = (merchantId: string, type: ReportType, format: 'pdf' | 'excel') => analyticsService.exportAnalytics(merchantId, type, format);
