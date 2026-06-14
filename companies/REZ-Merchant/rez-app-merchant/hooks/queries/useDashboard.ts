import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import {
  DashboardData,
  DashboardMetrics,
  RecentActivity,
  TopProduct,
  SalesData,
  CustomerPayment,
  StorePerformance,
  ActionItem,
  TodayRevenueMetrics,
  TopItemToday,
  CampaignPerformance,
  CustomerRetentionMetrics,
  BasketSizeTrend,
} from '@/services/api/dashboard';
import { dashboardService } from '@/services/api/dashboard';
import { queryConfig } from '@/config/reactQuery';
import { queryKeys } from './queryKeys';

/**
 * Hook to fetch complete dashboard data
 * O-7: Set staleTime to 30 seconds for fresh dashboard stats
 */
export function useDashboard(options?: UseQueryOptions<DashboardData>) {
  return useQuery({
    queryKey: queryKeys.dashboard.data(),
    queryFn: () => dashboardService.getDashboardData(),
    staleTime: 30_000, // 30 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

/**
 * Hook to fetch dashboard metrics only
 * O-7: Set staleTime to 30 seconds for fresh metrics
 */
export function useDashboardMetrics(options?: UseQueryOptions<DashboardMetrics>) {
  return useQuery({
    queryKey: queryKeys.dashboard.metrics(),
    queryFn: () => dashboardService.getMetrics(),
    staleTime: 30_000, // 30 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

/**
 * Hook to fetch recent activity
 */
export function useRecentActivity(limit: number = 10, options?: UseQueryOptions<RecentActivity[]>) {
  return useQuery({
    queryKey: queryKeys.dashboard.activity(limit),
    queryFn: () => dashboardService.getRecentActivity(limit),
    ...queryConfig.dashboard,
    ...options,
  });
}

/**
 * Hook to fetch top products
 */
export function useTopProducts(
  limit: number = 10,
  period: '7d' | '30d' | '90d' = '30d',
  options?: UseQueryOptions<TopProduct[]>
) {
  return useQuery({
    queryKey: queryKeys.dashboard.topProducts(limit, period),
    queryFn: () => dashboardService.getTopProducts(limit, period),
    ...queryConfig.dashboard,
    ...options,
  });
}

/**
 * Hook to fetch sales data for charts
 */
export function useSalesData(
  period: '7d' | '30d' | '90d' | '1y' = '30d',
  options?: UseQueryOptions<SalesData[]>
) {
  return useQuery({
    queryKey: queryKeys.dashboard.salesData(period),
    queryFn: () => dashboardService.getSalesData(period),
    ...queryConfig.dashboard,
    ...options,
  });
}

/**
 * Hook to fetch low stock alerts
 */
export function useLowStockAlerts(
  options?: UseQueryOptions<
    Array<{
      productId: string;
      name: string;
      currentStock: number;
      threshold: number;
    }>
  >
) {
  return useQuery({
    queryKey: queryKeys.dashboard.lowStock(),
    queryFn: () => dashboardService.getLowStockAlerts(),
    staleTime: 5 * 60 * 1000, // Update more frequently for alerts
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}

/** Customer payments for the dashboard payment section */
export function useCustomerPayments(
  storeId?: string,
  page: number = 1,
  limit: number = 8,
  options?: UseQueryOptions<{ payments: CustomerPayment[] }>
) {
  return useQuery({
    queryKey: queryKeys.dashboard.customerPayments(storeId, page, limit),
    queryFn: () => dashboardService.getCustomerPayments(storeId, page, limit),
    staleTime: 60_000,
    ...options,
  });
}

/** Store performance across all merchant stores */
export function useStorePerformance(options?: UseQueryOptions<{ stores: StorePerformance[] }>) {
  return useQuery({
    queryKey: queryKeys.dashboard.storePerformance(),
    queryFn: () => dashboardService.getStorePerformance(),
    staleTime: 5 * 60_000,
    ...options,
  });
}

/** Action items requiring merchant attention */
export function useActionItems(
  storeId?: string,
  options?: UseQueryOptions<{ actionItems: ActionItem[] }>
) {
  return useQuery({
    queryKey: queryKeys.dashboard.actionItems(storeId),
    queryFn: () => dashboardService.getActionItems(storeId),
    staleTime: 2 * 60_000,
    ...options,
  });
}

/** Today's revenue summary (ROI metrics) */
export function useTodayRevenue(storeId?: string, options?: UseQueryOptions<TodayRevenueMetrics>) {
  return useQuery({
    queryKey: queryKeys.dashboard.todayRevenue(storeId),
    queryFn: () => dashboardService.getTodayRevenueSummary(storeId),
    staleTime: 30_000,
    ...options,
  });
}

/** Top selling items today */
export function useTopItemsToday(
  storeId?: string,
  limit: number = 3,
  options?: UseQueryOptions<TopItemToday[]>
) {
  return useQuery({
    queryKey: queryKeys.dashboard.topItemsToday(storeId, limit),
    queryFn: () => dashboardService.getTopItemsToday(storeId, limit),
    staleTime: 60_000,
    ...options,
  });
}

/** Campaign performance metrics */
export function useCampaignPerformance(
  storeId?: string,
  options?: UseQueryOptions<CampaignPerformance[]>
) {
  return useQuery({
    queryKey: queryKeys.dashboard.campaignPerformance(storeId),
    queryFn: () => dashboardService.getCampaignPerformance(storeId),
    staleTime: 5 * 60_000,
    ...options,
  });
}

/** Customer retention metrics */
export function useCustomerRetention(
  storeId?: string,
  options?: UseQueryOptions<CustomerRetentionMetrics>
) {
  return useQuery({
    queryKey: queryKeys.dashboard.customerRetention(storeId),
    queryFn: () => dashboardService.getCustomerRetentionMetrics(storeId),
    staleTime: 5 * 60_000,
    ...options,
  });
}

/** Basket size trend */
export function useBasketSizeTrend(storeId?: string, options?: UseQueryOptions<BasketSizeTrend>) {
  return useQuery({
    queryKey: queryKeys.dashboard.basketTrend(storeId),
    queryFn: () => dashboardService.getBasketSizeTrend?.(storeId) ?? Promise.resolve(null),
    staleTime: 5 * 60_000,
    ...options,
  });
}

/**
 * Compound hook that fetches multiple dashboard data points
 */
export function useDashboardData(options?: {
  includeMetrics?: boolean;
  includeActivity?: boolean;
  includeTopProducts?: boolean;
  includeSalesData?: boolean;
  includeLowStock?: boolean;
  activityLimit?: number;
  topProductsLimit?: number;
  period?: '7d' | '30d' | '90d' | '1y';
}) {
  const {
    includeMetrics = true,
    includeActivity = true,
    includeTopProducts = true,
    includeSalesData = true,
    includeLowStock = true,
    activityLimit = 10,
    topProductsLimit = 10,
    period = '30d',
  } = options || {};

  const metricsQuery = useQuery({
    queryKey: queryKeys.dashboard.metrics(),
    queryFn: () => dashboardService.getMetrics(),
    enabled: includeMetrics,
    ...queryConfig.dashboard,
  });

  const activityQuery = useQuery({
    queryKey: queryKeys.dashboard.activity(activityLimit),
    queryFn: () => dashboardService.getRecentActivity(activityLimit),
    enabled: includeActivity,
    ...queryConfig.dashboard,
  });

  const topProductsQuery = useQuery({
    queryKey: queryKeys.dashboard.topProducts(topProductsLimit, period),
    queryFn: () => dashboardService.getTopProducts(topProductsLimit, period as unknown),
    enabled: includeTopProducts,
    ...queryConfig.dashboard,
  });

  const salesDataQuery = useQuery({
    queryKey: queryKeys.dashboard.salesData(period),
    queryFn: () => dashboardService.getSalesData(period as unknown),
    enabled: includeSalesData,
    ...queryConfig.dashboard,
  });

  const lowStockQuery = useQuery({
    queryKey: queryKeys.dashboard.lowStock(),
    queryFn: () => dashboardService.getLowStockAlerts(),
    enabled: includeLowStock,
    staleTime: 5 * 60 * 1000,
  });

  return {
    metrics: metricsQuery,
    activity: activityQuery,
    topProducts: topProductsQuery,
    salesData: salesDataQuery,
    lowStock: lowStockQuery,
    isLoading:
      metricsQuery.isLoading ||
      activityQuery.isLoading ||
      topProductsQuery.isLoading ||
      salesDataQuery.isLoading ||
      lowStockQuery.isLoading,
    isError:
      metricsQuery.isError ||
      activityQuery.isError ||
      topProductsQuery.isError ||
      salesDataQuery.isError ||
      lowStockQuery.isError,
    error:
      metricsQuery.error ||
      activityQuery.error ||
      topProductsQuery.error ||
      salesDataQuery.error ||
      lowStockQuery.error,
  };
}
