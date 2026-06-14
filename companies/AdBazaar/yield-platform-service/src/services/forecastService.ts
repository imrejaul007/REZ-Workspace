import { YieldForecast, YieldSummary } from '../models';
import logger from '../utils/logger';
import { forecastAccuracy } from '../utils/metrics';

export interface ForecastParams {
  horizon: 'hourly' | 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  inventoryType?: string;
}

export interface ForecastResult {
  forecasts: {
    date: Date;
    predicted: {
      revenue: number;
      ecpm: number;
      fillRate: number;
      impressions: number;
    };
    confidence: {
      overall: number;
      revenue: { lower: number; upper: number; confidence: number };
      ecpm: { lower: number; upper: number; confidence: number };
      fillRate: { lower: number; upper: number; confidence: number };
    };
    factors: {
      name: string;
      impact: number;
      weight: number;
      direction: 'positive' | 'negative' | 'neutral';
    }[];
  }[];
  summary: {
    totalPredictedRevenue: number;
    avgPredictedEcpm: number;
    avgPredictedFillRate: number;
    totalPredictedImpressions: number;
    confidenceTrend: 'improving' | 'stable' | 'declining';
  };
  model: string;
}

class ForecastService {
  /**
   * Generate yield forecasts
   */
  async forecast(params: ForecastParams): Promise<ForecastResult> {
    const { horizon, startDate, endDate, inventoryType } = params;

    logger.info('Generating yield forecast', { horizon, startDate, endDate, inventoryType });

    try {
      // Get historical data for forecasting
      const historicalData = await this.getHistoricalData(startDate, endDate, inventoryType);

      // Generate forecasts based on horizon
      const forecasts = await this.generateForecasts(
        historicalData,
        startDate,
        endDate,
        horizon,
        inventoryType
      );

      // Calculate summary
      const summary = this.calculateSummary(forecasts);

      // Record accuracy metrics
      if (forecasts.length > 0) {
        const avgConfidence = forecasts.reduce((sum, f) => sum + f.confidence.overall, 0) / forecasts.length;
        forecastAccuracy.labels(horizon).set(avgConfidence);
      }

      logger.info('Forecast generation completed', {
        horizon,
        forecastCount: forecasts.length,
        totalPredictedRevenue: summary.totalPredictedRevenue
      });

      return {
        forecasts,
        summary,
        model: 'moving_average_weighted'
      };
    } catch (error) {
      logger.error('Forecast generation failed', { error });
      throw error;
    }
  }

  /**
   * Get historical data for forecasting
   */
  private async getHistoricalData(startDate: Date, endDate: Date, inventoryType?: string): Promise<any[]> {
    // Get data from past 30 days for training
    const trainingStart = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const summaries = await YieldSummary.find({
      date: { $gte: trainingStart, $lte: endDate },
      ...(inventoryType && { 'inventory.breakdown.inventoryType': inventoryType })
    }).sort({ date: 1 });

    if (summaries.length === 0) {
      // Return mock historical data
      return this.getMockHistoricalData();
    }

    return summaries.map(s => ({
      date: s.date,
      revenue: s.revenue.total,
      ecpm: s.ecpm.average,
      fillRate: s.fillRate.overall,
      impressions: s.inventory.total,
      requests: s.requests.total
    }));
  }

  /**
   * Generate forecasts using weighted moving average
   */
  private async generateForecasts(
    historicalData: any[],
    startDate: Date,
    endDate: Date,
    horizon: string,
    inventoryType?: string
  ): Promise<any[]> {
    const forecasts: any[] = [];
    const currentDate = new Date(startDate);

    // Calculate weighted averages from historical data
    const weights = this.calculateWeights(historicalData.length);
    const averages = this.calculateWeightedAverages(historicalData, weights);

    // Calculate trend
    const trend = this.calculateTrend(historicalData);

    // Generate forecast for each period
    while (currentDate <= endDate) {
      // Calculate days from start
      const daysFromStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));

      // Apply trend and seasonality
      const seasonalityFactor = this.getSeasonalityFactor(currentDate, historicalData);
      const trendFactor = 1 + (trend * daysFromStart * 0.01);

      // Calculate predicted values
      const baseRevenue = averages.revenue;
      const baseEcpm = averages.ecpm;
      const baseFillRate = averages.fillRate;
      const baseImpressions = averages.impressions;

      const predictedRevenue = baseRevenue * seasonalityFactor * trendFactor;
      const predictedEcpm = baseEcpm * seasonalityFactor * trendFactor;
      const predictedFillRate = Math.min(100, Math.max(0, baseFillRate * seasonalityFactor * trendFactor));
      const predictedImpressions = baseImpressions * seasonalityFactor * trendFactor;

      // Calculate confidence intervals (widens for longer horizons)
      const horizonMultiplier = this.getHorizonMultiplier(horizon, daysFromStart);
      const confidence = Math.max(0.5, 1 - (horizonMultiplier * 0.1));

      const forecasts: any[] = [];

      forecasts.push({
        date: new Date(currentDate),
        predicted: {
          revenue: Math.round(predictedRevenue * 100) / 100,
          ecpm: Math.round(predictedEcpm * 100) / 100,
          fillRate: Math.round(predictedFillRate * 100) / 100,
          impressions: Math.round(predictedImpressions)
        },
        confidence: {
          overall: Math.round(confidence * 100) / 100,
          revenue: {
            lower: Math.round(predictedRevenue * (1 - horizonMultiplier * 0.15) * 100) / 100,
            upper: Math.round(predictedRevenue * (1 + horizonMultiplier * 0.15) * 100) / 100,
            confidence: Math.round(confidence * 100) / 100
          },
          ecpm: {
            lower: Math.round(predictedEcpm * (1 - horizonMultiplier * 0.1) * 100) / 100,
            upper: Math.round(predictedEcpm * (1 + horizonMultiplier * 0.1) * 100) / 100,
            confidence: Math.round(confidence * 100) / 100
          },
          fillRate: {
            lower: Math.round(Math.max(0, predictedFillRate * (1 - horizonMultiplier * 0.08)) * 100) / 100,
            upper: Math.round(Math.min(100, predictedFillRate * (1 + horizonMultiplier * 0.08)) * 100) / 100,
            confidence: Math.round(confidence * 100) / 100
          }
        },
        factors: this.identifyFactors(historicalData, currentDate)
      });

      // Increment date based on horizon
      this.incrementDate(currentDate, horizon);
    }

    return forecasts;
  }

  /**
   * Calculate weights for weighted moving average (more recent = higher weight)
   */
  private calculateWeights(dataLength: number): number[] {
    const weights: number[] = [];
    const totalWeight = (dataLength * (dataLength + 1)) / 2;

    for (let i = 0; i < dataLength; i++) {
      weights.push((i + 1) / totalWeight);
    }

    return weights;
  }

  /**
   * Calculate weighted averages
   */
  private calculateWeightedAverages(data: any[], weights: number[]): any {
    if (data.length === 0) {
      return { revenue: 0, ecpm: 0, fillRate: 0, impressions: 0 };
    }

    const result = data.reduce(
      (acc, item, index) => ({
        revenue: acc.revenue + item.revenue * weights[index],
        ecpm: acc.ecpm + item.ecpm * weights[index],
        fillRate: acc.fillRate + item.fillRate * weights[index],
        impressions: acc.impressions + item.impressions * weights[index]
      }),
      { revenue: 0, ecpm: 0, fillRate: 0, impressions: 0 }
    );

    return result;
  }

  /**
   * Calculate linear trend
   */
  private calculateTrend(data: any[]): number {
    if (data.length < 2) return 0;

    const n = data.length;
    const xMean = (n - 1) / 2;
    const yMean = data.reduce((sum, d) => sum + d.revenue, 0) / n;

    let numerator = 0;
    let denominator = 0;

    data.forEach((d, i) => {
      numerator += (i - xMean) * (d.revenue - yMean);
      denominator += (i - xMean) * (i - xMean);
    });

    return denominator !== 0 ? numerator / denominator : 0;
  }

  /**
   * Get seasonality factor based on date
   */
  private getSeasonalityFactor(date: Date, _historicalData: any[]): number {
    const dayOfWeek = date.getDay();
    const hourOfDay = date.getHours();

    // Weekend factor
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.85 : 1.0;

    // Hour of day factor
    let hourFactor = 1.0;
    if (hourOfDay >= 9 && hourOfDay <= 17) {
      hourFactor = 1.2; // Business hours
    } else if (hourOfDay >= 18 && hourOfDay <= 22) {
      hourFactor = 1.1; // Evening
    } else if (hourOfDay >= 23 || hourOfDay <= 6) {
      hourFactor = 0.7; // Late night
    }

    return weekendFactor * hourFactor;
  }

  /**
   * Get horizon multiplier
   */
  private getHorizonMultiplier(horizon: string, daysFromStart: number): number {
    const baseMultiplier = {
      hourly: 1,
      daily: 2,
      weekly: 5,
      monthly: 10
    }[horizon] || 2;

    return baseMultiplier + (daysFromStart * 0.1);
  }

  /**
   * Increment date based on horizon
   */
  private incrementDate(date: Date, horizon: string): void {
    switch (horizon) {
      case 'hourly':
        date.setHours(date.getHours() + 1);
        break;
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
    }
  }

  /**
   * Identify factors affecting the forecast
   */
  private identifyFactors(historicalData: any[], _forecastDate: Date): any[] {
    const factors: any[] = [];

    // Trend factor
    const trend = this.calculateTrend(historicalData);
    if (Math.abs(trend) > 0.01) {
      factors.push({
        name: 'Revenue Trend',
        impact: Math.round(trend * 100) / 100,
        weight: 0.3,
        direction: trend > 0 ? 'positive' : 'negative'
      });
    }

    // Day of week factor
    factors.push({
      name: 'Day of Week Seasonality',
      impact: 5,
      weight: 0.2,
      direction: 'neutral'
    });

    // Historical variance factor
    if (historicalData.length > 1) {
      const revenues = historicalData.map(d => d.revenue);
      const avg = revenues.reduce((a, b) => a + b, 0) / revenues.length;
      const variance = revenues.reduce((sum, r) => sum + Math.pow(r - avg, 2), 0) / revenues.length;
      const stdDev = Math.sqrt(variance);
      const cv = avg > 0 ? stdDev / avg : 0;

      factors.push({
        name: 'Historical Variance',
        impact: Math.round(cv * 100),
        weight: 0.15,
        direction: 'neutral'
      });
    }

    return factors;
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(forecasts: any[]): any {
    if (forecasts.length === 0) {
      return {
        totalPredictedRevenue: 0,
        avgPredictedEcpm: 0,
        avgPredictedFillRate: 0,
        totalPredictedImpressions: 0,
        confidenceTrend: 'stable' as const
      };
    }

    const totalRevenue = forecasts.reduce((sum, f) => sum + f.predicted.revenue, 0);
    const avgEcpm = forecasts.reduce((sum, f) => sum + f.predicted.ecpm, 0) / forecasts.length;
    const avgFillRate = forecasts.reduce((sum, f) => sum + f.predicted.fillRate, 0) / forecasts.length;
    const totalImpressions = forecasts.reduce((sum, f) => sum + f.predicted.impressions, 0);

    // Calculate confidence trend
    const firstHalf = forecasts.slice(0, Math.floor(forecasts.length / 2));
    const secondHalf = forecasts.slice(Math.floor(forecasts.length / 2));
    const firstAvg = firstHalf.reduce((sum, f) => sum + f.confidence.overall, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, f) => sum + f.confidence.overall, 0) / secondHalf.length;

    let confidenceTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (secondAvg - firstAvg > 0.05) confidenceTrend = 'improving';
    else if (firstAvg - secondAvg > 0.05) confidenceTrend = 'declining';

    return {
      totalPredictedRevenue: Math.round(totalRevenue * 100) / 100,
      avgPredictedEcpm: Math.round(avgEcpm * 100) / 100,
      avgPredictedFillRate: Math.round(avgFillRate * 100) / 100,
      totalPredictedImpressions: Math.round(totalImpressions),
      confidenceTrend
    };
  }

  /**
   * Get mock historical data for demo
   */
  private getMockHistoricalData(): any[] {
    const data: any[] = [];
    const baseRevenue = 15000;
    const baseEcpm = 4.5;
    const baseFillRate = 72;

    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const dayOfWeek = date.getDay();
      const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.85 : 1;
      const randomFactor = 0.9 + Math.random() * 0.2;

      data.push({
        date,
        revenue: baseRevenue * weekendFactor * randomFactor,
        ecpm: baseEcpm * weekendFactor * randomFactor,
        fillRate: baseFillRate * weekendFactor * randomFactor,
        impressions: Math.round((baseRevenue * weekendFactor * randomFactor / baseEcpm) * 1000),
        requests: Math.round((baseRevenue * weekendFactor * randomFactor / baseEcpm) * 1000 / (baseFillRate / 100))
      });
    }

    return data;
  }
}

export const forecastService = new ForecastService();