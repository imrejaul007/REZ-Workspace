// C1 FIX: removed buildApiUrl + storageService — all HTTP calls now go through
// apiClient so token refresh, interceptors, and cookie handling are centralised.
import { apiClient } from './client';

type AnyRecord = Record<string, unknown>;

const asNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const extractResponseData = <T>(response: { success?: boolean; data?: T; message?: string }): T => {
  if (response.success && response.data !== undefined) return response.data;
  throw new Error(response.message || 'Request failed');
};

const normalizeMetrics = (raw: AnyRecord = {}): DashboardMetrics => {
  const revenue = raw.revenue || {};
  const orders = raw.orders || {};
  const products = raw.products || {};
  const customers = raw.customers || {};
  const cashback = raw.cashback || {};

  return {
    revenue: {
      total: asNumber(revenue.total ?? revenue.value ?? raw.totalRevenue),
      trend: asNumber(revenue.trend ?? revenue.change ?? raw.revenueGrowth),
      change: asNumber(revenue.change ?? revenue.trend ?? raw.revenueGrowth),
    },
    orders: {
      total: asNumber(orders.total ?? orders.value ?? raw.totalOrders),
      pending: asNumber(orders.pending ?? raw.pendingOrders),
      completed: asNumber(orders.completed ?? raw.completedOrders),
      cancelled: asNumber(orders.cancelled ?? raw.cancelledOrders),
      trend: asNumber(orders.trend ?? orders.change ?? raw.ordersGrowth),
    },
    products: {
      total: asNumber(products.total ?? products.value ?? raw.totalProducts),
      active: asNumber(products.active ?? raw.activeProducts),
      lowStock: asNumber(products.lowStock ?? raw.lowStockProducts),
      outOfStock: asNumber(products.outOfStock ?? raw.outOfStockProducts),
    },
    customers: {
      total: asNumber(customers.total ?? customers.value ?? raw.totalCustomers),
      newToday: asNumber(customers.newToday ?? customers.new ?? raw.monthlyCustomers),
      trend: asNumber(customers.trend ?? customers.change ?? raw.customerGrowth),
    },
    cashback: {
      totalPending: asNumber(
        cashback.totalPending ?? cashback.pendingAmount ?? raw.pendingCashback
      ),
      totalPaid: asNumber(cashback.totalPaid ?? cashback.totalAmount ?? raw.totalCashbackPaid),
      requests: asNumber(cashback.requests ?? cashback.totalRequests ?? cashback.pendingRequests),
    },
  };
};

const normalizeTodayRevenueMetrics = (raw: AnyRecord = {}): TodayRevenueMetrics => {
  if ('totalGMV' in raw || 'merchantEarnings' in raw || 'vsYesterday' in raw) {
    return {
      totalGMV: asNumber(raw.totalGMV),
      totalOrders: asNumber(raw.totalOrders),
      ordersLastDay: asNumber(raw.ordersLastDay ?? raw.vsYesterday?.orders),
      ordersChange: asNumber(raw.ordersChange ?? raw.vsYesterday?.orders),
      merchantEarnings: asNumber(raw.merchantEarnings ?? raw.totalGMV),
      commissionRate: asNumber(raw.commissionRate),
      vsYesterday: {
        gmv: asNumber(raw.vsYesterday?.gmv),
        orders: asNumber(raw.vsYesterday?.orders),
        change: asNumber(raw.vsYesterday?.change),
        percentChange: asNumber(raw.vsYesterday?.percentChange),
      },
    };
  }

  const totalGMV = asNumber(raw.totalRevenue ?? raw.revenue);
  const totalOrders = asNumber(raw.orderCount ?? raw.orders);

  return {
    totalGMV,
    totalOrders,
    ordersLastDay: 0,
    ordersChange: 0,
    merchantEarnings: asNumber(raw.merchantPayout ?? totalGMV),
    commissionRate: asNumber(raw.commissionRate),
    vsYesterday: {
      gmv: asNumber(raw.yesterdayRevenue),
      orders: asNumber(raw.yesterdayOrders),
      change: asNumber(raw.change),
      percentChange: asNumber(raw.percentChange),
    },
  };
};

const normalizeCustomerRetentionMetrics = (raw: AnyRecord = {}): CustomerRetentionMetrics => {
  if ('returningCustomersToday' in raw || 'weeklyReturnRate' in raw) {
    return {
      returningCustomersToday: asNumber(raw.returningCustomersToday),
      totalCustomersToday: asNumber(raw.totalCustomersToday),
      returnRatePercent: asNumber(raw.returnRatePercent),
      weeklyReturnRate: asNumber(raw.weeklyReturnRate),
    };
  }

  const returningCustomersToday = asNumber(raw.repeatCustomers);
  const newCustomers = asNumber(raw.newCustomers);
  const totalCustomersToday = asNumber(
    raw.totalCustomersToday ?? returningCustomersToday + newCustomers
  );
  const rate = asNumber(raw.returnRatePercent ?? raw.retentionRate);

  return {
    returningCustomersToday,
    totalCustomersToday,
    returnRatePercent: rate,
    weeklyReturnRate: asNumber(raw.weeklyReturnRate ?? rate),
  };
};

const normalizeBasketSizeTrend = (raw: AnyRecord | AnyRecord[] = {}): BasketSizeTrend => {
  if (Array.isArray(raw)) {
    const points = raw.map((item) => asNumber(item.avgBasket ?? item.averageBasket));
    const thisWeek = points.slice(-7);
    const lastWeek = points.slice(-14, -7);
    const avg = (values: number[]) =>
      values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
    const thisWeekAvg = avg(thisWeek);
    const lastWeekAvg = avg(lastWeek);
    const change = thisWeekAvg - lastWeekAvg;

    return {
      thisWeekAvg,
      lastWeekAvg,
      change,
      percentChange: lastWeekAvg > 0 ? (change / lastWeekAvg) * 100 : 0,
      isDecline: change < 0,
    };
  }

  return {
    thisWeekAvg: asNumber(raw.thisWeekAvg),
    lastWeekAvg: asNumber(raw.lastWeekAvg),
    change: asNumber(raw.change),
    percentChange: asNumber(raw.percentChange),
    isDecline: Boolean(raw.isDecline),
  };
};

const normalizeStorePerformanceResponse = (payload): StorePerformanceResponse => {
  if (Array.isArray(payload)) {
    return {
      stores: payload as StorePerformance[],
      summary: {
        totalStores: payload.length,
        activeStores: payload.filter((store) => store.isActive).length,
        totalMonthlyRevenue: payload.reduce(
          (sum: number, store) => sum + asNumber(store.monthlyRevenue),
          0
        ),
        totalMonthlyOrders: payload.reduce(
          (sum: number, store) => sum + asNumber(store.monthlyOrders),
          0
        ),
        totalPendingOrders: payload.reduce(
          (sum: number, store) => sum + asNumber(store.pendingOrders),
          0
        ),
      },
    };
  }

  return {
    stores: Array.isArray(payload?.stores) ? payload.stores : [],
    summary: {
      totalStores: asNumber(payload?.summary?.totalStores ?? payload?.stores?.length),
      activeStores: asNumber(payload?.summary?.activeStores),
      totalMonthlyRevenue: asNumber(payload?.summary?.totalMonthlyRevenue),
      totalMonthlyOrders: asNumber(payload?.summary?.totalMonthlyOrders),
      totalPendingOrders: asNumber(payload?.summary?.totalPendingOrders),
    },
  };
};

export interface DashboardMetrics {
  revenue: {
    total: number;
    trend: number;
    change: number;
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
    trend: number;
  };
  products: {
    total: number;
    active: number;
    lowStock: number;
    outOfStock: number;
  };
  customers: {
    total: number;
    newToday: number;
    trend: number;
  };
  cashback: {
    totalPending: number;
    totalPaid: number;
    requests: number;
  };
}

export interface RecentActivity {
  type: 'order' | 'product' | 'cashback' | 'review';
  title: string;
  description: string;
  timestamp: string;
  metadata?;
}

export interface TopProduct {
  productId: string;
  name: string;
  sales: number;
  revenue: number;
  image?: string;
}

export interface SalesData {
  date: string;
  amount: number;
  orders: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  recentActivity: RecentActivity[];
  topProducts: TopProduct[];
  salesData: SalesData[];
  lowStockAlerts: Array<{
    productId: string;
    name: string;
    currentStock: number;
    threshold: number;
  }>;
}

export interface StorePerformance {
  storeId: string;
  name: string;
  logo: string | null;
  slug: string;
  isActive: boolean;
  rating: number;
  ratingCount: number;
  category: string;
  location: string;
  cashbackPercent: number;
  monthlyOrders: number;
  monthlyRevenue: number;
  monthlyPayout: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  avgOrderValue: number;
  uniqueCustomers: number;
  todayOrders: number;
  todayRevenue: number;
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  pendingCashbackCount: number;
  pendingCashbackAmount: number;
}

export interface StorePerformanceResponse {
  stores: StorePerformance[];
  summary: {
    totalStores: number;
    activeStores: number;
    totalMonthlyRevenue: number;
    totalMonthlyOrders: number;
    totalPendingOrders: number;
  };
}

export interface ActionItem {
  id: string;
  type: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  storeName: string;
  storeId: string;
  count: number;
  deepLink: string;
  icon: string;
  color: string;
}

export interface ActionItemsResponse {
  actionItems: ActionItem[];
  summary: {
    total: number;
    urgent: number;
    high: number;
    medium: number;
  };
}

export interface CustomerPayment {
  type: 'order' | 'store_payment';
  id: string;
  orderNumber: string | null;
  customerName: string;
  customerPhone: string;
  customerImage: string | null;
  storeName: string;
  storeId: string;
  amount: number;
  merchantPayout: number;
  paymentMethod: string;
  coinsUsed: number;
  status: string;
  fulfillmentType: string;
  createdAt: string;
}

// LI WEI: merchant ROI — today's revenue metrics for dashboard visibility
export interface TodayRevenueMetrics {
  totalGMV: number;
  totalOrders: number;
  ordersLastDay: number;
  ordersChange: number;
  merchantEarnings: number;
  commissionRate: number;
  vsYesterday: {
    gmv: number;
    orders: number;
    change: number;
    percentChange: number;
  };
}

// LI WEI: merchant ROI — top performing items for understanding revenue drivers
export interface TopItemToday {
  productId: string;
  name: string;
  orderCount: number;
  totalRevenue: number;
  imageUrl?: string;
  // Legacy / API-response field aliases for backward compat
  _id?: string;
  product?: string;
  qty?: number;
  quantity?: number;
  revenue?: number;
  image?: string;
}

// LI WEI: merchant ROI — campaign performance with revenue attribution
export interface CampaignPerformance {
  campaignId: string;
  campaignName: string;
  type: string;
  status: string;
  attributedRevenue: number;
  customersReached: number;
  conversionRate: number;
  roi: number;
  startDate: string;
  endDate?: string;
}

// LI WEI: merchant ROI — customer return rate and retention
export interface CustomerRetentionMetrics {
  returningCustomersToday: number;
  totalCustomersToday: number;
  returnRatePercent: number;
  weeklyReturnRate: number;
}

// LI WEI: merchant ROI — average basket size trends
export interface BasketSizeTrend {
  thisWeekAvg: number;
  lastWeekAvg: number;
  change: number;
  percentChange: number;
  isDecline: boolean;
}

export interface CustomerPaymentsResponse {
  payments: CustomerPayment[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

class DashboardService {
  // Get complete dashboard data
  async getDashboardData(storeId?: string): Promise<DashboardData> {
    try {
      const endpoint = storeId ? `merchant/dashboard?storeId=${storeId}` : 'merchant/dashboard';
      const response = await apiClient.get<DashboardData>(endpoint);
      return extractResponseData(response);
    } catch (error) {
      if (__DEV__) console.error('Get dashboard data error:', error);
      throw new Error(error.message || 'Failed to get dashboard data');
    }
  }

  // Get metrics only
  async getMetrics(storeId?: string): Promise<DashboardMetrics> {
    try {
      const endpoint = storeId
        ? `merchant/dashboard/metrics?storeId=${storeId}`
        : 'merchant/dashboard/metrics';
      const response = await apiClient.get<AnyRecord>(endpoint);
      return normalizeMetrics(extractResponseData(response));
    } catch (error) {
      if (__DEV__) console.error('Get metrics error:', error);
      throw new Error(error.message || 'Failed to get metrics');
    }
  }

  // Get recent activity
  async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    try {
      const response = await apiClient.get<RecentActivity[]>(
        `merchant/dashboard/activity?limit=${limit}`
      );
      return extractResponseData(response);
    } catch (error) {
      if (__DEV__) console.error('Get recent activity error:', error);
      throw new Error(error.message || 'Failed to get recent activity');
    }
  }

  // Get top products
  async getTopProducts(
    limit: number = 10,
    period: '7d' | '30d' | '90d' = '30d'
  ): Promise<TopProduct[]> {
    try {
      const response = await apiClient.get<TopProduct[]>(
        `merchant/dashboard/top-products?limit=${limit}&period=${period}`
      );
      return extractResponseData(response);
    } catch (error) {
      if (__DEV__) console.error('Get top products error:', error);
      throw new Error(error.message || 'Failed to get top products');
    }
  }

  // Get sales data for chart
  async getSalesData(period: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<SalesData[]> {
    try {
      const response = await apiClient.get<SalesData[]>(
        `merchant/dashboard/sales-data?period=${period}`
      );
      return extractResponseData(response);
    } catch (error) {
      if (__DEV__) console.error('Get sales data error:', error);
      throw new Error(error.message || 'Failed to get sales data');
    }
  }

  // Get low stock alerts
  async getLowStockAlerts(): Promise<
    Array<{ productId: string; name: string; currentStock: number; threshold: number }>
  > {
    try {
      const response = await apiClient.get<
        Array<{ productId: string; name: string; currentStock: number; threshold: number }>
      >('merchant/dashboard/low-stock');
      return extractResponseData(response);
    } catch (error) {
      if (__DEV__) console.error('Get low stock alerts error:', error);
      throw new Error(error.message || 'Failed to get low stock alerts');
    }
  }

  // Get all dashboard data including overview - returns data in format expected by dashboard component
  async getAllDashboardData(storeId?: string): Promise<{
    metrics?: {
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
    };
    overview?: {
      quickStats?: {
        totalProducts: number;
        totalOrders: number;
        pendingOrders: number;
        pendingCashback: number;
      };
      recentActivity?: {
        orders?: unknown[];
        products?: unknown[];
      };
    };
  }> {
    try {
      const dashboardEndpoint = storeId
        ? `merchant/dashboard?storeId=${storeId}`
        : 'merchant/dashboard';
      const overviewEndpoint = storeId
        ? `merchant/dashboard/overview?storeId=${storeId}`
        : 'merchant/dashboard/overview';

      // Fetch both in parallel via apiClient
      const [dashboardResp, overviewResp] = await Promise.allSettled([
        apiClient.get<unknown>(dashboardEndpoint),
        apiClient.get<unknown>(overviewEndpoint),
      ]);

      const dashboardData =
        dashboardResp.status === 'fulfilled' && dashboardResp.value.success
          ? dashboardResp.value.data
          : null;
      const overview =
        overviewResp.status === 'fulfilled' && overviewResp.value.success
          ? overviewResp.value.data
          : null;

      // Transform dashboard data to match expected format
      const normalizedMetrics = dashboardData?.metrics
        ? normalizeMetrics(dashboardData.metrics)
        : dashboardData
          ? normalizeMetrics(dashboardData)
          : null;

      const metrics = normalizedMetrics
        ? {
            totalRevenue: normalizedMetrics.revenue.total,
            monthlyRevenue: asNumber(
              dashboardData?.metrics?.monthlyRevenue ?? dashboardData?.monthlyRevenue
            ),
            revenueGrowth: normalizedMetrics.revenue.change,
            averageOrderValue: asNumber(
              dashboardData?.metrics?.averageOrderValue ?? dashboardData?.averageOrderValue
            ),
            totalOrders: normalizedMetrics.orders.total,
            monthlyOrders: asNumber(
              dashboardData?.metrics?.monthlyOrders ?? dashboardData?.monthlyOrders
            ),
            ordersGrowth: normalizedMetrics.orders.trend,
            pendingOrders: normalizedMetrics.orders.pending,
            completedOrders: normalizedMetrics.orders.completed,
            totalProducts: normalizedMetrics.products.total,
            activeProducts: normalizedMetrics.products.active,
            lowStockProducts: normalizedMetrics.products.lowStock,
            totalCustomers: normalizedMetrics.customers.total,
            monthlyCustomers: asNumber(
              dashboardData?.metrics?.monthlyCustomers ?? dashboardData?.monthlyCustomers
            ),
            customerGrowth: normalizedMetrics.customers.trend,
            totalCashbackPaid: normalizedMetrics.cashback.totalPaid,
            pendingCashback: normalizedMetrics.cashback.totalPending,
            profitMargin: asNumber(
              dashboardData?.metrics?.profitMargin ?? dashboardData?.profitMargin
            ),
          }
        : undefined;

      return {
        metrics,
        overview,
      };
    } catch (error) {
      if (__DEV__) console.error('Get all dashboard data error:', error);
      // Return empty data structure on error
      return {
        metrics: {
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
        },
        overview: {
          quickStats: {
            totalProducts: 0,
            totalOrders: 0,
            pendingOrders: 0,
            pendingCashback: 0,
          },
        },
      };
    }
  }

  // Get customer payments with details for dashboard feed
  async getCustomerPayments(
    storeId?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<CustomerPaymentsResponse> {
    try {
      const params = new URLSearchParams();
      if (storeId) params.append('storeId', storeId);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const data = await apiClient.get<CustomerPaymentsResponse>(
        `merchant/dashboard/customer-payments?${params.toString()}`
      );
      if (data.success && data.data) {
        const payload: unknown = data.data;
        if (Array.isArray(payload)) {
          return {
            payments: payload,
            pagination: {
              currentPage: page,
              totalPages: 1,
              totalItems: payload.length,
              hasNextPage: false,
              hasPrevPage: page > 1,
            },
          };
        }
        return payload;
      }
      throw new Error(data.message || 'Failed to get customer payments');
    } catch (error) {
      if (__DEV__) console.error('Get customer payments error:', error);
      return {
        payments: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }
  }

  // Get per-store performance breakdown
  async getStorePerformance(): Promise<StorePerformanceResponse> {
    try {
      const response = await apiClient.get<StorePerformanceResponse>(
        'merchant/dashboard/store-performance'
      );
      const data = extractResponseData<StorePerformanceResponse>(response);
      return normalizeStorePerformanceResponse(data);
    } catch (error) {
      if (__DEV__) console.error('Get store performance error:', error);
      return {
        stores: [],
        summary: {
          totalStores: 0,
          activeStores: 0,
          totalMonthlyRevenue: 0,
          totalMonthlyOrders: 0,
          totalPendingOrders: 0,
        },
      };
    }
  }

  // Get action items / to-do list for merchant
  async getActionItems(storeId?: string): Promise<ActionItemsResponse> {
    try {
      const params = new URLSearchParams();
      if (storeId) params.append('storeId', storeId);
      const data = await apiClient.get<ActionItemsResponse>(
        `merchant/dashboard/action-items?${params.toString()}`
      );
      if (data.success && data.data) {
        const payload: unknown = data.data;
        if (Array.isArray(payload)) {
          return {
            actionItems: payload,
            summary: {
              total: payload.length,
              urgent: payload.filter((item) => item.priority === 'urgent').length,
              high: payload.filter((item) => item.priority === 'high').length,
              medium: payload.filter((item) => item.priority === 'medium').length,
            },
          };
        }
        return payload;
      }
      throw new Error(data.message || 'Failed to get action items');
    } catch (error) {
      if (__DEV__) console.error('Get action items error:', error);
      return { actionItems: [], summary: { total: 0, urgent: 0, high: 0, medium: 0 } };
    }
  }

  // LI WEI: merchant ROI — fetch today's revenue summary with vs yesterday comparison
  async getTodayRevenueSummary(storeId?: string): Promise<TodayRevenueMetrics> {
    try {
      const params = new URLSearchParams();
      if (storeId) params.append('storeId', storeId);
      const response = await apiClient.get<AnyRecord>(
        `merchant/dashboard/today-revenue?${params.toString()}`
      );
      return normalizeTodayRevenueMetrics(extractResponseData(response));
    } catch (error) {
      if (__DEV__) console.error('Get today revenue error:', error);
      return {
        totalGMV: 0,
        totalOrders: 0,
        ordersLastDay: 0,
        ordersChange: 0,
        merchantEarnings: 0,
        commissionRate: 0,
        vsYesterday: { gmv: 0, orders: 0, change: 0, percentChange: 0 },
      };
    }
  }

  // LI WEI: merchant ROI — fetch top 3 items ordered today
  async getTopItemsToday(storeId?: string, limit: number = 3): Promise<TopItemToday[]> {
    try {
      const params = new URLSearchParams();
      if (storeId) params.append('storeId', storeId);
      params.append('limit', limit.toString());
      const data = await apiClient.get<TopItemToday[]>(
        `merchant/dashboard/top-items-today?${params.toString()}`
      );
      if (data.success && Array.isArray(data.data)) {
        return data.data.map((item) => ({
          productId: item.productId || item._id || item.product || item.name,
          name: item.name || 'Unnamed item',
          orderCount: item.orderCount || item.qty || item.quantity || 0,
          totalRevenue: item.totalRevenue || item.revenue || 0,
          imageUrl: item.imageUrl || item.image || undefined,
        }));
      }
      throw new Error(data.message || 'Failed to get top items');
    } catch (error) {
      if (__DEV__) console.error('Get top items error:', error);
      return [];
    }
  }

  // LI WEI: merchant ROI — fetch campaign performance with revenue attribution
  async getCampaignPerformance(storeId?: string): Promise<CampaignPerformance[]> {
    try {
      const params = new URLSearchParams();
      if (storeId) params.append('storeId', storeId);
      const data = await apiClient.get<CampaignPerformance[]>(
        `merchant/dashboard/campaign-performance?${params.toString()}`
      );
      if (data.success && data.data) {
        const payload: unknown = data.data;
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload.campaigns)) return payload.campaigns;
      }
      throw new Error(data.message || 'Failed to get campaign performance');
    } catch (error) {
      if (__DEV__) console.error('Get campaign performance error:', error);
      return [];
    }
  }

  // LI WEI: merchant ROI — fetch customer retention metrics (return rate)
  async getCustomerRetentionMetrics(storeId?: string): Promise<CustomerRetentionMetrics> {
    try {
      const params = new URLSearchParams();
      if (storeId) params.append('storeId', storeId);
      const response = await apiClient.get<AnyRecord>(
        `merchant/dashboard/customer-retention?${params.toString()}`
      );
      return normalizeCustomerRetentionMetrics(extractResponseData(response));
    } catch (error) {
      if (__DEV__) console.error('Get retention metrics error:', error);
      return {
        returningCustomersToday: 0,
        totalCustomersToday: 0,
        returnRatePercent: 0,
        weeklyReturnRate: 0,
      };
    }
  }

  // LI WEI: merchant ROI — fetch average basket size trend (this week vs last week)
  async getBasketSizeTrend(storeId?: string): Promise<BasketSizeTrend> {
    try {
      const params = new URLSearchParams();
      if (storeId) params.append('storeId', storeId);
      const response = await apiClient.get<AnyRecord | AnyRecord[]>(
        `merchant/dashboard/basket-size-trend?${params.toString()}`
      );
      return normalizeBasketSizeTrend(extractResponseData(response));
    } catch (error) {
      if (__DEV__) console.error('Get basket size trend error:', error);
      return { thisWeekAvg: 0, lastWeekAvg: 0, change: 0, percentChange: 0, isDecline: false };
    }
  }

  async getHealthScore(storeId?: string): Promise<unknown> {
    try {
      const response = await apiClient.get<unknown>('merchant/analytics/health-score', {
        params: storeId ? { storeId } : undefined,
      });
      return extractResponseData(response);
    } catch (error) {
      if (__DEV__) console.error('Get health score error:', error);
      return null;
    }
  }

  async getCampaignRecommendations(storeId?: string, limit: number = 2): Promise<unknown[]> {
    try {
      const response = await apiClient.get<unknown>('merchant/campaign-recommendations', {
        params: { ...(storeId ? { storeId } : {}), limit },
      });
      const payload = extractResponseData<unknown>(response);
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.items)) return payload.items;
      if (Array.isArray(payload?.recommendations)) return payload.recommendations;
      return [];
    } catch (error) {
      if (__DEV__) console.error('Get campaign recommendations error:', error);
      return [];
    }
  }
  async getRendezBookings(storeId?: string): Promise<{
    total: number;
    totalRevenuePaise: number;
    pending: number;
  } | null> {
    try {
      const response = await apiClient.get<unknown>('merchant/dashboard/rendez-bookings', {
        params: storeId ? { storeId } : undefined,
      });
      return extractResponseData(response);
    } catch (error) {
      if (__DEV__) console.error('Get rendez bookings error:', error);
      return null;
    }
  }
}

// Create and export singleton instance
export const dashboardService = new DashboardService();
export default dashboardService;
