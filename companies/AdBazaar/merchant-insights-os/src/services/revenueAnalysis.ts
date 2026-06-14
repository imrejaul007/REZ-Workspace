import { RevenueRecord, Merchant, IndustryBenchmark } from '../models/index.js';
import type { RevenueAnalysis, RevenueData } from '../types/index.js';
import logger from '../config/logger.js';
import { subDays, format, startOfDay, endOfDay, differenceInDays } from 'date-fns';

export class RevenueAnalysisService {
  /**
   * Get comprehensive revenue analysis for a merchant
   */
  async getRevenueAnalysis(
    merchantId: string,
    period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<RevenueAnalysis> {
    const days = this.getDaysForPeriod(period);
    const startDate = subDays(new Date(), days);
    const endDate = new Date();

    const merchant = await Merchant.findOne({ merchantId });
    if (!merchant) {
      throw new Error(`Merchant not found: ${merchantId}`);
    }

    // Get revenue records
    const records = await RevenueRecord.find({
      merchantId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    // Calculate metrics
    const totalRevenue = records.reduce((sum, r) => sum + r.revenue, 0);
    const totalOrders = records.reduce((sum, r) => sum + r.orders, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate growth vs previous period
    const previousStart = subDays(startDate, days);
    const previousRecords = await RevenueRecord.find({
      merchantId,
      date: { $gte: previousStart, $lt: startDate },
    });

    const previousRevenue = previousRecords.reduce((sum, r) => sum + r.revenue, 0);
    const previousOrders = previousRecords.reduce((sum, r) => sum + r.orders, 0);

    const revenueGrowth = previousRevenue > 0
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : 0;
    const ordersGrowth = previousOrders > 0
      ? ((totalOrders - previousOrders) / previousOrders) * 100
      : 0;

    // Determine trend
    const trend = this.determineTrend(records);

    // Get benchmark comparison
    const benchmark = await this.getBenchmarkComparison(merchant.category, totalRevenue);

    // Aggregate by granularity
    const dailyRevenue = this.aggregateByDay(records);
    const weeklyRevenue = this.aggregateByWeek(records);
    const monthlyRevenue = this.aggregateByMonth(records);

    return {
      merchantId,
      period: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(endDate, 'yyyy-MM-dd'),
      },
      totalRevenue,
      totalOrders,
      averageOrderValue,
      revenueGrowth,
      ordersGrowth,
      trend,
      benchmarkComparison: benchmark,
      dailyRevenue,
      weeklyRevenue,
      monthlyRevenue,
    };
  }

  /**
   * Get revenue data for a specific date range
   */
  async getRevenueForDateRange(
    merchantId: string,
    startDate: Date,
    endDate: Date,
    granularity: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<RevenueData[]> {
    const records = await RevenueRecord.find({
      merchantId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    switch (granularity) {
      case 'daily':
        return this.aggregateByDay(records);
      case 'weekly':
        return this.aggregateByWeek(records);
      case 'monthly':
        return this.aggregateByMonth(records);
      default:
        return this.aggregateByDay(records);
    }
  }

  private getDaysForPeriod(period: string): number {
    switch (period) {
      case 'week': return 7;
      case 'month': return 30;
      case 'quarter': return 90;
      case 'year': return 365;
      default: return 30;
    }
  }

  private determineTrend(records: InstanceType<typeof RevenueRecord>[]): 'up' | 'down' | 'stable' {
    if (records.length < 2) return 'stable';

    const halfPoint = Math.floor(records.length / 2);
    const firstHalf = records.slice(0, halfPoint);
    const secondHalf = records.slice(halfPoint);

    const firstHalfAvg = firstHalf.reduce((sum, r) => sum + r.revenue, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, r) => sum + r.revenue, 0) / secondHalf.length;

    const changePercent = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

    if (changePercent > 5) return 'up';
    if (changePercent < -5) return 'down';
    return 'stable';
  }

  private async getBenchmarkComparison(
    category: string,
    merchantRevenue: number
  ): Promise<{ industryAverage: number; merchantValue: number; percentile: number }> {
    const benchmark = await IndustryBenchmark.findOne({ category });

    if (!benchmark) {
      return {
        industryAverage: 0,
        merchantValue: merchantRevenue,
        percentile: 50,
      };
    }

    const industryAverage = benchmark.metrics.averageRevenue;
    const percentile = industryAverage > 0
      ? Math.min(99, Math.round((merchantRevenue / industryAverage) * 50 + 50))
      : 50;

    return {
      industryAverage,
      merchantValue: merchantRevenue,
      percentile,
    };
  }

  private aggregateByDay(records: InstanceType<typeof RevenueRecord>[]): RevenueData[] {
    const grouped = new Map<string, RevenueData>();

    for (const record of records) {
      const dateKey = format(record.date, 'yyyy-MM-dd');
      const existing = grouped.get(dateKey);

      if (existing) {
        existing.revenue += record.revenue;
        existing.orders += record.orders;
      } else {
        grouped.set(dateKey, {
          date: dateKey,
          revenue: record.revenue,
          orders: record.orders,
          averageOrderValue: record.averageOrderValue,
        });
      }
    }

    return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  private aggregateByWeek(records: InstanceType<typeof RevenueRecord>[]): RevenueData[] {
    const grouped = new Map<string, RevenueData>();

    for (const record of records) {
      const weekStart = format(startOfDay(record.date), "yyyy-'W'ww");
      const existing = grouped.get(weekStart);

      if (existing) {
        existing.revenue += record.revenue;
        existing.orders += record.orders;
      } else {
        grouped.set(weekStart, {
          date: weekStart,
          revenue: record.revenue,
          orders: record.orders,
          averageOrderValue: 0,
        });
      }
    }

    return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  private aggregateByMonth(records: InstanceType<typeof RevenueRecord>[]): RevenueData[] {
    const grouped = new Map<string, RevenueData>();

    for (const record of records) {
      const monthKey = format(record.date, 'yyyy-MM');
      const existing = grouped.get(monthKey);

      if (existing) {
        existing.revenue += record.revenue;
        existing.orders += record.orders;
      } else {
        grouped.set(monthKey, {
          date: monthKey,
          revenue: record.revenue,
          orders: record.orders,
          averageOrderValue: 0,
        });
      }
    }

    return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
  }
}

export default new RevenueAnalysisService();