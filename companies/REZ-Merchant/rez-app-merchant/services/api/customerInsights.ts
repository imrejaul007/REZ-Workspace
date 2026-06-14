import { apiClient } from './client';

export interface CustomerProfile {
  userId: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  visitCount: number;
  totalSpend: number;
  lastVisitDate?: string;
  isFirstVisit: boolean;
  createdAt: string;
  storeId: string;
}

export interface TopCustomer {
  customerId: string;
  email: string;
  totalPurchases: number;
  totalSpent: number;
  averageOrderValue: number;
  estimatedLTV: number;
  segment: string;
  nextPredictedPurchase: string | null;
}

export interface CustomerSummaryStats {
  /** Percentage of customers who placed more than one order */
  repeatVisitRate: number;
  /** Average order value across all customers at this store */
  averageOrderValue: number;
  /** Top N customers ranked by lifetime spend */
  topCustomers: TopCustomer[];
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  retentionRate: number;
  churnRate: number;
  averageLTV: number;
}

export const customerInsightsService = {
  async getProfile(userId: string): Promise<{ data: CustomerProfile }> {
    try {
      const response = await apiClient.get<CustomerProfile>(
        `merchant/customer-insights/${userId}/profile`
      );
      if (response.success && response.data) {
        return { data: response.data };
      }
      throw new Error(response.error || 'Failed to get customer profile');
    } catch (error) {
      if (__DEV__) console.error('Get customer profile error:', error);
      throw new Error(error.message || 'Failed to get customer profile');
    }
  },

  /**
   * GET /api/merchant/analytics/customers/insights
   *
   * Returns top customers (by LTV), repeat visit rate, average order value,
   * retention/churn metrics and customer segments for the active store.
   */
  async getCustomerSummary(params?: {
    storeId?: string;
    preset?: '7d' | '30d' | '90d' | '1y';
  }): Promise<CustomerSummaryStats> {
    try {
      const qs = new URLSearchParams();
      if (params?.storeId) qs.set('storeId', params.storeId);
      if (params?.preset) qs.set('preset', params.preset);

      const url = `merchant/analytics/customers/insights${qs.toString() ? `?${qs}` : ''}`;
      const response = await apiClient.get<unknown>(url);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch customer summary');
      }

      const d = response.data;

      // Map the analytics route response shape → CustomerSummaryStats
      const repeatVisitRate: number = d.retention?.repeatCustomerRate ?? 0;
      const avgOrderValue: number =
        d.summary?.avgOrdersPerCustomer > 0
          ? Math.round((d.summary.avgSpendPerCustomer / d.summary.avgOrdersPerCustomer) * 100) / 100
          : (d.summary?.avgSpendPerCustomer ?? 0);

      return {
        repeatVisitRate,
        averageOrderValue: avgOrderValue,
        topCustomers: d.ltv?.ltv90Days ?? [],
        totalCustomers: d.totalCustomers ?? 0,
        activeCustomers: d.activeCustomers ?? 0,
        newCustomers: d.newCustomers ?? 0,
        retentionRate: d.retention?.overallRetentionRate ?? 0,
        churnRate: d.churn?.churnRate ?? 0,
        averageLTV: d.ltv?.averageLTV ?? 0,
      };
    } catch (error) {
      if (__DEV__) console.error('getCustomerSummary error:', error);
      throw new Error(error.message || 'Failed to fetch customer summary');
    }
  },

  async getTopCustomers(storeId?: string, limit = 10): Promise<TopCustomer[]> {
    const summary = await this.getCustomerSummary({ storeId });
    return summary.topCustomers.slice(0, limit);
  },

  async getRepeatVisitRate(storeId?: string): Promise<number> {
    const summary = await this.getCustomerSummary({ storeId });
    return summary.repeatVisitRate;
  },

  async getAverageOrderValue(storeId?: string): Promise<number> {
    const summary = await this.getCustomerSummary({ storeId });
    return summary.averageOrderValue;
  },
};

export default customerInsightsService;
