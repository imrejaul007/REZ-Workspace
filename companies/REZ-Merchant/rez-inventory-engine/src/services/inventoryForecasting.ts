/**
 * Inventory Forecasting Service
 * ML-based demand prediction and reorder recommendations
 */

import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HistoricalData {
  date: Date;
  quantity: number;
  revenue: number;
  dayOfWeek: number;
  isHoliday: boolean;
  promotions: number;
}

export interface ForecastResult {
  skuId: string;
  predictions: Array<{
    date: Date;
    predictedDemand: number;
    confidence: number;
    lowerBound: number;
    upperBound: number;
  }>;
  averageDailyDemand: number;
  seasonality: {
    dayOfWeek: { [key: number]: number };
    monthly: { [key: number]: number };
  };
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
}

export interface ReorderRecommendation {
  skuId: string;
  skuName: string;
  currentStock: number;
  safetyStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  suggestedOrderDate: Date;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  daysUntilStockout: number;
  confidence: number;
  reason: string;
}

// ── MongoDB Models ─────────────────────────────────────────────────────────────

const DemandHistorySchema = new Schema({
  skuId: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  quantity: { type: Number, required: true },
  revenue: { type: Number, default: 0 },
  dayOfWeek: { type: Number },
  isHoliday: { type: Boolean, default: false },
  promotions: { type: Number, default: 0 },
  weatherCondition: { type: String },
  temperature: { type: Number },
}, { timestamps: true });

DemandHistorySchema.index({ skuId: 1, date: -1 });

const ForecastCacheSchema = new Schema({
  skuId: { type: String, required: true, unique: true },
  predictions: Schema.Types.Mixed,
  generatedAt: { type: Date, default: Date.now },
  validUntil: { type: Date },
});

export const DemandHistory = mongoose.models.DemandHistory || mongoose.model('DemandHistory', DemandHistorySchema);
export const ForecastCache = mongoose.models.ForecastCache || mongoose.model('ForecastCache', ForecastCacheSchema);

// ── Forecasting Service ─────────────────────────────────────────────────────

class InventoryForecastingService {
  private readonly DEFAULT_FORECAST_DAYS = 30;
  private readonly HOLIDAY_DAYS = [1, 26]; // Jan 1, Jan 26 (Republic Day), etc.

  /**
   * Generate demand forecast for a SKU
   */
  async forecastDemand(
    skuId: string,
    daysAhead: number = this.DEFAULT_FORECAST_DAYS
  ): Promise<ForecastResult> {
    // Get historical data (last 90 days)
    const historicalData = await this.getHistoricalData(skuId, 90);

    if (historicalData.length < 7) {
      // Not enough data, return simple average
      return this.simpleForecast(skuId, daysAhead);
    }

    // Calculate base demand
    const baseDemand = this.calculateBaseDemand(historicalData);

    // Calculate seasonality
    const seasonality = this.calculateSeasonality(historicalData);

    // Detect trend
    const trend = this.detectTrend(historicalData);

    // Generate predictions
    const predictions = this.generatePredictions(
      skuId,
      daysAhead,
      baseDemand,
      seasonality,
      trend,
      historicalData
    );

    return {
      skuId,
      predictions,
      averageDailyDemand: baseDemand,
      seasonality,
      trend: trend.direction,
      trendPercentage: trend.percentage,
    };
  }

  /**
   * Get historical demand data
   */
  private async getHistoricalData(skuId: string, days: number): Promise<HistoricalData[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const records = await DemandHistory.find({
      skuId,
      date: { $gte: startDate },
    })
      .sort({ date: 1 })
      .lean();

    return records.map((r: any) => ({
      date: r.date,
      quantity: r.quantity,
      revenue: r.revenue,
      dayOfWeek: r.dayOfWeek || new Date(r.date).getDay(),
      isHoliday: r.isHoliday || false,
      promotions: r.promotions || 0,
    }));
  }

  /**
   * Calculate base demand (average)
   */
  private calculateBaseDemand(data: HistoricalData[]): number {
    const total = data.reduce((sum, d) => sum + d.quantity, 0);
    return total / data.length;
  }

  /**
   * Calculate seasonality patterns
   */
  private calculateSeasonality(data: HistoricalData[]): ForecastResult['seasonality'] {
    const dayOfWeek: { [key: number]: number[] } = {
      0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [],
    };
    const monthly: { [key: number]: number[] } = {
      0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [], 10: [], 11: [],
    };

    const avgDaily = this.calculateBaseDemand(data);

    data.forEach((d) => {
      const dow = new Date(d.date).getDay();
      const month = new Date(d.date).getMonth();
      dayOfWeek[dow].push(d.quantity / avgDaily);
      monthly[month].push(d.quantity / avgDaily);
    });

    // Calculate average multiplier for each day/month
    const dayMultipliers: { [key: number]: number } = {};
    const monthMultipliers: { [key: number]: number } = {};

    Object.keys(dayOfWeek).forEach((dow) => {
      const values = dayOfWeek[parseInt(dow)];
      dayMultipliers[parseInt(dow)] = values.length > 0
        ? values.reduce((a, b) => a + b, 0) / values.length
        : 1;
    });

    Object.keys(monthly).forEach((m) => {
      const values = monthly[parseInt(m)];
      monthMultipliers[parseInt(m)] = values.length > 0
        ? values.reduce((a, b) => a + b, 0) / values.length
        : 1;
    });

    return { dayOfWeek: dayMultipliers, monthly: monthMultipliers };
  }

  /**
   * Detect trend using linear regression
   */
  private detectTrend(data: HistoricalData[]): { direction: 'increasing' | 'decreasing' | 'stable'; percentage: number } {
    if (data.length < 14) {
      return { direction: 'stable', percentage: 0 };
    }

    // Simple linear regression
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    data.forEach((d, i) => {
      sumX += i;
      sumY += d.quantity;
      sumXY += i * d.quantity;
      sumXX += i * i;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const avgY = sumY / n;
    const percentage = avgY > 0 ? (slope / avgY) * 100 : 0;

    if (percentage > 5) return { direction: 'increasing', percentage };
    if (percentage < -5) return { direction: 'decreasing', percentage: Math.abs(percentage) };
    return { direction: 'stable', percentage: 0 };
  }

  /**
   * Generate predictions with confidence intervals
   */
  private generatePredictions(
    skuId: string,
    daysAhead: number,
    baseDemand: number,
    seasonality: ForecastResult['seasonality'],
    trend: { direction: string; percentage: number },
    historicalData: HistoricalData[]
  ): ForecastResult['predictions'] {
    const predictions: ForecastResult['predictions'] = [];
    const today = new Date();
    const stdDev = this.calculateStdDev(historicalData, baseDemand);

    for (let i = 1; i <= daysAhead; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      const dow = date.getDay();
      const month = date.getMonth();
      const isHoliday = this.isHoliday(date);

      // Apply seasonality
      let demand = baseDemand;
      demand *= seasonality.dayOfWeek[dow] || 1;
      demand *= seasonality.monthly[month] || 1;

      // Apply trend
      if (trend.direction === 'increasing') {
        demand *= 1 + (trend.percentage / 100) * (i / 30);
      } else if (trend.direction === 'decreasing') {
        demand *= 1 - (trend.percentage / 100) * (i / 30);
      }

      // Apply holiday adjustment
      if (isHoliday) {
        demand *= 1.5; // 50% boost on holidays
      }

      // Round to sensible values (min 0)
      demand = Math.max(0, Math.round(demand));

      // Confidence decreases with time
      const confidence = Math.max(0.5, 1 - (i / (daysAhead * 2)));

      // Confidence interval widens with time
      const interval = stdDev * Math.sqrt(i) * 1.96;

      predictions.push({
        date,
        predictedDemand: demand,
        confidence: Math.round(confidence * 100) / 100,
        lowerBound: Math.max(0, Math.round(demand - interval)),
        upperBound: Math.round(demand + interval),
      });
    }

    return predictions;
  }

  /**
   * Calculate standard deviation
   */
  private calculateStdDev(data: HistoricalData[], mean: number): number {
    if (data.length < 2) return mean * 0.5; // Default 50% variance

    const squaredDiffs = data.map((d) => Math.pow(d.quantity - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / data.length;
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Check if date is a holiday
   */
  private isHoliday(date: Date): boolean {
    const month = date.getMonth();
    const day = date.getDate();

    // Simplified Indian holidays
    const holidays = [
      [0, 1],   // Jan 1
      [0, 26],  // Jan 26
      [2, 29],  // Mar 29 (Good Friday - approximation)
      [3, 14],  // Apr 14
      [7, 15],  // Aug 15
      [8, 5],   // Sep 5
      [9, 2],   // Oct 2
      [10, 1],  // Nov 1
      [11, 25], // Dec 25
    ];

    return holidays.some(([m, d]) => m === month && d === day);
  }

  /**
   * Simple forecast when insufficient data
   */
  private simpleForecast(skuId: string, days: number): ForecastResult {
    const predictions: ForecastResult['predictions'] = [];
    const today = new Date();
    const avgDemand = 5; // Default

    for (let i = 1; i <= days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      predictions.push({
        date,
        predictedDemand: avgDemand,
        confidence: 0.5,
        lowerBound: 0,
        upperBound: avgDemand * 2,
      });
    }

    return {
      skuId,
      predictions,
      averageDailyDemand: avgDemand,
      seasonality: { dayOfWeek: {}, monthly: {} },
      trend: 'stable',
      trendPercentage: 0,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REORDER RECOMMENDATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generate reorder recommendations
   */
  async getReorderRecommendations(
    merchantId: string,
    storeId: string
  ): Promise<ReorderRecommendation[]> {
    // Get all SKUs with low stock
    const lowStockSKUs = await this.getLowStockSKUs(merchantId, storeId);

    const recommendations: ReorderRecommendation[] = [];

    for (const sku of lowStockSKUs) {
      const forecast = await this.forecastDemand(sku.skuId, 14);

      const avgDaily = forecast.averageDailyDemand;
      const daysUntilStockout = avgDaily > 0 ? sku.currentStock / avgDaily : Infinity;

      // Calculate reorder point (safety stock + lead time demand)
      const leadTimeDays = sku.leadTimeDays || 7;
      const safetyStock = avgDaily * (sku.safetyStockDays || 3);
      const reorderPoint = safetyStock + (avgDaily * leadTimeDays);

      // Calculate reorder quantity (cover X days of demand)
      const coverageDays = sku.coverageDays || 14;
      const reorderQuantity = Math.ceil(avgDaily * coverageDays);

      let urgency: 'critical' | 'high' | 'medium' | 'low';
      if (daysUntilStockout <= 3) urgency = 'critical';
      else if (daysUntilStockout <= 7) urgency = 'high';
      else if (daysUntilStockout <= 14) urgency = 'medium';
      else urgency = 'low';

      recommendations.push({
        skuId: sku.skuId,
        skuName: sku.name,
        currentStock: sku.currentStock,
        safetyStock: Math.round(safetyStock),
        reorderPoint: Math.round(reorderPoint),
        reorderQuantity,
        suggestedOrderDate: new Date(),
        urgency,
        daysUntilStockout: Math.round(daysUntilStockout),
        confidence: forecast.predictions[0]?.confidence || 0.5,
        reason: this.generateReorderReason(urgency, daysUntilStockout, avgDaily),
      });
    }

    // Sort by urgency
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    recommendations.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

    return recommendations;
  }

  /**
   * Get low stock SKUs
   */
  private async getLowStockSKUs(merchantId: string, storeId: string): Promise<any[]> {
    // This would query the inventory service
    // Mock implementation
    return [
      { skuId: 'SKU001', name: 'Chicken Breast', currentStock: 10, leadTimeDays: 3, safetyStockDays: 2, coverageDays: 7 },
      { skuId: 'SKU002', name: 'Tomato Sauce', currentStock: 5, leadTimeDays: 5, safetyStockDays: 3, coverageDays: 14 },
      { skuId: 'SKU003', name: 'Pizza Base', currentStock: 20, leadTimeDays: 2, safetyStockDays: 1, coverageDays: 7 },
    ];
  }

  /**
   * Generate reorder reason
   */
  private generateReorderReason(urgency: string, daysUntilStockout: number, avgDaily: number): string {
    if (urgency === 'critical') {
      return `Stock will run out in ${Math.round(daysUntilStockout)} days. Order immediately.`;
    }
    if (avgDaily > 20) {
      return `High-demand item (${Math.round(avgDaily)}/day). Reorder soon.`;
    }
    if (daysUntilStockout <= 7) {
      return `Approaching reorder point. Lead time is ${daysUntilStockout} days.`;
    }
    return `Scheduled reorder for ${Math.round(avgDaily * 7)} units/week coverage.`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DEMAND DATA MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Record actual demand (called after each sale)
   */
  async recordDemand(params: {
    skuId: string;
    quantity: number;
    revenue?: number;
    date?: Date;
    isHoliday?: boolean;
    promotions?: number;
  }): Promise<void> {
    const record = new DemandHistory({
      skuId: params.skuId,
      date: params.date || new Date(),
      quantity: params.quantity,
      revenue: params.revenue || 0,
      dayOfWeek: (params.date || new Date()).getDay(),
      isHoliday: params.isHoliday || false,
      promotions: params.promotions || 0,
    });

    await record.save();

    // Invalidate forecast cache
    await ForecastCache.deleteOne({ skuId: params.skuId });
  }

  /**
   * Get demand analytics
   */
  async getDemandAnalytics(skuId: string, days: number = 30): Promise<{
    totalSold: number;
    totalRevenue: number;
    avgDaily: number;
    peakDay: { day: string; quantity: number };
    trend: string;
  }> {
    const data = await this.getHistoricalData(skuId, days);

    if (data.length === 0) {
      return {
        totalSold: 0,
        totalRevenue: 0,
        avgDaily: 0,
        peakDay: { day: 'N/A', quantity: 0 },
        trend: 'No data',
      };
    }

    const totalSold = data.reduce((sum, d) => sum + d.quantity, 0);
    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
    const avgDaily = totalSold / days;

    // Find peak day
    const byDay: { [key: number]: number } = {};
    data.forEach((d) => {
      const dow = new Date(d.date).getDay();
      byDay[dow] = (byDay[dow] || 0) + d.quantity;
    });

    let peakDayNum = 0;
    let peakDayQty = 0;
    Object.entries(byDay).forEach(([dow, qty]) => {
      if (qty > peakDayQty) {
        peakDayNum = parseInt(dow);
        peakDayQty = qty;
      }
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const forecast = await this.forecastDemand(skuId, 7);

    return {
      totalSold,
      totalRevenue,
      avgDaily: Math.round(avgDaily * 100) / 100,
      peakDay: { day: dayNames[peakDayNum], quantity: peakDayQty },
      trend: forecast.trend,
    };
  }
}

export const inventoryForecastingService = new InventoryForecastingService();
export default inventoryForecastingService;
