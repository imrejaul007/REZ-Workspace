/**
 * useDashboardData — extracted from app/(dashboard)/index.tsx
 *
 * Provides all dashboard state: metrics, overview, notifications, loading/error,
 * customer payments, ROI data, health score, and recommendations.
 * Also owns the fetch, refresh, and real-time-update logic.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { router } from 'expo-router';
import { __DEV__ } from '@env';
import { maybeRequestReview } from '@/utils/storeReview';
import { useAuth } from '@/contexts/AuthContext';
import { useMerchant } from '@/contexts/MerchantContext';
import { useStore } from '@/contexts/StoreContext';
import { useDashboardRealTime } from '@/hooks/useRealTimeUpdates';
import { logger } from '@/utils/logger';
import {
  dashboardService,
  CustomerPayment,
  StorePerformance,
  ActionItem,
  TodayRevenueMetrics,
  TopItemToday,
  CampaignPerformance,
  CustomerRetentionMetrics,
  BasketSizeTrend,
} from '@/services/api/dashboard';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  averageOrderValue: number;
  totalOrders: number;
  monthlyOrders: number;
  ordersGrowth: number;
  pendingOrders: number;
  completedOrders: number;
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  totalCustomers: number;
  monthlyCustomers: number;
  customerGrowth: number;
  totalCashbackPaid: number;
  pendingCashback: number;
  profitMargin: number;
}

export interface DashboardOverview {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  pendingCashback: number;
  recentActivity?: {
    orders?: unknown[];
    products?: unknown[];
  };
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  count: number;
}

export interface HealthData {
  score: number;
  trend: number;
  percentile?: number;
}

export interface Recommendation {
  id: string;
  headline: string;
  description: string;
  estimatedImpact?: string;
  actionLabel?: string;
  actionRoute?: string;
}

export interface UseDashboardDataReturn {
  // State
  metrics: DashboardMetrics | null;
  overview: DashboardOverview | null;
  notifications: Notification[];
  isLoading: boolean;
  refreshing: boolean;
  dashboardError: string | null;
  customerPayments: CustomerPayment[];
  storePerformance: StorePerformance[];
  actionItems: ActionItem[];
  todayRevenue: TodayRevenueMetrics | null;
  topItemsToday: TopItemToday[];
  campaignPerformance: CampaignPerformance[];
  customerRetention: CustomerRetentionMetrics | null;
  basketTrend: BasketSizeTrend | null;
  healthData: HealthData | null;
  recommendations: Recommendation[];
  // Actions
  fetchDashboardData: (showRefreshing?: boolean) => Promise<void>;
  handleRefresh: () => void;
  // Formatters
  formatCurrency: (amount: number) => string;
  formatPercentage: (value: number) => string;
  formatNumber: (value: number) => string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDashboardData(): UseDashboardDataReturn {
  const { state: authState } = useAuth();
  const { loadAnalytics } = useMerchant();
  const { activeStore } = useStore();
  const realTime = useDashboardRealTime();

  // ── State ──────────────────────────────────────────────────────────────────

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>([]);
  const [storePerformance, setStorePerformance] = useState<StorePerformance[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [todayRevenue, setTodayRevenue] = useState<TodayRevenueMetrics | null>(null);
  const [topItemsToday, setTopItemsToday] = useState<TopItemToday[]>([]);
  const [campaignPerformance, setCampaignPerformance] = useState<CampaignPerformance[]>([]);
  const [customerRetention, setCustomerRetention] = useState<CustomerRetentionMetrics | null>(null);
  const [basketTrend, setBasketTrend] = useState<BasketSizeTrend | null>(null);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  // ── Refs ──────────────────────────────────────────────────────────────────

  const lastFetchRef = useRef<number>(0);
  const fetchInFlightRef = useRef<boolean>(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchDashboardData = useCallback(
    async (showRefreshing = false) => {
      const now = Date.now();
      if (fetchInFlightRef.current) return;
      if (now - lastFetchRef.current < 3000) return;
      lastFetchRef.current = now;
      fetchInFlightRef.current = true;

      setDashboardError(null);
      try {
        if (showRefreshing) setRefreshing(true);
        else setIsLoading(true);

        const storeId = activeStore?._id;
        const dashboardData = await dashboardService.getAllDashboardData(storeId);

        if (dashboardData.metrics) {
          const transformedMetrics: DashboardMetrics = {
            totalRevenue: dashboardData.metrics.totalRevenue || 0,
            monthlyRevenue: dashboardData.metrics.monthlyRevenue || 0,
            revenueGrowth: dashboardData.metrics.revenueGrowth || 0,
            averageOrderValue: dashboardData.metrics.averageOrderValue || 0,
            totalOrders: dashboardData.metrics.totalOrders || 0,
            monthlyOrders: dashboardData.metrics.monthlyOrders || 0,
            ordersGrowth: dashboardData.metrics.ordersGrowth || 0,
            pendingOrders: dashboardData.metrics.pendingOrders || 0,
            completedOrders: dashboardData.metrics.completedOrders || 0,
            totalProducts: dashboardData.metrics.totalProducts || 0,
            activeProducts: dashboardData.metrics.activeProducts || 0,
            lowStockProducts: dashboardData.metrics.lowStockProducts || 0,
            totalCustomers: dashboardData.metrics.totalCustomers || 0,
            monthlyCustomers: dashboardData.metrics.monthlyCustomers || 0,
            customerGrowth: dashboardData.metrics.customerGrowth || 0,
            totalCashbackPaid: dashboardData.metrics.totalCashbackPaid || 0,
            pendingCashback: dashboardData.metrics.pendingCashback || 0,
            profitMargin: dashboardData.metrics.profitMargin || 0,
          };
          setMetrics(transformedMetrics);
          if (transformedMetrics.completedOrders > 0) {
            maybeRequestReview(transformedMetrics.completedOrders);
          }
        }

        if (dashboardData.overview) {
          const transformedOverview: DashboardOverview = {
            totalProducts: dashboardData.overview.quickStats?.totalProducts || 0,
            totalOrders: dashboardData.overview.quickStats?.totalOrders || 0,
            pendingOrders: dashboardData.overview.quickStats?.pendingOrders || 0,
            pendingCashback: dashboardData.overview.quickStats?.pendingCashback || 0,
            recentActivity: {
              orders: dashboardData.overview.recentActivity?.orders?.slice(0, 5) || [],
              products: dashboardData.overview.recentActivity?.products?.slice(0, 5) || [],
            },
          };
          setOverview(transformedOverview);
        }

        const [
          cpData,
          spData,
          aiData,
          todayRevData,
          topItemsData,
          campaignData,
          retentionData,
          basketData,
          healthRes,
          recRes,
        ] = await Promise.all([
          dashboardService.getCustomerPayments(storeId, 1, 8).catch((e) => {
            logger.error('[Dashboard] getCustomerPayments failed:', e);
            return { payments: [] };
          }),
          dashboardService.getStorePerformance().catch((e) => {
            logger.error('[Dashboard] getStorePerformance failed:', e);
            return { stores: [] };
          }),
          dashboardService.getActionItems(storeId).catch((e) => {
            logger.error('[Dashboard] getActionItems failed:', e);
            return { actionItems: [] };
          }),
          dashboardService.getTodayRevenueSummary(storeId).catch((e) => {
            logger.error('[Dashboard] getTodayRevenueSummary failed:', e);
            return null;
          }),
          dashboardService.getTopItemsToday(storeId, 3).catch((e) => {
            logger.error('[Dashboard] getTopItemsToday failed:', e);
            return [];
          }),
          dashboardService.getCampaignPerformance(storeId).catch((e) => {
            logger.error('[Dashboard] getCampaignPerformance failed:', e);
            return [];
          }),
          dashboardService.getCustomerRetentionMetrics(storeId).catch((e) => {
            logger.error('[Dashboard] getCustomerRetentionMetrics failed:', e);
            return null;
          }),
          dashboardService.getBasketSizeTrend(storeId).catch((e) => {
            logger.error('[Dashboard] getBasketSizeTrend failed:', e);
            return null;
          }),
          dashboardService.getHealthScore(storeId).catch((e) => {
            logger.error('[Dashboard] getHealthScore failed:', e);
            return null;
          }),
          dashboardService.getCampaignRecommendations(storeId, 2).catch((e) => {
            logger.error('[Dashboard] getCampaignRecommendations failed:', e);
            return [];
          }),
        ]);

        setCustomerPayments(cpData.payments || []);
        setStorePerformance(spData.stores || []);
        setActionItems(aiData.actionItems || []);
        setTodayRevenue(todayRevData);
        setTopItemsToday(topItemsData || []);
        setCampaignPerformance(campaignData || []);
        setCustomerRetention(retentionData);
        setBasketTrend(basketData);
        setHealthData(healthRes);
        setRecommendations(recRes);

        // Build alert banners from real data
        const alerts: Notification[] = [];
        const dm = dashboardData.metrics;
        if (dm) {
          if ((dm.lowStockProducts ?? 0) > 0) {
            alerts.push({
              id: 'low-stock',
              type: 'warning',
              title: 'Low Stock',
              message: `${dm.lowStockProducts} products are running low`,
              count: dm.lowStockProducts,
            });
          }
          if ((dm.pendingOrders ?? 0) > 0) {
            alerts.push({
              id: 'pending-orders',
              type: 'info',
              title: 'Pending Orders',
              message: `${dm.pendingOrders} orders awaiting action`,
              count: dm.pendingOrders,
            });
          }
          if ((dm.pendingCashback ?? 0) > 0) {
            alerts.push({
              id: 'pending-cashback',
              type: 'info',
              title: 'Pending Cashback',
              message: `₹${dm.pendingCashback.toLocaleString()} in cashback requests`,
              count: dm.pendingCashback,
            });
          }
        }
        if (alerts.length === 0) {
          alerts.push({
            id: 'all-clear',
            type: 'success',
            title: 'All Clear',
            message: 'Everything looks great!',
            count: 0,
          });
        }
        setNotifications(alerts);
      } catch (error: unknown) {
        const msg =
          error instanceof Error ? error.message : 'Something went wrong loading the dashboard.';
        logger.error('Error fetching dashboard data:', error);
        setDashboardError(msg);
        setMetrics({
          totalRevenue: 0,
          monthlyRevenue: 0,
          revenueGrowth: 0,
          averageOrderValue: 0,
          totalOrders: 0,
          monthlyOrders: 0,
          ordersGrowth: 0,
          pendingOrders: 0,
          completedOrders: 0,
          totalProducts: 0,
          activeProducts: 0,
          lowStockProducts: 0,
          totalCustomers: 0,
          monthlyCustomers: 0,
          customerGrowth: 0,
          totalCashbackPaid: 0,
          pendingCashback: 0,
          profitMargin: 0,
        });
        setOverview({ totalProducts: 0, totalOrders: 0, pendingOrders: 0, pendingCashback: 0 });
      } finally {
        setIsLoading(false);
        setRefreshing(false);
        fetchInFlightRef.current = false;
      }
    },
    [activeStore]
  );

  // ── Effects ────────────────────────────────────────────────────────────────

  // Cashier/staff role redirects to POS
  useEffect(() => {
    const role = authState?.role;
    if (role === 'cashier' || role === 'staff') {
      router.replace('/pos');
    }
  }, [authState?.role]);

  // Initial fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Real-time metric pushes
  useEffect(() => {
    if (!realTime.dashboardData) return;
    const { metrics: rtMetrics, overview: rtOverview } = realTime.dashboardData;
    if (rtMetrics) {
      setMetrics((prev) =>
        prev
          ? {
              ...prev,
              totalRevenue: rtMetrics.totalRevenue ?? prev.totalRevenue,
              monthlyRevenue: rtMetrics.monthlyRevenue ?? prev.monthlyRevenue,
              revenueGrowth: rtMetrics.revenueGrowth ?? prev.revenueGrowth,
              averageOrderValue: rtMetrics.averageOrderValue ?? prev.averageOrderValue,
              totalOrders: rtMetrics.totalOrders ?? prev.totalOrders,
              monthlyOrders: rtMetrics.monthlyOrders ?? prev.monthlyOrders,
              ordersGrowth: rtMetrics.ordersGrowth ?? prev.ordersGrowth,
              pendingOrders: rtMetrics.pendingOrders ?? prev.pendingOrders,
              completedOrders: rtMetrics.completedOrders ?? prev.completedOrders,
              totalProducts: rtMetrics.totalProducts ?? prev.totalProducts,
              activeProducts: rtMetrics.activeProducts ?? prev.activeProducts,
              lowStockProducts: rtMetrics.lowStockProducts ?? prev.lowStockProducts,
              totalCustomers: rtMetrics.totalCustomers ?? prev.totalCustomers,
              monthlyCustomers: rtMetrics.monthlyCustomers ?? prev.monthlyCustomers,
              customerGrowth: rtMetrics.customerGrowth ?? prev.customerGrowth,
              totalCashbackPaid: rtMetrics.totalCashbackPaid ?? prev.totalCashbackPaid,
              pendingCashback: rtMetrics.pendingCashback ?? prev.pendingCashback,
              profitMargin: rtMetrics.profitMargin ?? prev.profitMargin,
            }
          : prev
      );
    }
    if (rtOverview) {
      setOverview((prev) =>
        prev
          ? {
              ...prev,
              pendingOrders: rtOverview.quickStats?.pendingOrders ?? prev.pendingOrders,
              pendingCashback: rtOverview.quickStats?.pendingCashback ?? prev.pendingCashback,
            }
          : prev
      );
    }
  }, [realTime.dashboardData]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleRefresh = useCallback(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  // ── Formatters ─────────────────────────────────────────────────────────────

  const formatCurrency = useCallback((amount: number) => `₹${(amount ?? 0).toFixed(2)}`, []);
  const formatPercentage = useCallback(
    (value: number) => `${(value ?? 0) > 0 ? '+' : ''}${(value ?? 0).toFixed(1)}%`,
    []
  );
  const formatNumber = useCallback((value: number) => (value ?? 0).toLocaleString(), []);

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    metrics,
    overview,
    notifications,
    isLoading,
    refreshing,
    dashboardError,
    customerPayments,
    storePerformance,
    actionItems,
    todayRevenue,
    topItemsToday,
    campaignPerformance,
    customerRetention,
    basketTrend,
    healthData,
    recommendations,
    fetchDashboardData,
    handleRefresh,
    formatCurrency,
    formatPercentage,
    formatNumber,
  };
}
