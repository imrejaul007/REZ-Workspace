import { ForecastRecord, BusinessOutcome, ROASRecord, OutcomeCampaign } from '../models/outcomeModels.js';
import { campaignService } from './campaignService.js';
import logger from 'utils/logger.js';
import { startTimer } from '../utils/metrics.js';

const generateId = (prefix: string): string => {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
};

export interface ForecastInput {
  campaignId: string;
  advertiserId: string;
  forecastType: 'revenue' | 'conversions' | 'roi';
  horizonDays: number;
  assumptions?: {
    budgetGrowth?: number;
    seasonality?: Record<string, number>;
    historicalTrend?: number;
  };
}

export interface ForecastResult {
  forecastId: string;
  campaignId: string;
  forecastType: string;
  predictions: {
    optimistic: number;
    base: number;
    pessimistic: number;
    confidence: number;
  };
  currentValue: number;
  projectedEndValue: number;
  growthRate: number;
  factors: Array<{
    name: string;
    impact: number;
    direction: 'positive' | 'negative' | 'neutral';
  }>;
  horizonDate: Date;
  model: string;
}

/**
 * Forecasting Service
 * AI-powered revenue and performance forecasting
 */
export class ForecastingService {
  /**
   * Generate revenue forecast for a campaign
   */
  async generateForecast(input: ForecastInput): Promise<ForecastResult> {
    const endTimer = startTimer();
    const forecastId = generateId('fcst');

    logger.info('Generating forecast', {
      forecastId,
      campaignId: input.campaignId,
      forecastType: input.forecastType,
      horizonDays: input.horizonDays
    });

    try {
      // Get campaign data
      const campaign = await campaignService.getCampaign(input.campaignId);
      if (!campaign) {
        throw new Error(`Campaign not found: ${input.campaignId}`);
      }

      // Get historical performance
      const historicalData = await this.getHistoricalPerformance(input.campaignId, input.horizonDays);

      // Calculate trends
      const trend = this.calculateTrend(historicalData);
      const seasonality = this.getSeasonalityFactors();
      const confidence = this.calculateConfidence(historicalData);

      // Generate predictions
      const predictions = this.generatePredictions(
        campaign.kpis.current,
        trend,
        seasonality,
        input.horizonDays,
        confidence,
        input.assumptions
      );

      // Identify factors
      const factors = this.identifyFactors(historicalData, trend, campaign);

      // Create forecast record
      const forecastDate = new Date();
      const horizonDate = new Date();
      horizonDate.setDate(horizonDate.getDate() + input.horizonDays);

      await ForecastRecord.create({
        forecastId,
        campaignId: input.campaignId,
        advertiserId: input.advertiserId,
        forecastType: input.forecastType,
        horizonDays: input.horizonDays,
        predictions: {
          optimistic: predictions.optimistic,
          base: predictions.base,
          pessimistic: predictions.pessimistic,
          confidence: predictions.confidence,
        },
        assumptions: {
          budget: campaign.budget.total,
          growthRate: trend.growthRate,
          seasonality: seasonality,
          historicalTrend: trend.slope,
        },
        model: 'gradient_boosting',
        factors,
        forecastDate,
        horizonDate,
      });

      const result: ForecastResult = {
        forecastId,
        campaignId: input.campaignId,
        forecastType: input.forecastType,
        predictions: {
          optimistic: predictions.optimistic,
          base: predictions.base,
          pessimistic: predictions.pessimistic,
          confidence: predictions.confidence,
        },
        currentValue: campaign.kpis.current,
        projectedEndValue: predictions.base,
        growthRate: trend.growthRate,
        factors,
        horizonDate,
        model: 'gradient_boosting',
      };

      logger.info('Forecast generated', {
        forecastId,
        campaignId: input.campaignId,
        basePrediction: predictions.base,
        confidence: predictions.confidence,
        duration: endTimer()
      });

      return result;
    } catch (error) {
      logger.error('Failed to generate forecast', error);
      throw error;
    }
  }

  /**
   * Get historical performance data
   */
  private async getHistoricalPerformance(campaignId: string, days: number): Promise<number[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const outcomes = await BusinessOutcome.find({
      campaignId,
      timestamp: { $gte: startDate }
    })
      .sort({ timestamp: 1 })
      .lean();

    // Aggregate by day
    const dailyValues: Record<string, number> = {};
    for (const outcome of outcomes) {
      const dateKey = outcome.timestamp.toISOString().split('T')[0];
      dailyValues[dateKey] = (dailyValues[dateKey] || 0) + outcome.value;
    }

    // Fill in missing days with interpolation
    const result: number[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      result.push(dailyValues[dateKey] || 0);
    }

    // Fill zeros with interpolated values
    let lastValue = 0;
    for (let i = 0; i < result.length; i++) {
      if (result[i] === 0 && lastValue > 0) {
        result[i] = lastValue;
      } else if (result[i] > 0) {
        lastValue = result[i];
      }
    }

    return result;
  }

  /**
   * Calculate trend from historical data
   */
  private calculateTrend(values: number[]): {
    slope: number;
    growthRate: number;
    direction: 'up' | 'down' | 'stable';
  } {
    if (values.length < 2) {
      return { slope: 0, growthRate: 0, direction: 'stable' };
    }

    // Simple linear regression
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumXX += i * i;
    }

    const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) : 0;
    const avgValue = n > 0 ? sumY / n : 0;
    const growthRate = avgValue > 0 ? (slope / avgValue) * 100 : 0;

    let direction: 'up' | 'down' | 'stable' = 'stable';
    if (growthRate > 2) direction = 'up';
    else if (growthRate < -2) direction = 'down';

    return { slope, growthRate, direction };
  }

  /**
   * Get seasonality factors
   */
  private getSeasonalityFactors(): Record<string, number> {
    // Simplified seasonality - in production, would use historical data
    const dayOfWeek = new Date().getDay();
    const dayFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 1.2 : 1.0; // Weekend boost

    return {
      day_of_week: dayFactor,
      month: 1.0,
      quarter: 1.0,
    };
  }

  /**
   * Calculate forecast confidence
   */
  private calculateConfidence(historicalData: number[]): number {
    if (historicalData.length < 7) return 0.4;
    if (historicalData.length < 14) return 0.6;
    if (historicalData.length < 30) return 0.75;

    // Calculate variance
    const mean = historicalData.reduce((a, b) => a + b, 0) / historicalData.length;
    const variance = historicalData.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / historicalData.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 1;

    // Lower variance = higher confidence
    let confidence = 0.8;
    if (cv > 0.5) confidence = 0.6;
    if (cv > 0.8) confidence = 0.5;
    if (cv > 1.0) confidence = 0.4;

    return confidence;
  }

  /**
   * Generate prediction scenarios
   */
  private generatePredictions(
    currentValue: number,
    trend: { slope: number; growthRate: number },
    seasonality: Record<string, number>,
    horizonDays: number,
    confidence: number,
    assumptions?: { budgetGrowth?: number; historicalTrend?: number }
  ): {
    optimistic: number;
    base: number;
    pessimistic: number;
    confidence: number;
  } {
    // Base prediction using trend
    const dailyTrend = trend.slope || (currentValue * (trend.growthRate / 100) / 30);
    const seasonalityFactor = seasonality.day_of_week || 1;

    // Apply assumptions if provided
    const adjustedTrend = assumptions?.historicalTrend
      ? dailyTrend * (1 + assumptions.historicalTrend)
      : dailyTrend;

    // Base scenario
    const basePrediction = currentValue + (adjustedTrend * horizonDays * seasonalityFactor);

    // Optimistic: faster growth
    const optimisticPrediction = basePrediction * (1 + (confidence * 0.2));

    // Pessimistic: slower growth or decline
    const pessimisticPrediction = basePrediction * (1 - ((1 - confidence) * 0.3));

    return {
      optimistic: Math.round(optimisticPrediction * 100) / 100,
      base: Math.round(basePrediction * 100) / 100,
      pessimistic: Math.round(Math.max(0, pessimisticPrediction) * 100) / 100,
      confidence: Math.min(0.95, Math.max(0.3, confidence)),
    };
  }

  /**
   * Identify factors affecting forecast
   */
  private identifyFactors(
    historicalData: number[],
    trend: { slope: number; growthRate: number; direction: string },
    campaign: any
  ): Array<{ name: string; impact: number; direction: 'positive' | 'negative' | 'neutral' }> {
    const factors: Array<{ name: string; impact: number; direction: 'positive' | 'negative' | 'neutral' }> = [];

    // Trend factor
    factors.push({
      name: 'historical_trend',
      impact: Math.abs(trend.growthRate),
      direction: trend.direction === 'up' ? 'positive' : trend.direction === 'down' ? 'negative' : 'neutral',
    });

    // Budget utilization factor
    const budgetUtilization = campaign.budget.total > 0
      ? campaign.budget.spent / campaign.budget.total
      : 0;
    if (budgetUtilization > 0.8) {
      factors.push({ name: 'high_budget_utilization', impact: 0.3, direction: 'positive' });
    } else if (budgetUtilization < 0.5) {
      factors.push({ name: 'low_budget_utilization', impact: 0.2, direction: 'negative' });
    }

    // KPI progress factor
    const kpiProgress = campaign.kpis.target > 0
      ? campaign.kpis.current / campaign.kpis.target
      : 0;
    if (kpiProgress > 0.7) {
      factors.push({ name: 'strong_kpi_progress', impact: 0.25, direction: 'positive' });
    } else if (kpiProgress < 0.5) {
      factors.push({ name: 'weak_kpi_progress', impact: 0.3, direction: 'negative' });
    }

    // Data quality factor
    if (historicalData.length >= 30) {
      factors.push({ name: 'sufficient_data', impact: 0.15, direction: 'positive' });
    } else {
      factors.push({ name: 'limited_data', impact: 0.1, direction: 'neutral' });
    }

    return factors;
  }

  /**
   * Compare forecast with actual results
   */
  async compareForecast(forecastId: string): Promise<{
    forecast: ForecastResult;
    actual: number;
    variance: number;
    variancePercent: number;
    accuracy: number;
  } | null> {
    const forecast = await ForecastRecord.findOne({ forecastId }).lean();
    if (!forecast) return null;

    // Get actual results since forecast date
    const outcomes = await BusinessOutcome.find({
      campaignId: forecast.campaignId,
      timestamp: { $gte: forecast.forecastDate }
    }).lean();

    const actualRevenue = outcomes.reduce((sum, o) => sum + o.value, 0);

    const variance = actualRevenue - forecast.predictions.base;
    const variancePercent = forecast.predictions.base > 0
      ? (variance / forecast.predictions.base) * 100
      : 0;
    const accuracy = 100 - Math.abs(variancePercent);

    return {
      forecast: {
        forecastId: forecast.forecastId,
        campaignId: forecast.campaignId,
        forecastType: forecast.forecastType,
        predictions: forecast.predictions,
        currentValue: 0,
        projectedEndValue: forecast.predictions.base,
        growthRate: forecast.assumptions.historicalTrend || 0,
        factors: forecast.factors,
        horizonDate: forecast.horizonDate,
        model: forecast.model,
      },
      actual: actualRevenue,
      variance,
      variancePercent,
      accuracy,
    };
  }

  /**
   * Get forecast accuracy metrics
   */
  async getForecastAccuracy(campaignId?: string): Promise<{
    averageAccuracy: number;
    averageVariance: number;
    forecastsAnalyzed: number;
    byHorizon: Record<number, number>;
  }> {
    const query: Record<string, any> = {};
    if (campaignId) {
      query.campaignId = campaignId;
    }

    const forecasts = await ForecastRecord.find(query).lean();

    if (forecasts.length === 0) {
      return {
        averageAccuracy: 0,
        averageVariance: 0,
        forecastsAnalyzed: 0,
        byHorizon: {},
      };
    }

    let totalAccuracy = 0;
    let totalVariance = 0;
    let count = 0;
    const byHorizon: Record<number, { total: number; count: number }> = {};

    for (const forecast of forecasts) {
      if (forecast.actual) {
        const variance = forecast.actual.revenue - forecast.predictions.base;
        const variancePercent = forecast.predictions.base > 0
          ? (Math.abs(variance) / forecast.predictions.base) * 100
          : 100;
        const accuracy = 100 - variancePercent;

        totalAccuracy += accuracy;
        totalVariance += Math.abs(variance);
        count++;

        // Group by horizon
        if (!byHorizon[forecast.horizonDays]) {
          byHorizon[forecast.horizonDays] = { total: 0, count: 0 };
        }
        byHorizon[forecast.horizonDays].total += accuracy;
        byHorizon[forecast.horizonDays].count++;
      }
    }

    const byHorizonResult: Record<number, number> = {};
    for (const [horizon, data] of Object.entries(byHorizon)) {
      byHorizonResult[parseInt(horizon)] = data.total / data.count;
    }

    return {
      averageAccuracy: count > 0 ? totalAccuracy / count : 0,
      averageVariance: count > 0 ? totalVariance / count : 0,
      forecastsAnalyzed: count,
      byHorizon: byHorizonResult,
    };
  }

  /**
   * Generate forecast summary for dashboard
   */
  async getForecastSummary(advertiserId: string): Promise<{
    totalForecasts: number;
    averageConfidence: number;
    byType: Record<string, { count: number; averagePrediction: number }>;
    upcomingHorizons: Array<{ horizonDate: Date; campaignId: string; predictedValue: number }>;
  }> {
    const forecasts = await ForecastRecord.find({ advertiserId })
      .sort({ horizonDate: 1 })
      .lean();

    const byType: Record<string, { count: number; totalPrediction: number }> = {};
    let totalConfidence = 0;

    for (const forecast of forecasts) {
      if (!byType[forecast.forecastType]) {
        byType[forecast.forecastType] = { count: 0, totalPrediction: 0 };
      }
      byType[forecast.forecastType].count++;
      byType[forecast.forecastType].totalPrediction += forecast.predictions.base;
      totalConfidence += forecast.predictions.confidence;
    }

    const result = {
      totalForecasts: forecasts.length,
      averageConfidence: forecasts.length > 0 ? totalConfidence / forecasts.length : 0,
      byType: Object.fromEntries(
        Object.entries(byType).map(([type, data]) => [
          type,
          { count: data.count, averagePrediction: data.totalPrediction / data.count }
        ])
      ),
      upcomingHorizons: forecasts
        .filter(f => f.horizonDate > new Date())
        .slice(0, 10)
        .map(f => ({
          horizonDate: f.horizonDate,
          campaignId: f.campaignId,
          predictedValue: f.predictions.base,
        })),
    };

    return result;
  }
}

// Export singleton instance
export const forecastingService = new ForecastingService();
export default forecastingService;