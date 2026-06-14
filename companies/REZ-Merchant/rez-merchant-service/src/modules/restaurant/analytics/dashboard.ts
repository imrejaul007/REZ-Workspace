/**
 * ReZ Restaurant OS - Analytics Dashboard Module
 */

export interface Dashboard {
  today: {
    revenue: number;
    orders: number;
    customers: number;
    avgOrderValue: number;
  };
  trends: {
    revenue: number;    // % change
    orders: number;
    customers: number;
  };
  topItems: { name: string; quantity: number; revenue: number }[];
  peakHours: { hour: number; orders: number }[];
}

export class RestaurantAnalytics {
  /**
   * Get dashboard overview
   */
  async getDashboard(storeId: string): Promise<Dashboard> {
    const today = await this.getTodayMetrics(storeId);
    const yesterday = await this.getYesterdayMetrics(storeId);

    return {
      today: {
        revenue: today.totalRevenue,
        orders: today.orderCount,
        customers: today.customerCount,
        avgOrderValue: today.totalRevenue / today.orderCount
      },
      trends: {
        revenue: this.calcChange(today.totalRevenue, yesterday.totalRevenue),
        orders: this.calcChange(today.orderCount, yesterday.orderCount),
        customers: this.calcChange(today.customerCount, yesterday.customerCount)
      },
      topItems: await this.getTopSellingItems(storeId),
      peakHours: await this.getPeakHours(storeId)
    };
  }

  /**
   * Get revenue report
   */
  async getRevenueReport(storeId: string, period: 'today' | 'week' | 'month' | 'year'): Promise<{
    total: number;
    byDay: { date: string; revenue: number }[];
    byCategory: Record<string, number>;
  }> {
    return {
      total: 50000,
      byDay: [
        { date: '2026-05-01', revenue: 45000 },
        { date: '2026-05-02', revenue: 52000 },
        { date: '2026-05-03', revenue: 48000 }
      ],
      byCategory: {
        'Main Course': 25000,
        'Beverages': 10000,
        'Desserts': 5000,
        'Appetizers': 10000
      }
    };
  }

  /**
   * Get customer insights
   */
  async getCustomerInsights(storeId: string): Promise<{
    newCustomers: number;
    returningCustomers: number;
    avgVisits: number;
    topCustomers: { name: string; visits: number; revenue: number }[];
  }> {
    return {
      newCustomers: 45,
      returningCustomers: 120,
      avgVisits: 3.2,
      topCustomers: [
        { name: 'Rahul S', visits: 15, revenue: 12500 },
        { name: 'Priya M', visits: 12, revenue: 9800 }
      ]
    };
  }

  /**
   * Get real-time metrics
   */
  async getRealTimeMetrics(storeId: string): Promise<{
    activeOrders: number;
    tablesOccupied: number;
    kitchenLoad: number;
    avgPrepTime: number;
  }> {
    return {
      activeOrders: 12,
      tablesOccupied: 15,
      kitchenLoad: 65, // %
      avgPrepTime: 18 // minutes
    };
  }

  /**
   * Get comparison report
   */
  async comparePeriods(storeId: string, period1: string, period2: string): Promise<{
    revenueChange: number;
    orderChange: number;
    customerChange: number;
  }> {
    return {
      revenueChange: 12.5,
      orderChange: 8.3,
      customerChange: 5.1
    };
  }

  private async getTodayMetrics(storeId: string): Promise<unknown> {
    return {
      totalRevenue: 52000,
      orderCount: 145,
      customerCount: 98
    };
  }

  private async getYesterdayMetrics(storeId: string): Promise<unknown> {
    return {
      totalRevenue: 48000,
      orderCount: 132,
      customerCount: 92
    };
  }

  private calcChange(current: number, previous: number): number {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  private async getTopSellingItems(storeId: string): Promise<unknown[]> {
    return [
      { name: 'Butter Chicken', quantity: 85, revenue: 16915 },
      { name: 'Garlic Naan', quantity: 120, revenue: 9600 },
      { name: 'Paneer Tikka', quantity: 65, revenue: 9750 }
    ];
  }

  private async getPeakHours(storeId: string): Promise<unknown[]> {
    return [
      { hour: 12, orders: 25 },
      { hour: 13, orders: 30 },
      { hour: 19, orders: 35 },
      { hour: 20, orders: 32 },
      { hour: 21, orders: 20 }
    ];
  }
}

export const restaurantAnalytics = new RestaurantAnalytics();
