import { FillRate } from '../models/FillRate';
import { FillForecast, IFillForecast } from '../models/FillForecast';
import { logger } from 'utils/logger.js';
import { forecastAccuracy } from '../utils/metrics';

export interface ForecastResult {
  date: Date;
  predicted: number;
  confidence: number;
  factors: {
    name: string;
    weight: number;
    direction: 'positive' | 'negative' | 'neutral';
  }[];
  model: string;
}

export class ForecastService {
  private modelName = 'fill-rate-forecast-v1';
  private modelVersion = '1.0.0';

  // Generate fill rate forecast
  async generateForecast(params: {
    inventoryId?: string;
    horizon: number; // hours ahead
    startDate?: Date;
  }): Promise<ForecastResult[]> {
    try {
      const { inventoryId, horizon = 24, startDate = new Date() } = params;

      logger.info('Generating fill rate forecast', { inventoryId, horizon });

      // Get historical data for forecasting
      const historicalData = await this.getHistoricalData(inventoryId);

      // Generate forecasts
      const forecasts: ForecastResult[] = [];

      for (let i = 1; i <= horizon; i++) {
        const forecastDate = new Date(startDate.getTime() + i * 60 * 60 * 1000);

        // Simple moving average with trend
        const prediction = this.predictFillRate(historicalData, forecastDate);
        const confidence = this.calculateConfidence(historicalData, forecastDate);
        const factors = this.identifyForecastFactors(historicalData, forecastDate);

        const forecast: ForecastResult = {
          date: forecastDate,
          predicted: Math.round(prediction * 100) / 100,
          confidence: Math.round(confidence * 100) / 100,
          factors,
          model: `${this.modelName}:${this.modelVersion}`
        };

        forecasts.push(forecast);

        // Save to database
        await this.saveForecast({
          inventoryId,
          date: forecastDate,
          predicted: prediction,
          confidence,
          factors,
          horizon: i
        });
      }

      logger.info('Fill rate forecast generated', {
        inventoryId,
        horizon,
        forecasts: forecasts.length
      });

      return forecasts;
    } catch (error) {
      logger.error('Error generating forecast', { error, params });
      throw error;
    }
  }

  // Get forecast for specific date
  async getForecastForDate(inventoryId: string, date: Date): Promise<IFillForecast | null> {
    try {
      // Find closest forecast
      return await FillForecast.findOne({
        inventoryId,
        date: {
          $gte: new Date(date.getTime() - 30 * 60 * 1000),
          $lte: new Date(date.getTime() + 30 * 60 * 1000)
        }
      }).sort({ date: 1 });
    } catch (error) {
      logger.error('Error getting forecast for date', { error, inventoryId, date });
      throw error;
    }
  }

  // Get forecast history
  async getForecastHistory(params: {
    inventoryId?: string;
    startDate: Date;
    endDate: Date;
  }): Promise<IFillForecast[]> {
    try {
      const query: any = {
        date: { $gte: params.startDate, $lte: params.endDate }
      };
      if (params.inventoryId) {
        query.inventoryId = params.inventoryId;
      }

      return await FillForecast.find(query)
        .sort({ date: -1 })
        .limit(1000)
        .lean();
    } catch (error) {
      logger.error('Error getting forecast history', { error, params });
      throw error;
    }
  }

  // Compare forecast vs actual
  async compareForecastVsActual(inventoryId?: string, days: number = 7): Promise<{
    date: Date;
    predicted: number;
    actual: number;
    error: number;
    errorPercentage: number;
  }[]> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const forecasts = await FillForecast.find({
        ...(inventoryId ? { inventoryId } : {}),
        date: { $gte: startDate, $lte: endDate },
        actual: { $exists: true }
      })
        .sort({ date: -1 })
        .limit(500)
        .lean();

      // Calculate forecast accuracy
      const comparison = forecasts.map(f => ({
        date: f.date,
        predicted: f.predicted,
        actual: f.actual!,
        error: f.error || Math.abs(f.predicted - f.actual),
        errorPercentage: f.actual > 0
          ? Math.abs((f.predicted - f.actual) / f.actual) * 100
          : 0
      }));

      // Update accuracy metric
      if (comparison.length > 0) {
        const avgError = comparison.reduce((sum, c) => sum + c.errorPercentage, 0) / comparison.length;
        forecastAccuracy.labels(this.modelName).set(100 - avgError);
      }

      return comparison;
    } catch (error) {
      logger.error('Error comparing forecast vs actual', { error, inventoryId });
      throw error;
    }
  }

  // Get forecast accuracy metrics
  async getForecastAccuracyMetrics(inventoryId?: string): Promise<{
    mae: number; // Mean Absolute Error
    mape: number; // Mean Absolute Percentage Error
    rmse: number; // Root Mean Square Error
    bias: number;
    sampleSize: number;
  }> {
    try {
      const forecasts = await FillForecast.find({
        ...(inventoryId ? { inventoryId } : {}),
        actual: { $exists: true },
        error: { $exists: true }
      }).lean();

      if (forecasts.length === 0) {
        return { mae: 0, mape: 0, rmse: 0, bias: 0, sampleSize: 0 };
      }

      const errors = forecasts.map(f => ({
        absolute: Math.abs(f.predicted - f.actual!),
        percentage: f.actual! > 0 ? Math.abs((f.predicted - f.actual!) / f.actual!) : 0,
        squared: Math.pow(f.predicted - f.actual!, 2),
        bias: f.predicted - f.actual!
      }));

      const mae = errors.reduce((sum, e) => sum + e.absolute, 0) / errors.length;
      const mape = errors.reduce((sum, e) => sum + e.percentage, 0) / errors.length * 100;
      const rmse = Math.sqrt(errors.reduce((sum, e) => sum + e.squared, 0) / errors.length);
      const bias = errors.reduce((sum, e) => sum + e.bias, 0) / errors.length;

      return {
        mae: Math.round(mae * 100) / 100,
        mape: Math.round(mape * 100) / 100,
        rmse: Math.round(rmse * 100) / 100,
        bias: Math.round(bias * 100) / 100,
        sampleSize: forecasts.length
      };
    } catch (error) {
      logger.error('Error getting forecast accuracy metrics', { error, inventoryId });
      throw error;
    }
  }

  private async getHistoricalData(inventoryId?: string): Promise<{
    date: Date;
    rate: number;
    dayOfWeek: number;
    hour: number;
  }[]> {
    const lookback = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
    const query = inventoryId ? { inventoryId, date: { $gte: lookback } } : { date: { $gte: lookback } };

    const data = await FillRate.find(query)
      .sort({ date: 1 })
      .limit(5000)
      .lean();

    return data.map(d => ({
      date: d.date,
      rate: d.rate,
      dayOfWeek: new Date(d.date).getDay(),
      hour: new Date(d.date).getHours()
    }));
  }

  private predictFillRate(
    historicalData: { date: Date; rate: number; dayOfWeek: number; hour: number }[],
    targetDate: Date
  ): number {
    if (historicalData.length === 0) return 70; // Default fallback

    const targetDayOfWeek = targetDate.getDay();
    const targetHour = targetDate.getHours();

    // Get similar time slots
    const similarSlots = historicalData.filter(d =>
      d.dayOfWeek === targetDayOfWeek &&
      Math.abs(d.hour - targetHour) <= 2
    );

    if (similarSlots.length > 0) {
      // Weighted average based on recency
      const weights = similarSlots.map((_, i) => 1 / (i + 1));
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      const weightedRate = similarSlots.reduce((sum, d, i) =>
        sum + d.rate * weights[i], 0) / totalWeight;

      // Apply trend adjustment
      const trend = this.calculateTrend(historicalData);
      return Math.min(100, Math.max(0, weightedRate + trend));
    }

    // Fallback to overall average
    const avgRate = historicalData.reduce((sum, d) => sum + d.rate, 0) / historicalData.length;
    return avgRate;
  }

  private calculateTrend(historicalData: { date: Date; rate: number }[]): number {
    if (historicalData.length < 10) return 0;

    // Calculate 7-day trend
    const recentData = historicalData.slice(-168); // Last 7 days (24 * 7)
    const olderData = historicalData.slice(-336, -168);

    if (olderData.length === 0) return 0;

    const recentAvg = recentData.reduce((sum, d) => sum + d.rate, 0) / recentData.length;
    const olderAvg = olderData.reduce((sum, d) => sum + d.rate, 0) / olderData.length;

    return (recentAvg - olderAvg) / 7; // Daily trend adjustment
  }

  private calculateConfidence(
    historicalData: { date: Date; rate: number }[],
    targetDate: Date
  ): number {
    if (historicalData.length < 50) return 50;

    const targetDayOfWeek = targetDate.getDay();
    const targetHour = targetDate.getHours();

    const similarSlots = historicalData.filter(d =>
      d.dayOfWeek === targetDayOfWeek &&
      Math.abs(d.hour - targetHour) <= 1
    );

    if (similarSlots.length === 0) return 40;

    // Calculate coefficient of variation
    const rates = similarSlots.map(s => s.rate);
    const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
    const variance = rates.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / rates.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? (stdDev / mean) * 100 : 100;

    // Higher CV = lower confidence
    const confidence = Math.max(20, Math.min(95, 100 - cv));
    return confidence;
  }

  private identifyForecastFactors(
    historicalData: { date: Date; rate: number; dayOfWeek: number; hour: number }[],
    targetDate: Date
  ): { name: string; weight: number; direction: 'positive' | 'negative' | 'neutral' }[] {
    const factors: { name: string; weight: number; direction: 'positive' | 'negative' | 'neutral' }[] = [];

    const targetDayOfWeek = targetDate.getDay();
    const targetHour = targetDate.getHours();

    // Day of week factor
    const weekdayRates = historicalData.filter(d => d.dayOfWeek >= 1 && d.dayOfWeek <= 5);
    const weekendRates = historicalData.filter(d => d.dayOfWeek === 0 || d.dayOfWeek === 6);

    if (weekdayRates.length > 0 && weekendRates.length > 0) {
      const weekdayAvg = weekdayRates.reduce((sum, d) => sum + d.rate, 0) / weekdayRates.length;
      const weekendAvg = weekendRates.reduce((sum, d) => sum + d.rate, 0) / weekendRates.length;

      if (targetDayOfWeek >= 1 && targetDayOfWeek <= 5) {
        factors.push({
          name: 'Weekday pattern',
          weight: Math.abs(weekdayAvg - weekendAvg) / 10,
          direction: weekdayAvg > weekendAvg ? 'positive' : 'negative'
        });
      } else {
        factors.push({
          name: 'Weekend pattern',
          weight: Math.abs(weekendAvg - weekdayAvg) / 10,
          direction: weekendAvg > weekdayAvg ? 'positive' : 'negative'
        });
      }
    }

    // Hour factor
    const dayRates = historicalData.filter(d => d.hour >= 8 && d.hour <= 20);
    const nightRates = historicalData.filter(d => d.hour < 8 || d.hour > 20);

    if (dayRates.length > 0 && nightRates.length > 0) {
      const dayAvg = dayRates.reduce((sum, d) => sum + d.rate, 0) / dayRates.length;
      const nightAvg = nightRates.reduce((sum, d) => sum + d.rate, 0) / nightRates.length;

      if (targetHour >= 8 && targetHour <= 20) {
        factors.push({
          name: 'Business hours',
          weight: Math.abs(dayAvg - nightAvg) / 15,
          direction: dayAvg > nightAvg ? 'positive' : 'negative'
        });
      } else {
        factors.push({
          name: 'Off-hours',
          weight: Math.abs(nightAvg - dayAvg) / 15,
          direction: nightAvg > dayAvg ? 'positive' : 'negative'
        });
      }
    }

    return factors;
  }

  private async saveForecast(data: {
    inventoryId?: string;
    date: Date;
    predicted: number;
    confidence: number;
    factors: { name: string; weight: number; direction: 'positive' | 'negative' | 'neutral' }[];
    horizon: number;
  }): Promise<FillForecast> {
    const forecast = new FillForecast({
      ...data,
      model: this.modelName,
      modelVersion: this.modelVersion
    });

    await forecast.save();
    return forecast;
  }
}