import { v4 as uuidv4 } from 'uuid';
import { Forecast, MMMModel, Channel, ModelResult } from '../models';
import { ForecastResult } from '../types';
import { logger } from '../utils/logger';

/**
 * Forecasting Service
 * Generates future predictions based on trained models
 */
export class ForecastingService {
  /**
   * Generate forecast for a model
   */
  async generateForecast(
    modelId: string,
    period: 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR',
    periodsAhead: number = 12
  ): Promise<ForecastResult[]> {
    try {
      logger.info('Generating forecast', { modelId, period, periodsAhead });

      // Get model and channels
      const model = await MMMModel.findById(modelId);
      if (!model) {
        throw new Error(`Model not found: ${modelId}`);
      }

      if (model.status !== 'TRAINED') {
        throw new Error('Model must be trained before forecasting');
      }

      const channels = await Channel.find({ _id: { $in: model.channels } });
      const modelResult = await ModelResult.findOne({ modelId: model._id })
        .sort({ trainedAt: -1 });

      // Calculate trend and seasonality
      const { trend, seasonality } = this.analyzeHistoricalData(channels);

      // Generate forecasts
      const forecasts: ForecastResult[] = [];
      const now = new Date();

      for (let i = 1; i <= periodsAhead; i++) {
        const forecastDate = this.getFutureDate(now, period, i);
        const forecastPeriod = this.formatPeriod(forecastDate, period);

        // Calculate predictions for each channel
        const predictions: Record<string, number> = {};
        channels.forEach(ch => {
          const baseRevenue = ch.revenue || 0;
          const trendFactor = 1 + (trend * i * 0.01);
          const seasonalFactor = seasonality[forecastPeriod] || 1;
          const marginalRoas = modelResult?.marginalRoas?.get?.(ch.channelId) || 1;

          // Simple forecast: base * trend * seasonality * marginal ROAS adjustment
          predictions[ch.channelId] = baseRevenue * trendFactor * seasonalFactor * marginalRoas;
        });

        // Calculate confidence interval
        const totalPredicted = Object.values(predictions).reduce((a, b) => a + b, 0);
        const confidenceInterval = this.calculateConfidenceInterval(totalPredicted, i, modelResult);

        forecasts.push({
          period: forecastPeriod,
          predictions,
          confidence: confidenceInterval,
          seasonality: {
            [forecastPeriod]: seasonalFactor
          },
          trend
        });
      }

      // Save forecasts to database
      await this.saveForecasts(modelId, forecasts, period, now);

      logger.info('Forecast generated', { modelId, periodsGenerated: forecasts.length });

      return forecasts;
    } catch (error) {
      logger.error('Forecast generation failed', { modelId, error });
      throw error;
    }
  }

  /**
   * Get saved forecasts for a model
   */
  async getForecasts(modelId: string, period?: string): Promise<any[]> {
    const query: any = { modelId };
    if (period) {
      query.period = period;
    }

    const forecasts = await Forecast.find(query)
      .sort({ generatedAt: -1 })
      .limit(10);

    return forecasts.map(f => ({
      id: f._id,
      forecastId: f.forecastId,
      modelId: f.modelId,
      period: f.period,
      startDate: f.startDate,
      endDate: f.endDate,
      predictions: this.mapToObject(f.predictions),
      confidence: f.confidence,
      seasonality: this.mapToObject(f.seasonality),
      trend: f.trend,
      forecastData: f.forecastData,
      generatedAt: f.generatedAt
    }));
  }

  /**
   * Analyze historical data for trend and seasonality
   */
  private analyzeHistoricalData(channels: any[]): { trend: number; seasonality: Record<string, number> } {
    // Calculate overall trend
    let totalTrend = 0;
    let channelCount = 0;

    channels.forEach(ch => {
      if (ch.dataPoints && ch.dataPoints.length >= 2) {
        const sortedData = [...ch.dataPoints].sort((a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const firstHalf = sortedData.slice(0, Math.floor(sortedData.length / 2));
        const secondHalf = sortedData.slice(Math.floor(sortedData.length / 2));

        const firstAvg = firstHalf.reduce((sum, dp) => sum + (dp.revenue || 0), 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, dp) => sum + (dp.revenue || 0), 0) / secondHalf.length;

        if (firstAvg > 0) {
          totalTrend += ((secondAvg - firstAvg) / firstAvg) * 100;
          channelCount++;
        }
      }
    });

    const trend = channelCount > 0 ? totalTrend / channelCount : 0;

    // Calculate seasonality (simplified - use month/quarter patterns)
    const seasonality: Record<string, number> = {
      'Q1': 0.95,
      'Q2': 1.0,
      'Q3': 1.05,
      'Q4': 1.15, // Holiday season boost
      'JAN': 0.85,
      'FEB': 0.9,
      'MAR': 0.95,
      'APR': 1.0,
      'MAY': 1.0,
      'JUN': 1.05,
      'JUL': 0.95,
      'AUG': 0.95,
      'SEP': 1.0,
      'OCT': 1.05,
      'NOV': 1.1,
      'DEC': 1.2
    };

    return { trend, seasonality };
  }

  /**
   * Get future date based on period
   */
  private getFutureDate(start: Date, period: string, periodsAhead: number): Date {
    const date = new Date(start);

    switch (period) {
      case 'WEEK':
        date.setDate(date.getDate() + periodsAhead * 7);
        break;
      case 'MONTH':
        date.setMonth(date.getMonth() + periodsAhead);
        break;
      case 'QUARTER':
        date.setMonth(date.getMonth() + periodsAhead * 3);
        break;
      case 'YEAR':
        date.setFullYear(date.getFullYear() + periodsAhead);
        break;
    }

    return date;
  }

  /**
   * Format period string
   */
  private formatPeriod(date: Date, period: string): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const quarter = Math.ceil(month / 3);

    switch (period) {
      case 'WEEK':
        const weekNum = this.getWeekNumber(date);
        return `${year}-W${weekNum.toString().padStart(2, '0')}`;
      case 'MONTH':
        return `${year}-${month.toString().padStart(2, '0')}`;
      case 'QUARTER':
        return `${year}-Q${quarter}`;
      case 'YEAR':
        return `${year}`;
      default:
        return `${year}-${month.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Get week number of the year
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  /**
   * Calculate confidence interval
   */
  private calculateConfidenceInterval(
    baseValue: number,
    periodsAhead: number,
    modelResult: any
  ): { lower: number; upper: number; interval: number } {
    // Model uncertainty increases with forecast horizon
    const baseUncertainty = modelResult?.modelMetrics?.rmse || (baseValue * 0.1);
    const horizonFactor = Math.sqrt(periodsAhead); // Uncertainty grows with sqrt of time
    const uncertainty = baseUncertainty * horizonFactor;

    const lower = baseValue - uncertainty;
    const upper = baseValue + uncertainty;
    const interval = upper - lower;

    return { lower: Math.max(0, lower), upper, interval };
  }

  /**
   * Save forecasts to database
   */
  private async saveForecasts(
    modelId: string,
    forecasts: ForecastResult[],
    period: string,
    generatedAt: Date
  ): Promise<void> {
    const model = await MMMModel.findById(modelId);
    if (!model) return;

    const channels = await Channel.find({ _id: { $in: model.channels } });

    // Calculate date range
    const firstForecast = forecasts[0];
    const lastForecast = forecasts[forecasts.length - 1];

    const forecast = new Forecast({
      forecastId: uuidv4(),
      modelId: model._id,
      period,
      startDate: this.parsePeriodToDate(firstForecast.period, period),
      endDate: this.parsePeriodToDate(lastForecast.period, period),
      predictions: this.objectToMap(
        Object.entries(firstForecast.predictions).reduce((acc, [chId, val]) => {
          acc[chId] = forecasts.reduce((sum, f) => sum + (f.predictions[chId] || 0), 0) / forecasts.length;
          return acc;
        }, {} as Record<string, number>)
      ),
      confidence: {
        lower: forecasts.reduce((sum, f) => sum + f.confidence.lower, 0) / forecasts.length,
        upper: forecasts.reduce((sum, f) => sum + f.confidence.upper, 0) / forecasts.length,
        interval: forecasts.reduce((sum, f) => sum + f.confidence.interval, 0) / forecasts.length
      },
      seasonality: this.objectToMap(
        Object.entries(firstForecast.seasonality).reduce((acc, [k, v]) => {
          acc[k] = v as number;
          return acc;
        }, {} as Record<string, number>)
      ),
      trend: forecasts[0]?.trend || 0,
      forecastData: forecasts.map(f => ({
        period: f.period,
        date: this.parsePeriodToDate(f.period, period),
        value: Object.values(f.predictions).reduce((a, b) => a + b, 0),
        confidenceInterval: {
          lower: f.confidence.lower,
          upper: f.confidence.upper
        }
      })),
      generatedAt
    });

    await forecast.save();
  }

  /**
   * Parse period string to date
   */
  private parsePeriodToDate(period: string, periodType: string): Date {
    const date = new Date();

    if (periodType === 'YEAR') {
      date.setFullYear(parseInt(period));
    } else if (periodType === 'QUARTER') {
      const [year, q] = period.split('-Q');
      date.setFullYear(parseInt(year));
      date.setMonth((parseInt(q) - 1) * 3);
    } else if (periodType === 'MONTH') {
      const [year, month] = period.split('-');
      date.setFullYear(parseInt(year));
      date.setMonth(parseInt(month) - 1);
    } else if (periodType === 'WEEK') {
      const [year, week] = period.split('-W');
      date.setFullYear(parseInt(year));
      date.setDate(parseInt(week) * 7);
    }

    return date;
  }

  /**
   * Convert Map to plain object
   */
  private mapToObject(map: Map<string, number> | Record<string, number>): Record<string, number> {
    if (map instanceof Map) {
      return Object.fromEntries(map);
    }
    return map;
  }

  /**
   * Convert plain object to Map
   */
  private objectToMap(obj: Record<string, number>): Map<string, number> {
    return new Map(Object.entries(obj));
  }
}

export const forecastingService = new ForecastingService();