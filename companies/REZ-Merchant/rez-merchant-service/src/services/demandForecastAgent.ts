import mongoose, { Types } from 'mongoose';
import { Order } from '../models/Order';
import { Store } from '../models/Store';
import { logger } from '../config/logger';

/**
 * Demand Forecasting Agent
 * Analyzes historical orders to detect patterns and predict future demand
 */

// Types and Interfaces
export interface DailyOrderData {
  date: string;
  orders: number;
  revenue: number;
  avgOrderValue: number;
  uniqueCustomers: number;
}

export interface PatternAnalysis {
  type: 'weekend_peak' | 'weekday_low' | 'seasonal' | 'trend' | 'cyclical' | 'event';
  description: string;
  impact: number; // Percentage impact on demand
  confidence: number; // 0-1 confidence score
  affectedDays?: number[]; // Day of week indices (0=Sunday)
}

export interface DemandForecast {
  date: string;
  predictedOrders: number;
  predictedRevenue: number;
  confidence: number;
  demandLevel: 'low' | 'medium' | 'high';
  factors: string[];
}

export interface ForecastResult {
  merchantId: string;
  storeId?: string;
  horizon: 7 | 14 | 30;
  generatedAt: Date;
  historicalAnalysis: {
    periodStart: Date;
    periodEnd: Date;
    totalOrders: number;
    totalRevenue: number;
    avgDailyOrders: number;
    avgDailyRevenue: number;
  };
  patterns: PatternAnalysis[];
  forecasts: DemandForecast[];
  demandSignals: DemandSignal[];
  recommendations: string[];
}

export interface DemandSignal {
  type: 'high_demand' | 'low_demand' | 'stock_alert' | 'opportunity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  affectedProducts?: string[];
  suggestedAction: string;
  triggerNextabiz?: 'procurement' | 'marketing';
}

export interface TimeSeriesPoint {
  date: Date;
  value: number;
}

const DAY_OF_WEEK_WEIGHTS: Record<number, number> = {
  0: 0.8,   // Sunday
  1: 0.9,   // Monday
  2: 0.95,  // Tuesday
  3: 1.0,   // Wednesday
  4: 1.05,  // Thursday
  5: 1.2,   // Friday
  6: 1.3,   // Saturday
};

const SEASONAL_MULTIPLIERS: Record<number, number> = {
  0: 1.0,   // January
  1: 0.95,  // February
  2: 1.0,   // March
  3: 1.05,  // April
  4: 1.1,   // May
  5: 1.15,  // June
  6: 1.2,   // July
  7: 1.25,  // August
  8: 1.1,   // September
  9: 1.0,   // October
  10: 1.15, // November
  11: 1.3,  // December
};

export class DemandForecastAgent {
  /**
   * Get all store IDs for a merchant
   */
  private static async getStoreIds(merchantId: string, storeId?: string): Promise<Types.ObjectId[]> {
    if (storeId) {
      return [new mongoose.Types.ObjectId(storeId)];
    }
    const stores = await Store.find({ merchantId: merchantId }, '_id').lean();
    return stores.map((s) => s._id);
  }

  /**
   * Aggregate daily order data for a period
   */
  private static async getDailyOrderData(
    storeIds: Types.ObjectId[],
    startDate: Date,
    endDate: Date
  ): Promise<DailyOrderData[]> {
    const aggregation = await Order.aggregate([
      {
        $match: {
          store: { $in: storeIds },
          createdAt: { $gte: startDate, $lte: endDate },
          'payment.status': 'paid',
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: '$totals.total' },
          uniqueCustomers: { $addToSet: '$user' },
        },
      },
      {
        $project: {
          date: '$_id',
          orders: 1,
          revenue: 1,
          avgOrderValue: { $cond: [{ $gt: ['$orders', 0] }, { $divide: ['$revenue', '$orders'] }, 0] },
          uniqueCustomers: { $size: '$uniqueCustomers' },
        },
      },
      { $sort: { date: 1 } },
    ]);

    return aggregation;
  }

  /**
   * Detect patterns in historical data
   */
  private static detectPatterns(dailyData: DailyOrderData[]): PatternAnalysis[] {
    const patterns: PatternAnalysis[] = [];

    if (dailyData.length < 14) {
      return patterns;
    }

    // Analyze day-of-week patterns
    const dayOfWeekOrders: Record<number, number[]> = {};
    for (const day of dailyData) {
      const date = new Date(day.date);
      const dayOfWeek = date.getDay();
      if (!dayOfWeekOrders[dayOfWeek]) {
        dayOfWeekOrders[dayOfWeek] = [];
      }
      dayOfWeekOrders[dayOfWeek].push(day.orders);
    }

    // Calculate average for each day
    const dayAverages = Object.entries(dayOfWeekOrders).map(([day, orders]) => ({
      day: parseInt(day),
      avg: orders.reduce((a, b) => a + b, 0) / orders.length,
    }));

    const overallAvg = dayAverages.reduce((sum, d) => sum + d.avg, 0) / dayAverages.length;

    // Detect weekend peak
    const weekendAvg = ((dayAverages.find(d => d.day === 0)?.avg || 0) + (dayAverages.find(d => d.day === 6)?.avg || 0)) / 2;
    if (weekendAvg > overallAvg * 1.15) {
      patterns.push({
        type: 'weekend_peak',
        description: 'Orders peak on weekends (Saturday/Sunday)',
        impact: ((weekendAvg - overallAvg) / overallAvg) * 100,
        confidence: 0.85,
        affectedDays: [0, 6],
      });
    }

    // Detect weekday low
    const weekdayAvg = dayAverages
      .filter(d => d.day >= 1 && d.day <= 5)
      .reduce((sum, d) => sum + d.avg, 0) / 5;
    if (weekdayAvg < overallAvg * 0.9) {
      patterns.push({
        type: 'weekday_low',
        description: 'Orders are lower on weekdays',
        impact: ((overallAvg - weekdayAvg) / overallAvg) * 100,
        confidence: 0.8,
        affectedDays: [1, 2, 3, 4, 5],
      });
    }

    // Detect trend
    const recentData = dailyData.slice(-14);
    const olderData = dailyData.slice(-28, -14);
    if (olderData.length >= 7) {
      const recentAvg = recentData.reduce((sum, d) => sum + d.orders, 0) / recentData.length;
      const olderAvg = olderData.reduce((sum, d) => sum + d.orders, 0) / olderData.length;
      const trendPercent = ((recentAvg - olderAvg) / olderAvg) * 100;

      if (Math.abs(trendPercent) > 10) {
        patterns.push({
          type: 'trend',
          description: trendPercent > 0 ? 'Upward trend in orders' : 'Downward trend in orders',
          impact: Math.abs(trendPercent),
          confidence: 0.75,
        });
      }
    }

    // Detect seasonal patterns (monthly comparison)
    const monthOrders: Record<number, number[]> = {};
    for (const day of dailyData) {
      const date = new Date(day.date);
      const month = date.getMonth();
      if (!monthOrders[month]) {
        monthOrders[month] = [];
      }
      monthOrders[month].push(day.orders);
    }

    const peakMonths = Object.entries(monthOrders)
      .filter(([_, orders]) => orders.length >= 7)
      .map(([month, orders]) => ({
        month: parseInt(month),
        avg: orders.reduce((a, b) => a + b, 0) / orders.length,
      }))
      .filter(m => m.avg > overallAvg * 1.2);

    if (peakMonths.length > 0) {
      patterns.push({
        type: 'seasonal',
        description: `Seasonal peak in months: ${peakMonths.map(m => m.month + 1).join(', ')}`,
        impact: ((peakMonths[0].avg - overallAvg) / overallAvg) * 100,
        confidence: 0.7,
      });
    }

    return patterns;
  }

  /**
   * Calculate demand level based on predicted orders
   */
  private static getDemandLevel(orders: number, avgOrders: number): 'low' | 'medium' | 'high' {
    const ratio = orders / avgOrders;
    if (ratio < 0.7) return 'low';
    if (ratio < 1.3) return 'medium';
    return 'high';
  }

  /**
   * Generate forecasts for the specified horizon
   */
  private static generateForecasts(
    dailyData: DailyOrderData[],
    patterns: PatternAnalysis[],
    horizon: 7 | 14 | 30,
    baseAvgOrders: number,
    baseAvgRevenue: number
  ): DemandForecast[] {
    const forecasts: DemandForecast[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate trend adjustment
    let trendMultiplier = 1.0;
    if (dailyData.length >= 28) {
      const recent = dailyData.slice(-7);
      const older = dailyData.slice(-14, -7);
      if (older.length > 0) {
        const recentAvg = recent.reduce((sum, d) => sum + d.orders, 0) / recent.length;
        const olderAvg = older.reduce((sum, d) => sum + d.orders, 0) / older.length;
        trendMultiplier = recentAvg / olderAvg;
      }
    }

    for (let i = 1; i <= horizon; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(forecastDate.getDate() + i);

      const dayOfWeek = forecastDate.getDay();
      const month = forecastDate.getMonth();

      // Start with base average
      let predictedOrders = baseAvgOrders;
      let confidence = 0.7;
      const factors: string[] = [];

      // Apply day-of-week weight
      const dowWeight = DAY_OF_WEEK_WEIGHTS[dayOfWeek] || 1.0;
      predictedOrders *= dowWeight;
      if (dowWeight > 1.1) {
        factors.push('Weekend boost expected');
        confidence += 0.05;
      } else if (dowWeight < 0.95) {
        factors.push('Weekday typically lower');
        confidence += 0.03;
      }

      // Apply seasonal multiplier
      const seasonalMultiplier = SEASONAL_MULTIPLIERS[month] || 1.0;
      predictedOrders *= seasonalMultiplier;
      if (seasonalMultiplier > 1.1) {
        factors.push('Peak season period');
        confidence += 0.03;
      }

      // Apply trend
      if (trendMultiplier > 1.1) {
        predictedOrders *= trendMultiplier;
        factors.push('Growing demand trend');
        confidence += 0.05;
      } else if (trendMultiplier < 0.9) {
        predictedOrders *= trendMultiplier;
        factors.push('Declining trend detected');
        confidence -= 0.05;
      }

      // Apply pattern impacts
      for (const pattern of patterns) {
        if (pattern.affectedDays && pattern.affectedDays.includes(dayOfWeek)) {
          predictedOrders *= (1 + pattern.impact / 100);
          factors.push(`${pattern.type}: ${pattern.impact.toFixed(0)}%`);
        }
      }

      // Ensure positive values
      predictedOrders = Math.max(1, Math.round(predictedOrders));

      // Calculate predicted revenue based on historical avg order value
      const historicalAvgOrderValue = dailyData.length > 0
        ? dailyData.reduce((sum, d) => sum + d.revenue, 0) / dailyData.reduce((sum, d) => sum + d.orders, 0)
        : baseAvgRevenue / baseAvgOrders;

      const predictedRevenue = predictedOrders * historicalAvgOrderValue;

      // Confidence decreases for further dates
      const dateConfidence = Math.max(0.5, confidence - (i * 0.01));

      forecasts.push({
        date: forecastDate.toISOString().split('T')[0],
        predictedOrders,
        predictedRevenue: Math.round(predictedRevenue),
        confidence: Math.min(0.95, dateConfidence),
        demandLevel: this.getDemandLevel(predictedOrders, baseAvgOrders),
        factors,
      });
    }

    return forecasts;
  }

  /**
   * Generate demand signals based on forecasts and historical data
   */
  private static generateDemandSignals(
    forecasts: DemandForecast[],
    avgDailyOrders: number,
    patterns: PatternAnalysis[]
  ): DemandSignal[] {
    const signals: DemandSignal[] = [];

    // Check for high demand periods
    const highDemandDays = forecasts.filter(f => f.demandLevel === 'high');
    if (highDemandDays.length >= 3) {
      signals.push({
        type: 'high_demand',
        severity: highDemandDays.length >= 5 ? 'high' : 'medium',
        message: `${highDemandDays.length} days of high demand predicted in the next ${forecasts.length} days`,
        suggestedAction: 'Increase inventory and staff to meet anticipated demand',
        triggerNextabiz: 'procurement',
      });
    }

    // Check for low demand periods
    const lowDemandDays = forecasts.filter(f => f.demandLevel === 'low');
    if (lowDemandDays.length >= 3) {
      signals.push({
        type: 'low_demand',
        severity: lowDemandDays.length >= 5 ? 'high' : 'medium',
        message: `${lowDemandDays.length} days of low demand predicted - consider promotions`,
        suggestedAction: 'Run targeted marketing campaigns to boost sales during slow periods',
        triggerNextabiz: 'marketing',
      });
    }

    // Check for weekend peaks
    const weekendPattern = patterns.find(p => p.type === 'weekend_peak');
    if (weekendPattern) {
      signals.push({
        type: 'opportunity',
        severity: 'low',
        message: `Weekend peak detected - maximize revenue with special offers`,
        suggestedAction: 'Prepare for weekend surge with adequate staffing and inventory',
      });
    }

    // Check for weekday lows
    const weekdayPattern = patterns.find(p => p.type === 'weekday_low');
    if (weekdayPattern) {
      signals.push({
        type: 'low_demand',
        severity: 'medium',
        message: 'Weekday demand is typically lower - consider lunch specials or business lunch deals',
        suggestedAction: 'Create targeted weekday promotions for lunch hours or afternoon tea',
        triggerNextabiz: 'marketing',
      });
    }

    // Check for declining trend
    const trendPattern = patterns.find(p => p.type === 'trend' && p.impact < -10);
    if (trendPattern) {
      signals.push({
        type: 'low_demand',
        severity: 'high',
        message: 'Declining order trend detected - investigate and take corrective action',
        suggestedAction: 'Review customer feedback, competitor activity, and consider promotional campaigns',
        triggerNextabiz: 'marketing',
      });
    }

    return signals;
  }

  /**
   * Generate actionable recommendations based on forecast data
   */
  private static generateRecommendations(
    forecasts: DemandForecast[],
    patterns: PatternAnalysis[],
    signals: DemandSignal[]
  ): string[] {
    const recommendations: string[] = [];

    // High demand recommendations
    const highDemandDays = forecasts.filter(f => f.demandLevel === 'high').length;
    if (highDemandDays > 0) {
      recommendations.push(
        `Prepare for ${highDemandDays} high-demand days by increasing inventory by 30-50%`
      );
      recommendations.push('Schedule additional staff for peak hours (typically 12-2 PM and 7-9 PM)');
      recommendations.push('Consider pre-preparing popular items to reduce wait times');
    }

    // Low demand recommendations
    const lowDemandDays = forecasts.filter(f => f.demandLevel === 'low').length;
    if (lowDemandDays > 0) {
      recommendations.push(
        `Implement promotions for ${lowDemandDays} low-demand days to boost sales`
      );
      recommendations.push('Consider happy hour deals or early bird discounts');
      recommendations.push('Use social media and push notifications to drive traffic');
    }

    // Pattern-based recommendations
    for (const pattern of patterns) {
      switch (pattern.type) {
        case 'weekend_peak':
          recommendations.push('Maximize weekend revenue with special menus and promotions');
          recommendations.push('Ensure adequate stock for Saturday/Sunday peak periods');
          break;
        case 'weekday_low':
          recommendations.push('Launch Tuesday-Thursday specials to boost weekday sales');
          recommendations.push('Consider corporate meal packages for weekday business');
          break;
        case 'seasonal':
          recommendations.push('Prepare seasonal menu items to capitalize on current trends');
          break;
        case 'trend':
          recommendations.push('Monitor daily metrics to track trend direction');
          break;
      }
    }

    // Signal-based recommendations
    for (const signal of signals) {
      if (signal.suggestedAction && !recommendations.includes(signal.suggestedAction)) {
        recommendations.push(signal.suggestedAction);
      }
    }

    return Array.from(new Set(recommendations)).slice(0, 10); // Deduplicate and limit to 10
  }

  /**
   * Main forecasting method
   * @param merchantId Merchant identifier
   * @param horizon Forecast horizon: 7, 14, or 30 days
   * @param storeId Optional specific store ID
   * @param historicalDays Number of historical days to analyze (default 90)
   */
  static async forecast(
    merchantId: string,
    horizon: 7 | 14 | 30 = 7,
    storeId?: string,
    historicalDays: number = 90
  ): Promise<ForecastResult> {
    const startTime = Date.now();
    logger.info(`[DemandForecastAgent] Starting forecast for merchant ${merchantId}`);

    try {
      // Get store IDs
      const storeIds = await this.getStoreIds(merchantId, storeId);
      if (storeIds.length === 0) {
        throw new Error('No stores found for merchant');
      }

      // Define historical period
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - historicalDays);
      startDate.setHours(0, 0, 0, 0);

      // Get historical data
      const dailyData = await this.getDailyOrderData(storeIds, startDate, endDate);

      // Calculate historical metrics
      const totalOrders = dailyData.reduce((sum, d) => sum + d.orders, 0);
      const totalRevenue = dailyData.reduce((sum, d) => sum + d.revenue, 0);
      const avgDailyOrders = totalOrders / (dailyData.length || 1);
      const avgDailyRevenue = totalRevenue / (dailyData.length || 1);

      // Detect patterns
      const patterns = this.detectPatterns(dailyData);

      // Generate forecasts
      const forecasts = this.generateForecasts(
        dailyData,
        patterns,
        horizon,
        avgDailyOrders,
        avgDailyRevenue
      );

      // Generate demand signals
      const demandSignals = this.generateDemandSignals(forecasts, avgDailyOrders, patterns);

      // Generate recommendations
      const recommendations = this.generateRecommendations(forecasts, patterns, demandSignals);

      const result: ForecastResult = {
        merchantId,
        storeId,
        horizon,
        generatedAt: new Date(),
        historicalAnalysis: {
          periodStart: startDate,
          periodEnd: endDate,
          totalOrders,
          totalRevenue,
          avgDailyOrders: Math.round(avgDailyOrders * 100) / 100,
          avgDailyRevenue: Math.round(avgDailyRevenue * 100) / 100,
        },
        patterns,
        forecasts,
        demandSignals,
        recommendations,
      };

      const duration = Date.now() - startTime;
      logger.info(`[DemandForecastAgent] Forecast completed in ${duration}ms`, {
        merchantId,
        horizon,
        patternsDetected: patterns.length,
        forecastsGenerated: forecasts.length,
        signalsGenerated: demandSignals.length,
      });

      return result;
    } catch (error) {
      const err = error as Error;
      logger.error(`[DemandForecastAgent] Forecast failed: ${err.message}`, {
        merchantId,
        error: err.stack,
      });
      throw error;
    }
  }

  /**
   * Get demand analysis for a specific time period
   */
  static async getDemandAnalysis(
    merchantId: string,
    startDate: Date,
    endDate: Date,
    storeId?: string
  ): Promise<{
    dailyData: DailyOrderData[];
    patterns: PatternAnalysis[];
    summary: {
      totalOrders: number;
      totalRevenue: number;
      avgDailyOrders: number;
      avgDailyRevenue: number;
      peakDay: { date: string; orders: number } | null;
      lowDay: { date: string; orders: number } | null;
    };
  }> {
    const storeIds = await this.getStoreIds(merchantId, storeId);
    const dailyData = await this.getDailyOrderData(storeIds, startDate, endDate);
    const patterns = this.detectPatterns(dailyData);

    const totalOrders = dailyData.reduce((sum, d) => sum + d.orders, 0);
    const totalRevenue = dailyData.reduce((sum, d) => sum + d.revenue, 0);

    const peakDay = dailyData.length > 0
      ? dailyData.reduce((max, d) => (d.orders > max.orders ? d : max))
      : null;
    const lowDay = dailyData.length > 0
      ? dailyData.reduce((min, d) => (d.orders < min.orders ? d : min))
      : null;

    return {
      dailyData,
      patterns,
      summary: {
        totalOrders,
        totalRevenue,
        avgDailyOrders: Math.round((totalOrders / (dailyData.length || 1)) * 100) / 100,
        avgDailyRevenue: Math.round((totalRevenue / (dailyData.length || 1)) * 100) / 100,
        peakDay: peakDay ? { date: peakDay.date, orders: peakDay.orders } : null,
        lowDay: lowDay ? { date: lowDay.date, orders: lowDay.orders } : null,
      },
    };
  }
}

export default DemandForecastAgent;
