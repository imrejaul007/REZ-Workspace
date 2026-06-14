import { MerchantProfileDocument } from '../models';
import {
  MerchantTrends,
  TrendData,
  TrendDataPoint,
  TrendSegment,
  SeasonalityPattern,
  TrendFilter,
} from '../types';

export class TrendService {
  /**
   * Generate comprehensive trends for a merchant
   */
  async generateTrends(
    profile: MerchantProfileDocument,
    filter?: TrendFilter
  ): Promise<MerchantTrends> {
    const period = filter?.period || 'monthly';
    const startDate = filter?.startDate || this.getDefaultStartDate(period);
    const endDate = filter?.endDate || new Date();

    const revenue = this.generateRevenueTrend(profile, period, startDate, endDate);
    const orders = this.generateOrdersTrend(profile, period, startDate, endDate);
    const customers = this.generateCustomersTrend(profile, period, startDate, endDate);
    const averageOrderValue = this.generateAovTrend(profile, period, startDate, endDate);
    const customerRetention = this.generateRetentionTrend(profile, period, startDate, endDate);
    const topProducts = this.generateProductTrends(profile);
    const customerSegments = this.generateCustomerSegmentTrends(profile);

    return {
      merchantId: profile.merchantId,
      period,
      startDate,
      endDate,
      revenue,
      orders,
      customers,
      averageOrderValue,
      customerRetention,
      topProducts,
      customerSegments,
      generatedAt: new Date(),
    };
  }

  /**
   * Get default start date based on period
   */
  private getDefaultStartDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'daily':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days
      case 'weekly':
        return new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000); // 12 weeks
      case 'quarterly':
        return new Date(now.getTime() - 4 * 90 * 24 * 60 * 60 * 1000); // 4 quarters
      case 'yearly':
        return new Date(now.getTime() - 3 * 365 * 24 * 60 * 60 * 1000); // 3 years
      default:
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 3 months
    }
  }

  /**
   * Generate revenue trend
   */
  private generateRevenueTrend(
    profile: MerchantProfileDocument,
    period: string,
    startDate: Date,
    endDate: Date
  ): TrendData {
    const revenuePatterns = profile.revenuePatterns || {};
    let dataPoints: TrendDataPoint[] = [];
    let forecast: TrendDataPoint[] = [];

    // Extract existing data based on period
    if (period === 'monthly' && revenuePatterns.monthly) {
      dataPoints = revenuePatterns.monthly.map(m => ({
        date: m.month,
        value: m.amount,
      }));
    } else if (period === 'weekly' && revenuePatterns.weekly) {
      dataPoints = revenuePatterns.weekly.map(w => ({
        date: w.weekStart,
        value: w.amount,
      }));
    } else if (period === 'daily' && revenuePatterns.daily) {
      dataPoints = revenuePatterns.daily.map(d => ({
        date: d.date,
        value: d.amount,
      }));
    } else {
      // Generate synthetic data if no historical data
      dataPoints = this.generateSyntheticData(startDate, endDate, period, revenuePatterns.totalRevenue || 10000);
    }

    // Calculate forecast
    forecast = this.generateForecast(dataPoints, 3);

    // Calculate seasonality
    const seasonality = this.calculateSeasonality(dataPoints);

    // Calculate current and previous
    const current = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].value : 0;
    const previous = dataPoints.length > 1 ? dataPoints[dataPoints.length - 2].value : 0;
    const change = current - previous;
    const percentageChange = previous !== 0 ? (change / previous) * 100 : 0;

    return {
      current,
      previous,
      change,
      percentageChange,
      dataPoints,
      forecast,
      seasonality,
    };
  }

  /**
   * Generate orders trend
   */
  private generateOrdersTrend(
    profile: MerchantProfileDocument,
    period: string,
    startDate: Date,
    endDate: Date
  ): TrendData {
    const orderVolume = profile.orderVolume || {};
    const revenuePatterns = profile.revenuePatterns || {};
    let dataPoints: TrendDataPoint[] = [];

    // Extract order data
    if (period === 'monthly' && revenuePatterns.monthly) {
      dataPoints = revenuePatterns.monthly.map(m => ({
        date: m.month,
        value: m.orderCount,
      }));
    } else if (period === 'daily' && revenuePatterns.daily) {
      dataPoints = revenuePatterns.daily.map(d => ({
        date: d.date,
        value: d.orderCount,
      }));
    } else {
      // Generate synthetic order data
      dataPoints = this.generateSyntheticData(
        startDate,
        endDate,
        period,
        orderVolume.total || 1000,
        true
      );
    }

    const forecast = this.generateForecast(dataPoints, 3);
    const seasonality = this.calculateSeasonality(dataPoints);

    const current = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].value : 0;
    const previous = dataPoints.length > 1 ? dataPoints[dataPoints.length - 2].value : 0;
    const change = current - previous;
    const percentageChange = previous !== 0 ? (change / previous) * 100 : 0;

    return {
      current,
      previous,
      change,
      percentageChange,
      dataPoints,
      forecast,
      seasonality,
    };
  }

  /**
   * Generate customers trend
   */
  private generateCustomersTrend(
    profile: MerchantProfileDocument,
    period: string,
    startDate: Date,
    endDate: Date
  ): TrendData {
    const customerDemographics = profile.customerDemographics || {};
    let dataPoints: TrendDataPoint[] = [];

    // Generate customer trend data
    const baseCustomers = customerDemographics.totalCustomers || 100;
    dataPoints = this.generateSyntheticData(
      startDate,
      endDate,
      period,
      baseCustomers,
      false,
      0.02 // Growth rate
    );

    const forecast = this.generateForecast(dataPoints, 3);
    const seasonality = this.calculateSeasonality(dataPoints);

    const current = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].value : 0;
    const previous = dataPoints.length > 1 ? dataPoints[dataPoints.length - 2].value : 0;
    const change = current - previous;
    const percentageChange = previous !== 0 ? (change / previous) * 100 : 0;

    return {
      current,
      previous,
      change,
      percentageChange,
      dataPoints,
      forecast,
      seasonality,
    };
  }

  /**
   * Generate AOV trend
   */
  private generateAovTrend(
    profile: MerchantProfileDocument,
    period: string,
    startDate: Date,
    endDate: Date
  ): TrendData {
    const revenuePatterns = profile.revenuePatterns || {};
    const baseAov = revenuePatterns.averageOrderValue || 35;

    let dataPoints = this.generateSyntheticData(
      startDate,
      endDate,
      period,
      baseAov,
      false,
      0.005 // Slower growth rate for AOV
    );

    const forecast = this.generateForecast(dataPoints, 3);
    const seasonality = this.calculateSeasonality(dataPoints);

    const current = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].value : 0;
    const previous = dataPoints.length > 1 ? dataPoints[dataPoints.length - 2].value : 0;
    const change = current - previous;
    const percentageChange = previous !== 0 ? (change / previous) * 100 : 0;

    return {
      current,
      previous,
      change,
      percentageChange,
      dataPoints,
      forecast,
      seasonality,
    };
  }

  /**
   * Generate retention trend
   */
  private generateRetentionTrend(
    profile: MerchantProfileDocument,
    period: string,
    startDate: Date,
    endDate: Date
  ): TrendData {
    const customerDemographics = profile.customerDemographics || {};
    const baseRetention = customerDemographics.retentionRate || 0.6;

    let dataPoints = this.generateSyntheticData(
      startDate,
      endDate,
      period,
      baseRetention * 100,
      false,
      0.01
    );

    const forecast = this.generateForecast(dataPoints, 3);
    const seasonality = this.calculateSeasonality(dataPoints);

    const current = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].value / 100 : 0;
    const previous = dataPoints.length > 1 ? dataPoints[dataPoints.length - 2].value / 100 : 0;
    const change = current - previous;
    const percentageChange = previous !== 0 ? (change / previous) * 100 : 0;

    return {
      current,
      previous,
      change,
      percentageChange,
      dataPoints,
      forecast,
      seasonality,
    };
  }

  /**
   * Generate product trends
   */
  private generateProductTrends(profile: MerchantProfileDocument): TrendDataPoint[] {
    const popularItems = profile.popularItems?.items || [];

    return popularItems.slice(0, 10).map(item => ({
      date: item.lastUpdated?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      value: item.orderCount,
    }));
  }

  /**
   * Generate customer segment trends
   */
  private generateCustomerSegmentTrends(profile: MerchantProfileDocument): TrendSegment[] {
    const segments: TrendSegment[] = [];
    const demographics = profile.customerDemographics?.demographics || {};
    const customerTypes = demographics.customerTypes || {};

    // Individual customers
    segments.push({
      segment: 'Individual',
      value: (customerTypes as unknown).individual || 60,
      trend: 'stable',
      percentageChange: 2.5,
    });

    // Business customers
    segments.push({
      segment: 'Business',
      value: (customerTypes as unknown).business || 25,
      trend: 'up',
      percentageChange: 8.3,
    });

    // Premium customers
    segments.push({
      segment: 'Premium',
      value: (customerTypes as unknown).premium || 15,
      trend: 'up',
      percentageChange: 12.1,
    });

    return segments;
  }

  /**
   * Generate synthetic trend data
   */
  private generateSyntheticData(
    startDate: Date,
    endDate: Date,
    period: string,
    baseValue: number,
    isCount: boolean = true,
    growthRate: number = 0.03
  ): TrendDataPoint[] {
    const dataPoints: TrendDataPoint[] = [];
    let currentDate = new Date(startDate);
    let currentValue = baseValue * 0.8; // Start at 80% of current

    const intervalDays = this.getIntervalDays(period);
    const iterations = this.getIterationCount(period, startDate, endDate);

    for (let i = 0; i < iterations; i++) {
      // Add trend and some noise
      const trendFactor = 1 + growthRate * i;
      const noise = (Math.random() - 0.5) * 0.2; // +/- 10% noise
      const seasonalFactor = 1 + Math.sin((i * Math.PI * 2) / 12) * 0.1; // Seasonal variation

      currentValue = baseValue * trendFactor * seasonalFactor * (1 + noise);

      // Ensure counts are positive integers
      if (isCount) {
        currentValue = Math.round(currentValue);
      }

      dataPoints.push({
        date: currentDate.toISOString().split('T')[0],
        value: Math.max(isCount ? 1 : 0, currentValue),
      });

      currentDate = new Date(currentDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    }

    return dataPoints;
  }

  /**
   * Get interval in days based on period
   */
  private getIntervalDays(period: string): number {
    switch (period) {
      case 'daily':
        return 1;
      case 'weekly':
        return 7;
      case 'quarterly':
        return 91;
      case 'yearly':
        return 365;
      default:
        return 30; // monthly
    }
  }

  /**
   * Get iteration count based on period and date range
   */
  private getIterationCount(period: string, startDate: Date, endDate: Date): number {
    const daysDiff = (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);
    const intervalDays = this.getIntervalDays(period);
    return Math.min(Math.ceil(daysDiff / intervalDays), 52); // Max 52 data points
  }

  /**
   * Generate forecast based on historical data
   */
  private generateForecast(dataPoints: TrendDataPoint[], periods: number): TrendDataPoint[] {
    if (dataPoints.length < 3) return [];

    const forecast: TrendDataPoint[] = [];
    const lastDate = new Date(dataPoints[dataPoints.length - 1].date);

    // Calculate trend (simple linear regression)
    const n = dataPoints.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    dataPoints.forEach((point, index) => {
      sumX += index;
      sumY += point.value;
      sumXY += index * point.value;
      sumX2 += index * index;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate forecast
    for (let i = 1; i <= periods; i++) {
      const forecastValue = intercept + slope * (n + i - 1);
      const forecastDate = new Date(lastDate.getTime() + i * 30 * 24 * 60 * 60 * 1000); // Monthly intervals

      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        value: Math.max(0, Math.round(forecastValue)),
        predicted: true,
      });
    }

    return forecast;
  }

  /**
   * Calculate seasonality pattern
   */
  private calculateSeasonality(dataPoints: TrendDataPoint[]): SeasonalityPattern {
    if (dataPoints.length < 6) {
      return { hasSeasonality: false };
    }

    // Calculate monthly averages
    const monthlyTotals: number[] = [];
    const monthlyCounts: number[] = [];

    dataPoints.forEach(point => {
      const month = new Date(point.date).getMonth();
      monthlyTotals[month] = (monthlyTotals[month] || 0) + point.value;
      monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
    });

    const monthlyAverages = monthlyTotals.map((total, i) =>
      monthlyCounts[i] > 0 ? total / monthlyCounts[i] : 0
    );

    const peakMonth = monthlyAverages.indexOf(Math.max(...monthlyAverages));
    const lowMonth = monthlyAverages.indexOf(Math.min(...monthlyAverages.filter(v => v > 0)));
    const overallAvg = monthlyAverages.filter(v => v > 0).reduce((a, b) => a + b, 0) /
      monthlyAverages.filter(v => v > 0).length;
    const amplitude = overallAvg > 0 ?
      (Math.max(...monthlyAverages.filter(v => v > 0)) - Math.min(...monthlyAverages.filter(v => v > 0))) / overallAvg : 0;

    return {
      hasSeasonality: amplitude > 0.2,
      peakMonth: peakMonth >= 0 ? peakMonth : undefined,
      lowMonth: lowMonth >= 0 ? lowMonth : undefined,
      amplitude: Math.round(amplitude * 100) / 100,
    };
  }
}

export const trendService = new TrendService();
export default trendService;
