import { ReportRequest, DashboardData, MetricType } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class AnalyticsCore {
  generateDashboard(request: ReportRequest): DashboardData {
    logger.info(`Generating dashboard for business: ${request.businessId}`);

    const start = new Date(request.startDate);
    const end = new Date(request.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // STATISTICAL: mock dashboard trend data generation
    const trends = Array.from({ length: days }, (_, i) => {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      return {
        date: date.toISOString().split('T')[0],
        revenue: Math.round((50000 + Math.random() * 200000) * 100) / 100,
        orders: Math.floor(50 + Math.random() * 200)
      };
    });

    const totalRevenue = trends.reduce((sum, t) => sum + t.revenue, 0);
    const totalOrders = trends.reduce((sum, t) => sum + t.orders, 0);

    return {
      overview: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        totalCustomers: Math.floor(totalOrders * 0.7),
        avgOrderValue: Math.round((totalRevenue / totalOrders) * 100) / 100,
        conversionRate: Math.round((3 + Math.random() * 5) * 100) / 100
      },
      trends,
      topProducts: [
        { productId: 'P001', name: 'Premium Burger', quantity: 1250, revenue: 187500 },
        { productId: 'P002', name: 'Family Combo', quantity: 980, revenue: 156800 },
        { productId: 'P003', name: 'Dessert Pack', quantity: 870, revenue: 87000 }
      ],
      customerSegments: [
        { segment: 'New', count: 1200, revenue: totalRevenue * 0.3 },
        { segment: 'Returning', count: 800, revenue: totalRevenue * 0.4 },
        { segment: 'Loyal', count: 400, revenue: totalRevenue * 0.3 }
      ],
      generatedAt: new Date()
    };
  }

  getMetricTimeSeries(metric: MetricType, startDate: string, endDate: string): { date: string; value: number }[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const baseValues: Record<MetricType, number> = {
      revenue: 100000, orders: 500, customers: 300, conversion: 4, avg_order_value: 200, retention: 85, churn: 5
    };

    return Array.from({ length: days }, (_, i) => {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const base = baseValues[metric] || 1000;
      return { date: date.toISOString().split('T')[0], value: Math.round(base * (0.8 + Math.random() * 0.4) * 100) / 100 };
    });
  }

  comparePeriods(currentStart: string, currentEnd: string, previousStart: string, previousEnd: string): Record<MetricType, { current: number; previous: number; change: number; changePercent: number }> {
    const metrics: MetricType[] = ['revenue', 'orders', 'customers', 'conversion', 'avg_order_value'];
    const result: unknown = {};

    for (const metric of metrics) {
      const current = this.getMetricTimeSeries(metric, currentStart, currentEnd);
      const previous = this.getMetricTimeSeries(metric, previousStart, previousEnd);
      const currentSum = current.reduce((s, c) => s + c.value, 0);
      const previousSum = previous.reduce((s, p) => s + p.value, 0);
      const change = currentSum - previousSum;
      result[metric] = { current: currentSum, previous: previousSum, change, changePercent: previousSum ? (change / previousSum) * 100 : 0 };
    }
    return result;
  }
}

export const analyticsCore = new AnalyticsCore();
