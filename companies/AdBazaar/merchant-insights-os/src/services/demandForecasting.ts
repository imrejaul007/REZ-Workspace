import { ProductPerformance, RevenueRecord, Merchant } from '../models/index.js';
import type { DemandAnalysis, DemandForecast } from '../types/index.js';
import logger from '../config/logger.js';
import { subDays, format, getMonth } from 'date-fns';

export class DemandForecastingService {
  /**
   * Get demand analysis and forecasting for a merchant
   */
  async getDemandAnalysis(
    merchantId: string,
    period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<DemandAnalysis> {
    const days = this.getDaysForPeriod(period);
    const startDate = subDays(new Date(), days);

    const merchant = await Merchant.findOne({ merchantId });
    if (!merchant) {
      throw new Error(`Merchant not found: ${merchantId}`);
    }

    // Get product performance data
    const products = await ProductPerformance.find({ merchantId });
    const revenueRecords = await RevenueRecord.find({
      merchantId,
      date: { $gte: startDate },
    }).sort({ date: 1 });

    // Calculate overall trend
    const overallTrend = this.calculateOverallTrend(revenueRecords);
    const growthRate = this.calculateGrowthRate(revenueRecords);

    // Generate forecasts for each product
    const forecasts = this.generateForecasts(products, revenueRecords);

    // Generate recommendations
    const recommendations = this.generateRecommendations(forecasts, growthRate);

    return {
      merchantId,
      period: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd'),
      },
      overallTrend,
      growthRate,
      forecasts,
      recommendations,
    };
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

  private calculateOverallTrend(
    records: InstanceType<typeof RevenueRecord>[]
  ): 'growing' | 'declining' | 'stable' {
    if (records.length < 2) return 'stable';

    const halfPoint = Math.floor(records.length / 2);
    const firstHalf = records.slice(0, halfPoint);
    const secondHalf = records.slice(halfPoint);

    const firstHalfAvg = firstHalf.reduce((sum, r) => sum + r.revenue, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, r) => sum + r.revenue, 0) / secondHalf.length;

    const changePercent = firstHalfAvg > 0
      ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
      : 0;

    if (changePercent > 5) return 'growing';
    if (changePercent < -5) return 'declining';
    return 'stable';
  }

  private calculateGrowthRate(records: InstanceType<typeof RevenueRecord>[]): number {
    if (records.length < 2) return 0;

    const firstHalf = records.slice(0, Math.floor(records.length / 2));
    const secondHalf = records.slice(Math.floor(records.length / 2));

    const firstHalfTotal = firstHalf.reduce((sum, r) => sum + r.revenue, 0);
    const secondHalfTotal = secondHalf.reduce((sum, r) => sum + r.revenue, 0);

    return firstHalfTotal > 0
      ? ((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100
      : 0;
  }

  private generateForecasts(
    products: InstanceType<typeof ProductPerformance>[],
    revenueRecords: InstanceType<typeof RevenueRecord>[]
  ): DemandForecast[] {
    const forecasts: DemandForecast[] = [];

    for (const product of products) {
      // Calculate current demand based on recent sales
      const recentOrders = revenueRecords.slice(-14); // Last 14 days
      const avgDailyOrders = recentOrders.length > 0
        ? recentOrders.reduce((sum, r) => sum + r.orders, 0) / 14
        : 0;

      // Calculate trend from product data
      const trendMultiplier = product.trend === 'rising' ? 1.2
        : product.trend === 'falling' ? 0.8 : 1.0;

      // Generate weekly predictions
      const baseDemand = (product.unitsSold / 30) * trendMultiplier;

      const predictedDemand = {
        week1: Math.round(baseDemand * (1 + Math.random() * 0.1)),
        week2: Math.round(baseDemand * (1 + Math.random() * 0.15)),
        week3: Math.round(baseDemand * (1 + Math.random() * 0.2)),
        week4: Math.round(baseDemand * (1 + Math.random() * 0.25)),
      };

      // Determine seasonality
      const currentMonth = getMonth(new Date());
      const peakMonths = this.getSeasonalPeakMonths(product.category);
      const isPeak = peakMonths.includes(currentMonth);

      forecasts.push({
        productId: product.productId,
        productName: product.name,
        currentDemand: Math.round(avgDailyOrders * 30),
        predictedDemand,
        confidence: this.calculateConfidence(recentOrders.length, product.trend),
        factors: this.identifyDemandFactors(product, isPeak),
        seasonality: {
          pattern: this.determineSeasonalityPattern(product.category, peakMonths),
          peakMonths: peakMonths.map(m => this.getMonthName(m)),
          lowMonths: this.getLowMonths(peakMonths),
        },
      });
    }

    // Sort by predicted demand
    return forecasts.sort((a, b) => {
      const aTotal = a.predictedDemand.week1 + a.predictedDemand.week2 +
                   a.predictedDemand.week3 + a.predictedDemand.week4;
      const bTotal = b.predictedDemand.week1 + b.predictedDemand.week2 +
                   b.predictedDemand.week3 + b.predictedDemand.week4;
      return bTotal - aTotal;
    });
  }

  private calculateConfidence(dataPoints: number, trend: string): number {
    let confidence = 0.5;

    // More data = more confidence
    if (dataPoints >= 30) confidence += 0.2;
    else if (dataPoints >= 14) confidence += 0.1;

    // Clear trend = more confidence
    if (trend === 'rising' || trend === 'falling') confidence += 0.15;

    // Cap at 0.95
    return Math.min(0.95, confidence);
  }

  private identifyDemandFactors(
    product: InstanceType<typeof ProductPerformance>,
    isPeak: boolean
  ): { factor: string; impact: 'positive' | 'negative' | 'neutral'; weight: number }[] {
    const factors: { factor: string; impact: 'positive' | 'negative' | 'neutral'; weight: number }[] = [];

    // Trend factor
    factors.push({
      factor: product.trend === 'rising' ? 'Upward sales trend' : product.trend === 'falling' ? 'Downward sales trend' : 'Stable sales',
      impact: product.trend === 'rising' ? 'positive' : product.trend === 'falling' ? 'negative' : 'neutral',
      weight: 0.3,
    });

    // Seasonality factor
    if (isPeak) {
      factors.push({
        factor: 'Peak season for this category',
        impact: 'positive',
        weight: 0.25,
      });
    }

    // Margin factor
    if (product.margin > 30) {
      factors.push({
        factor: 'High profit margin',
        impact: 'positive',
        weight: 0.2,
      });
    } else if (product.margin < 15) {
      factors.push({
        factor: 'Low profit margin',
        impact: 'negative',
        weight: 0.2,
      });
    }

    // Return rate factor
    if (product.returnRate > 5) {
      factors.push({
        factor: 'High return rate affects demand',
        impact: 'negative',
        weight: 0.15,
      });
    }

    // Market factor (placeholder)
    factors.push({
      factor: 'General market conditions',
      impact: 'neutral',
      weight: 0.1,
    });

    return factors;
  }

  private getSeasonalPeakMonths(category: string): number[] {
    // Category-based seasonal patterns
    const seasonalPatterns: Record<string, number[]> = {
      'food': [11, 12, 1, 5], // Festive and summer
      'restaurant': [11, 12],
      'fashion': [7, 8, 11, 12], // Back to school, festive
      'electronics': [8, 9, 11, 12], // Diwali, Christmas
      'grocery': [11, 12],
      'healthcare': [1, 2],
      'default': [11, 12],
    };

    const pattern = seasonalPatterns[category.toLowerCase()] ||
                   seasonalPatterns['default'] ||
                   [11, 12];

    return pattern;
  }

  private determineSeasonalityPattern(
    category: string,
    peakMonths: string[]
  ): 'increasing' | 'decreasing' | 'stable' | 'seasonal' {
    if (peakMonths.length >= 4) return 'seasonal';
    if (peakMonths.length >= 2) return 'increasing'; // Has peaks
    return 'stable';
  }

  private getLowMonths(peakMonths: number[]): string[] {
    const allMonths = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    return allMonths
      .filter(m => !peakMonths.includes(m))
      .map(m => this.getMonthName(m));
  }

  private getMonthName(month: number): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month];
  }

  private generateRecommendations(
    forecasts: DemandForecast[],
    growthRate: number
  ): { productId: string; action: string; urgency: 'high' | 'medium' | 'low'; reason: string }[] {
    const recommendations: { productId: string; action: string; urgency: 'high' | 'medium' | 'low'; reason: string }[] = [];

    // High demand predictions
    for (const forecast of forecasts) {
      const totalPredicted = forecast.predictedDemand.week1 + forecast.predictedDemand.week2 +
                            forecast.predictedDemand.week3 + forecast.predictedDemand.week4;
      const currentDemand = forecast.currentDemand;

      // Stock up recommendation
      if (totalPredicted > currentDemand * 1.3) {
        recommendations.push({
          productId: forecast.productId,
          action: `Increase inventory for ${forecast.productName} - demand expected to rise ${Math.round((totalPredicted / currentDemand - 1) * 100)}%`,
          urgency: 'high',
          reason: 'Strong demand forecast with high confidence',
        });
      }

      // Wind down recommendation
      if (totalPredicted < currentDemand * 0.7 && forecast.confidence > 0.7) {
        recommendations.push({
          productId: forecast.productId,
          action: `Consider reducing inventory for ${forecast.productName} - demand expected to decline`,
          urgency: 'medium',
          reason: 'Declining demand forecast with high confidence',
        });
      }
    }

    // Growth rate recommendations
    if (growthRate > 20) {
      recommendations.push({
        productId: 'all',
        action: 'Overall demand is growing rapidly. Consider expanding inventory and marketing spend.',
        urgency: 'high',
        reason: `Growth rate of ${growthRate.toFixed(1)}% indicates strong market conditions`,
      });
    } else if (growthRate < -10) {
      recommendations.push({
        productId: 'all',
        action: 'Overall demand is declining. Review pricing strategy and marketing effectiveness.',
        urgency: 'high',
        reason: `Decline of ${Math.abs(growthRate).toFixed(1)}% requires attention`,
      });
    }

    return recommendations.sort((a, b) => {
      const urgencyOrder = { high: 0, medium: 1, low: 2 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
  }
}

export default new DemandForecastingService();