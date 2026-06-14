import { SalesHistory, Product, Forecast, Alert } from '../models/Forecast';
import { logger } from '../config/logger';
import mongoose from 'mongoose';

export interface ForecastResult {
  productId: string;
  forecastDate: Date;
  periods: {
    date: Date;
    predicted: number;
    lowerBound: number;
    upperBound: number;
  }[];
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  seasonality: 'high' | 'medium' | 'low' | 'none';
  model: string;
  accuracy?: number;
}

export class ForecastEngine {
  private static instance: ForecastEngine;

  static getInstance(): ForecastEngine {
    if (!ForecastEngine.instance) {
      ForecastEngine.instance = new ForecastEngine();
    }
    return ForecastEngine.instance;
  }

  /**
   * Simple Moving Average (SMA) forecasting
   */
  calculateSMA(data: number[], periods: number): number {
    if (data.length === 0) return 0;
    const slice = data.slice(-periods);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  }

  /**
   * Weighted Moving Average (WMA) - more weight to recent data
   */
  calculateWMA(data: number[], periods: number): number {
    if (data.length === 0) return 0;
    const slice = data.slice(-periods);
    const weights = slice.map((_, i) => i + 1);
    const sumWeights = weights.reduce((a, b) => a + b, 0);
    return slice.reduce((sum, val, i) => sum + val * weights[i], 0) / sumWeights;
  }

  /**
   * Exponential Moving Average (EMA)
   */
  calculateEMA(data: number[], periods: number): number {
    if (data.length === 0) return 0;
    const k = 2 / (periods + 1);
    let ema = data[0];

    for (let i = 1; i < data.length; i++) {
      ema = data[i] * k + ema * (1 - k);
    }

    return ema;
  }

  /**
   * Calculate trend direction
   */
  calculateTrend(data: number[]): 'up' | 'down' | 'stable' {
    if (data.length < 2) return 'stable';

    // Simple linear regression slope
    const n = data.length;
    const xMean = (n - 1) / 2;
    const yMean = data.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (data[i] - yMean);
      denominator += Math.pow(i - xMean, 2);
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const avgValue = yMean !== 0 ? Math.abs(slope / yMean) : 0;

    if (avgValue > 0.1) return slope > 0 ? 'up' : 'down';
    return 'stable';
  }

  /**
   * Calculate seasonality factor based on month
   */
  calculateSeasonality(date: Date, productSeasonality?: 'high' | 'medium' | 'low'): number {
    const month = date.getMonth() + 1; // 1-12

    // Default seasonality patterns (could be customized per product)
    const seasonalityPatterns: Record<string, number[]> = {
      high: [1.2, 1.1, 1.0, 1.0, 1.0, 0.9, 0.8, 0.9, 1.0, 1.1, 1.3, 1.4],
      medium: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
      low: [0.9, 0.9, 0.95, 1.0, 1.0, 1.0, 1.0, 1.0, 1.05, 1.0, 1.0, 0.95],
      none: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
    };

    const pattern = seasonalityPatterns[productSeasonality || 'none'];
    return pattern[month - 1];
  }

  /**
   * Calculate forecast confidence based on data quality
   */
  calculateConfidence(dataLength: number, variance: number): number {
    // More data = higher confidence
    let confidence = Math.min(dataLength / 30, 1) * 0.5;

    // Lower variance = higher confidence
    if (variance < 0.2) confidence += 0.3;
    else if (variance < 0.5) confidence += 0.2;
    else if (variance < 1.0) confidence += 0.1;

    return Math.min(Math.max(confidence, 0.5), 0.95);
  }

  /**
   * Generate forecast for a product
   */
  async generateForecast(
    productId: string,
    forecastDays: number = 30
  ): Promise<ForecastResult> {
    try {
      // Get sales history
      const salesData = await SalesHistory.find({ productId })
        .sort({ date: -1 })
        .limit(90)
        .lean();

      const product = await Product.findById(productId);

      // Extract quantity values
      const quantities = salesData.map(s => s.quantity).reverse();
      const avgDemand = quantities.length > 0
        ? quantities.reduce((a, b) => a + b, 0) / quantities.length
        : 0;

      // Calculate variance
      const variance = quantities.length > 0
        ? this.calculateVariance(quantities, avgDemand)
        : 1;

      // Generate forecast periods
      const periods = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Use multiple methods and average
      const sma7 = this.calculateSMA(quantities, 7);
      const wma7 = this.calculateWMA(quantities, 7);
      const ema7 = this.calculateEMA(quantities, 7);
      const sma14 = this.calculateSMA(quantities, 14);

      // Base prediction using weighted average of methods
      const basePrediction = (sma7 * 0.2 + wma7 * 0.3 + ema7 * 0.3 + sma14 * 0.2);

      const trend = this.calculateTrend(quantities);
      const seasonality = product?.seasonality || 'none';

      for (let i = 1; i <= forecastDays; i++) {
        const forecastDate = new Date(today);
        forecastDate.setDate(forecastDate.getDate() + i);

        const seasonalityFactor = this.calculateSeasonality(forecastDate, seasonality);

        // Apply trend adjustment
        let trendFactor = 1;
        if (trend === 'up') trendFactor = 1 + (i * 0.005);
        else if (trend === 'down') trendFactor = 1 - (i * 0.005);

        const predicted = Math.max(0, Math.round(basePrediction * seasonalityFactor * trendFactor));

        // Calculate confidence bounds (wider for further predictions)
        const confidenceWidth = variance * predicted * (1 + i * 0.02);
        const lowerBound = Math.max(0, Math.round(predicted - confidenceWidth));
        const upperBound = Math.round(predicted + confidenceWidth);

        periods.push({
          date: forecastDate,
          predicted,
          lowerBound,
          upperBound,
        });
      }

      const confidence = this.calculateConfidence(quantities.length, variance);

      return {
        productId,
        forecastDate: new Date(),
        periods,
        confidence,
        trend,
        seasonality,
        model: 'hybrid_sma_wma_ema',
        accuracy: quantities.length >= 14 ? (1 - variance) * 100 : undefined,
      };
    } catch (error) {
      logger.error('Failed to generate forecast', { error, productId });
      throw error;
    }
  }

  private calculateVariance(data: number[], mean: number): number {
    if (data.length === 0) return 1;
    const squaredDiffs = data.map(x => Math.pow(x - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / data.length;
    return mean > 0 ? Math.sqrt(avgSquaredDiff) / mean : 1;
  }

  /**
   * Calculate reorder recommendation
   */
  async calculateReorderRecommendation(productId: string): Promise<{
    shouldReorder: boolean;
    recommendedQuantity: number;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    daysUntilStockout: number;
    safetyStockLevel: number;
  }> {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Get current forecast
    const forecast = await this.generateForecast(productId, product.leadTime + 7);
    const avgDailyDemand = forecast.periods.slice(0, product.leadTime)
      .reduce((sum, p) => sum + p.predicted, 0) / product.leadTime;

    // Calculate days until stockout
    const daysUntilStockout = avgDailyDemand > 0
      ? product.currentStock / avgDailyDemand
      : Infinity;

    // Determine urgency
    let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (daysUntilStockout <= product.leadTime * 0.5) urgency = 'critical';
    else if (daysUntilStockout <= product.leadTime) urgency = 'high';
    else if (daysUntilStockout <= product.leadTime * 1.5) urgency = 'medium';

    // Calculate recommended order quantity
    const targetStock = avgDailyDemand * (product.leadTime + 7); // 7 days buffer
    const recommendedQuantity = Math.max(0, Math.ceil(targetStock - product.currentStock));

    const shouldReorder = product.currentStock <= product.reorderPoint ||
                          daysUntilStockout <= product.leadTime;

    return {
      shouldReorder,
      recommendedQuantity,
      urgency,
      daysUntilStockout: Math.round(daysUntilStockout),
      safetyStockLevel: product.safetyStock,
    };
  }

  /**
   * Detect demand anomalies and create alerts
   */
  async detectAnomalies(productId: string): Promise<Alert[]> {
    const product = await Product.findById(productId);
    if (!product) return [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [recentSales, previousSales] = await Promise.all([
      SalesHistory.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(productId), date: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$quantity' }, avg: { $avg: '$quantity' } } },
      ]),
      SalesHistory.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(productId), date: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$quantity' }, avg: { $avg: '$quantity' } } },
      ]),
    ]);

    const alerts: Alert[] = [];

    if (recentSales.length > 0 && previousSales.length > 0) {
      const recentAvg = recentSales[0].avg;
      const previousAvg = previousSales[0].avg;
      const change = previousAvg > 0 ? (recentAvg - previousAvg) / previousAvg : 0;

      // Demand spike (>50% increase)
      if (change > 0.5) {
        const alert = await Alert.create({
          productId,
          type: 'demand_spike',
          severity: change > 1 ? 'high' : 'medium',
          message: `Demand increased by ${Math.round(change * 100)}% compared to last period`,
          currentValue: recentAvg,
          threshold: previousAvg * 1.5,
        });
        alerts.push(alert);
      }

      // Demand drop (>30% decrease)
      if (change < -0.3) {
        const alert = await Alert.create({
          productId,
          type: 'demand_drop',
          severity: change < -0.5 ? 'high' : 'medium',
          message: `Demand decreased by ${Math.round(Math.abs(change) * 100)}% compared to last period`,
          currentValue: recentAvg,
          threshold: previousAvg * 0.7,
        });
        alerts.push(alert);
      }
    }

    // Low stock alert
    if (product.currentStock <= product.safetyStock) {
      const alert = await Alert.create({
        productId,
        type: 'low_stock',
        severity: product.currentStock <= product.safetyStock * 0.5 ? 'critical' : 'high',
        message: `Stock level (${product.currentStock}) is at or below safety stock (${product.safetyStock})`,
        currentValue: product.currentStock,
        threshold: product.safetyStock,
      });
      alerts.push(alert);
    }

    // Overstock alert
    if (product.currentStock > product.maxStock) {
      const alert = await Alert.create({
        productId,
        type: 'overstock',
        severity: product.currentStock > product.maxStock * 1.5 ? 'high' : 'medium',
        message: `Stock level (${product.currentStock}) exceeds maximum (${product.maxStock})`,
        currentValue: product.currentStock,
        threshold: product.maxStock,
      });
      alerts.push(alert);
    }

    return alerts;
  }

  /**
   * Get demand statistics for a product
   */
  async getDemandStats(productId: string): Promise<{
    totalSales: number;
    avgDailySales: number;
    maxDailySales: number;
    minDailySales: number;
    totalRevenue: number;
    forecastConfidence: number;
    trend: 'up' | 'down' | 'stable';
    seasonality: 'high' | 'medium' | 'low' | 'none';
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [stats, forecast] = await Promise.all([
      SalesHistory.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(productId), date: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$quantity' },
            avgDailySales: { $avg: '$quantity' },
            maxDailySales: { $max: '$quantity' },
            minDailySales: { $min: '$quantity' },
            totalRevenue: { $sum: '$revenue' },
          },
        },
      ]),
      Forecast.findOne({ productId }).sort({ forecastDate: -1 }),
    ]);

    const result = stats[0] || {
      totalSales: 0,
      avgDailySales: 0,
      maxDailySales: 0,
      minDailySales: 0,
      totalRevenue: 0,
    };

    return {
      totalSales: result.totalSales,
      avgDailySales: Math.round(result.avgDailySales * 100) / 100,
      maxDailySales: result.maxDailySales,
      minDailySales: result.minDailySales,
      totalRevenue: result.totalRevenue,
      forecastConfidence: forecast?.confidence || 0,
      trend: forecast?.trend || 'stable',
      seasonality: forecast?.seasonality || 'none',
    };
  }
}

export const forecastEngine = ForecastEngine.getInstance();
