import { dashboardModel } from '../models/Dashboard';
import {
  DateRange,
  AggregationResult,
  RevenueData,
  OrderData,
  KPIData,
  CustomerMetrics,
} from '../types';
import { v4 as uuidv4 } from 'uuid';
import { startOfHour, startOfDay, startOfWeek, startOfMonth, format } from 'date-fns';

interface AggregationCache {
  hourly: Map<string, AggregationResult>;
  daily: Map<string, AggregationResult>;
  weekly: Map<string, AggregationResult>;
  monthly: Map<string, AggregationResult>;
}

class AggregationService {
  private cache: AggregationCache = {
    hourly: new Map(),
    daily: new Map(),
    weekly: new Map(),
    monthly: new Map(),
  };
  private lastAggregation: Map<string, Date> = new Map();

  constructor() {
    // Initialize aggregation tracking
    this.lastAggregation.set('revenue', new Date());
    this.lastAggregation.set('orders', new Date());
    this.lastAggregation.set('customers', new Date());
  }

  /**
   * Get aggregated revenue data for a specific period
   */
  aggregateRevenue(
    orders: OrderData[],
    period: 'hourly' | 'daily' | 'weekly' | 'monthly',
    dateRange?: DateRange
  ): AggregationResult {
    const cacheKey = `${period}-${dateRange?.startDate || 'all'}-${dateRange?.endDate || 'all'}`;

    if (this.cache[period].has(cacheKey)) {
      return this.cache[period].get(cacheKey)!;
    }

    const result = this.performRevenueAggregation(orders, period, dateRange);
    this.cache[period].set(cacheKey, result);

    return result;
  }

  /**
   * Perform the actual revenue aggregation
   */
  private performRevenueAggregation(
    orders: OrderData[],
    period: 'hourly' | 'daily' | 'weekly' | 'monthly',
    dateRange?: DateRange
  ): AggregationResult {
    const aggregated: Record<string, { revenue: number; orders: number; refunds: number }> = {};

    orders.forEach(order => {
      const date = new Date(order.createdAt);
      let key: string;

      switch (period) {
        case 'hourly':
          key = format(startOfHour(date), 'yyyy-MM-dd HH:00');
          break;
        case 'daily':
          key = format(startOfDay(date), 'yyyy-MM-dd');
          break;
        case 'weekly':
          key = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-ww');
          break;
        case 'monthly':
          key = format(startOfMonth(date), 'yyyy-MM');
          break;
      }

      if (!aggregated[key]) {
        aggregated[key] = { revenue: 0, orders: 0, refunds: 0 };
      }

      if (order.status === 'completed') {
        aggregated[key].revenue += order.amount;
        aggregated[key].orders++;
      } else if (order.status === 'refunded') {
        aggregated[key].refunds += order.amount;
      }
    });

    const data: RevenueData[] = Object.entries(aggregated)
      .map(([date, values]) => ({
        date,
        revenue: Math.round(values.revenue * 100) / 100,
        orders: values.orders,
        refunds: Math.round(values.refunds * 100) / 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      id: uuidv4(),
      type: period,
      data: { revenue: data, total: data.reduce((sum, d) => sum + d.revenue, 0) },
      computedAt: new Date().toISOString(),
    };
  }

  /**
   * Get aggregated order metrics
   */
  aggregateOrders(period: 'hourly' | 'daily' | 'weekly' | 'monthly', dateRange?: DateRange): AggregationResult {
    const orders = dashboardModel.getOrders(dateRange);
    const aggregated: Record<string, {
      total: number;
      completed: number;
      cancelled: number;
      refunded: number;
      pending: number;
      revenue: number;
    }> = {};

    orders.forEach(order => {
      const date = new Date(order.createdAt);
      let key: string;

      switch (period) {
        case 'hourly':
          key = format(startOfHour(date), 'yyyy-MM-dd HH:00');
          break;
        case 'daily':
          key = format(startOfDay(date), 'yyyy-MM-dd');
          break;
        case 'weekly':
          key = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-ww');
          break;
        case 'monthly':
          key = format(startOfMonth(date), 'yyyy-MM');
          break;
      }

      if (!aggregated[key]) {
        aggregated[key] = { total: 0, completed: 0, cancelled: 0, refunded: 0, pending: 0, revenue: 0 };
      }

      aggregated[key].total++;
      aggregated[key][order.status]++;
      if (order.status === 'completed') {
        aggregated[key].revenue += order.amount;
      }
    });

    const data = Object.entries(aggregated)
      .map(([periodKey, values]) => ({
        period: periodKey,
        ...values,
        revenue: Math.round(values.revenue * 100) / 100,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    return {
      id: uuidv4(),
      type: period,
      data,
      computedAt: new Date().toISOString(),
    };
  }

  /**
   * Get customer cohort analysis
   */
  aggregateCustomerCohorts(dateRange?: DateRange): AggregationResult {
    const orders = dashboardModel.getOrders(dateRange);
    const customerCohorts: Map<string, Map<string, { orders: number; spend: number }>> = new Map();

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const cohortKey = format(startOfMonth(orderDate), 'yyyy-MM');
      const customerKey = order.customerId;

      if (!customerCohorts.has(cohortKey)) {
        customerCohorts.set(cohortKey, new Map());
      }

      const cohort = customerCohorts.get(cohortKey)!;
      if (!cohort.has(customerKey)) {
        cohort.set(customerKey, { orders: 0, spend: 0 });
      }

      const customer = cohort.get(customerKey)!;
      customer.orders++;
      customer.spend += order.status === 'completed' ? order.amount : 0;
    });

    const cohortData: Record<string, { customers: number; orders: number; revenue: number; avgSpend: number }> = {};

    customerCohorts.forEach((customers, cohort) => {
      let totalRevenue = 0;
      customers.forEach(c => {
        totalRevenue += c.spend;
      });

      cohortData[cohort] = {
        customers: customers.size,
        orders: Array.from(customers.values()).reduce((sum, c) => sum + c.orders, 0),
        revenue: Math.round(totalRevenue * 100) / 100,
        avgSpend: Math.round((totalRevenue / customers.size) * 100) / 100,
      };
    });

    return {
      id: uuidv4(),
      type: 'monthly',
      data: cohortData,
      computedAt: new Date().toISOString(),
    };
  }

  /**
   * Get merchant performance aggregation
   */
  aggregateMerchantPerformance(dateRange?: DateRange): AggregationResult {
    const merchants = dashboardModel.getMerchants(dateRange);
    const aggregated = merchants.map(m => ({
      merchantId: m.merchantId,
      merchantName: m.merchantName,
      totalSales: m.totalSales,
      orderCount: m.orderCount,
      averageRating: m.averageRating,
      fulfillmentRate: m.fulfillmentRate,
      averageOrderValue: m.orderCount > 0 ? Math.round((m.totalSales / m.orderCount) * 100) / 100 : 0,
    }));

    return {
      id: uuidv4(),
      type: 'daily',
      data: aggregated,
      computedAt: new Date().toISOString(),
    };
  }

  /**
   * Run full aggregation and update cache
   */
  runFullAggregation(dateRange?: DateRange): Record<string, AggregationResult> {
    const results: Record<string, AggregationResult> = {};

    results.revenueDaily = this.aggregateRevenue(
      dashboardModel.getOrders(dateRange),
      'daily',
      dateRange
    );

    results.revenueWeekly = this.aggregateRevenue(
      dashboardModel.getOrders(dateRange),
      'weekly',
      dateRange
    );

    results.ordersDaily = this.aggregateOrders('daily', dateRange);
    results.ordersWeekly = this.aggregateOrders('weekly', dateRange);

    results.customerCohorts = this.aggregateCustomerCohorts(dateRange);
    results.merchantPerformance = this.aggregateMerchantPerformance(dateRange);

    this.lastAggregation.set('full', new Date());

    return results;
  }

  /**
   * Get KPIs with trend data
   */
  getKPIsWithTrends(dateRange?: DateRange): KPIData & { trends: Record<string, number[]> } {
    const kpis = dashboardModel.getKPIs(dateRange);
    const dailyAggregation = this.aggregateOrders('daily', dateRange) as unknown as {
      data: { revenue: number }[];
    };

    const trends: Record<string, number[]> = {
      revenue: [],
      orders: [],
    };

    if (Array.isArray(dailyAggregation.data)) {
      dailyAggregation.data.forEach((d: unknown) => {
        const data = d as { revenue?: number; total?: number };
        trends.revenue.push(data.revenue || 0);
        trends.orders.push(data.total || 0);
      });
    }

    return {
      ...kpis,
      trends,
    };
  }

  /**
   * Clear aggregation cache
   */
  clearCache(): void {
    this.cache.hourly.clear();
    this.cache.daily.clear();
    this.cache.weekly.clear();
    this.cache.monthly.clear();
  }

  /**
   * Get last aggregation timestamp
   */
  getLastAggregationTime(type?: string): Date | null {
    if (type) {
      return this.lastAggregation.get(type) || null;
    }
    const times = Array.from(this.lastAggregation.values());
    return times.length > 0 ? times.reduce((max, t) => t > max ? t : max) : null;
  }
}

export const aggregationService = new AggregationService();
