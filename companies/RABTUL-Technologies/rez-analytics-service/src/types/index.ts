// Core types for the Analytics Dashboard Service

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface KPIData {
  totalRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  ordersGrowth: number;
  averageOrderValue: number;
  aovGrowth: number;
  activeCustomers: number;
  customerGrowth: number;
  conversionRate: number;
  conversionGrowth: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
  refunds: number;
}

export interface OrderData {
  orderId: string;
  customerId: string;
  merchantId: string;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  createdAt: string;
  completedAt?: string;
}

export interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  churnRate: number;
  lifetimeValue: number;
  averagePurchaseFrequency: number;
}

export interface MerchantPerformance {
  merchantId: string;
  merchantName: string;
  totalSales: number;
  orderCount: number;
  averageRating: number;
  responseTime: number;
  fulfillmentRate: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
  }[];
}

export interface TopProduct {
  productId: string;
  productName: string;
  category: string;
  unitsSold: number;
  revenue: number;
}

export interface GeographicData {
  region: string;
  country: string;
  city: string;
  revenue: number;
  orders: number;
}

export interface DashboardSummary {
  kpis: KPIData;
  revenueChart: ChartData;
  ordersChart: ChartData;
  topProducts: TopProduct[];
  topMerchants: MerchantPerformance[];
  recentOrders: OrderData[];
  lastUpdated: string;
}

export interface AggregationResult {
  id: string;
  type: 'hourly' | 'daily' | 'weekly' | 'monthly';
  data: Record<string, unknown>;
  computedAt: string;
}

export interface ExportOptions {
  format: 'csv' | 'pdf';
  type: 'revenue' | 'orders' | 'customers' | 'merchants' | 'full';
  dateRange: DateRange;
}
