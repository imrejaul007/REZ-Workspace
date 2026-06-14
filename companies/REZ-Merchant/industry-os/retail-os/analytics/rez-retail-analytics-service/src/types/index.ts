import { z } from 'zod';

// Date range for analytics queries
export const DateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export type DateRange = z.infer<typeof DateRangeSchema>;

// Sales Analytics Types
export interface SalesSummary {
  totalRevenue: number;
  totalOrders: number;
  totalItemsSold: number;
  averageOrderValue: number;
  averageItemsPerOrder: number;
  totalDiscounts: number;
  totalRefunds: number;
  netRevenue: number;
}

export interface SalesByPeriod {
  period: string;
  revenue: number;
  orders: number;
  items: number;
  averageOrderValue: number;
}

export interface SalesByCategory {
  categoryId: string;
  categoryName: string;
  revenue: number;
  orders: number;
  percentage: number;
}

export interface SalesByPaymentMethod {
  method: string;
  revenue: number;
  count: number;
  percentage: number;
}

export interface HourlySales {
  hour: number;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  revenue: number;
  orders: number;
}

// Customer Analytics Types
export interface CustomerSummary {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  churnRate: number;
  retentionRate: number;
}

export interface CustomerByTier {
  tier: string;
  count: number;
  percentage: number;
  totalSpent: number;
  averageSpent: number;
}

export interface CustomerLifetimeValue {
  customerId: string;
  customerName: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastPurchaseDate: Date;
}

export interface CustomerAcquisition {
  period: string;
  newCustomers: number;
  returningCustomers: number;
}

// Product Analytics Types
export interface ProductPerformance {
  productId: string;
  sku: string;
  name: string;
  category: string;
  unitsSold: number;
  revenue: number;
  averageRating?: number;
  returnRate: number;
  stockTurnover: number;
}

export interface CategoryPerformance {
  categoryId: string;
  categoryName: string;
  productCount: number;
  unitsSold: number;
  revenue: number;
  averagePrice: number;
  growthRate: number;
}

export interface InventoryHealth {
  totalProducts: number;
  inStockProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalValue: number;
  averageDaysToSell: number;
}

// Dashboard Summary
export interface DashboardSummary {
  revenue: SalesSummary;
  customers: CustomerSummary;
  topProducts: TopProduct[];
  salesTrend: SalesByPeriod[];
  lowStockAlerts: number;
  pendingOrders: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
