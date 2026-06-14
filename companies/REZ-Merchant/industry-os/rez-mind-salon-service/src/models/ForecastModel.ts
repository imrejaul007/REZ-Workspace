/**
 * Demand Forecasting Model Module
 *
 * This module contains time series forecasting for salon demand prediction.
 * In production, this would use libraries like Prophet, ARIMA, or neural networks.
 */

export interface ForecastFeatures {
  dayOfWeek: number; // 0-6
  month: number; // 1-12
  hour: number; // 0-23
  isHoliday: boolean;
  recentDemand: number[]; // Last 7 days demand
  trend: number; // Trend coefficient
}

export interface DemandForecastResult {
  predictedDemand: number;
  confidenceInterval: { lower: number; upper: number };
  confidence: number;
  seasonalFactors: { name: string; factor: number }[];
}

export class DemandForecastModel {
  private seasonalPatterns: Map<string, number> = new Map();

  constructor() {
    this.initializeSeasonalPatterns();
  }

  private initializeSeasonalPatterns(): void {
    // Weekly patterns (day of week -> multiplier)
    const weekly = [0.6, 0.8, 0.9, 0.9, 1.0, 1.2, 1.3]; // Sun-Sat
    weekly.forEach((val, idx) => this.seasonalPatterns.set(`weekday_${idx}`, val));

    // Hourly patterns
    const hourly = [
      0, 0, 0, 0, 0, 0, 0, 0, 0, // 0-8
      0.5, 0.7, 0.8, 0.7, 0.6, // 9-13
      0.7, 0.8, 1.0, 1.0, 0.9, // 14-18
      0.8, 0.6, 0.4, 0.2, // 19-22
    ];
    hourly.forEach((val, idx) => this.seasonalPatterns.set(`hour_${idx}`, val));

    // Monthly patterns
    const monthly = [
      0.7, 0.8, 0.9, 1.0, 1.1, 1.2, // Jan-Jun
      1.1, 1.0, 0.95, 0.9, 1.0, 1.3, // Jul-Dec
    ];
    monthly.forEach((val, idx) => this.seasonalPatterns.set(`month_${idx + 1}`, val));
  }

  /**
   * Forecast demand for a given time period
   */
  forecast(features: ForecastFeatures, baseDemand: number = 5): DemandForecastResult {
    // Calculate seasonal factors
    const seasonalFactors: { name: string; factor: number }[] = [];

    const weekdayFactor = this.seasonalPatterns.get(`weekday_${features.dayOfWeek}`) || 1;
    seasonalFactors.push({ name: 'day_of_week', factor: weekdayFactor });

    const hourlyFactor = this.seasonalPatterns.get(`hour_${features.hour}`) || 0.5;
    seasonalFactors.push({ name: 'time_of_day', factor: hourlyFactor });

    const monthFactor = this.seasonalPatterns.get(`month_${features.month}`) || 1;
    seasonalFactors.push({ name: 'seasonal', factor: monthFactor });

    // Calculate trend from recent demand
    const recentAvg =
      features.recentDemand.length > 0
        ? features.recentDemand.reduce((a, b) => a + b, 0) / features.recentDemand.length
        : baseDemand;

    // Combine factors
    let predictedDemand = baseDemand * weekdayFactor * hourlyFactor * monthFactor;

    // Apply trend
    if (features.trend !== 0 && recentAvg > 0) {
      const trendFactor = 1 + features.trend;
      predictedDemand = predictedDemand * trendFactor;
    }

    // Apply recent demand smoothing
    if (features.recentDemand.length > 0) {
      const weight = 0.3;
      predictedDemand = predictedDemand * (1 - weight) + recentAvg * weight;
    }

    // Holiday adjustment
    if (features.isHoliday) {
      predictedDemand *= 1.2;
      seasonalFactors.push({ name: 'holiday', factor: 1.2 });
    }

    // Calculate confidence interval (wider for longer forecasts)
    const variance = this.calculateVariance(features.recentDemand);
    const margin = Math.sqrt(variance) * 1.96;

    const confidence = this.calculateConfidence(features);

    return {
      predictedDemand: Math.round(predictedDemand * 10) / 10,
      confidenceInterval: {
        lower: Math.max(0, Math.round((predictedDemand - margin) * 10) / 10),
        upper: Math.round((predictedDemand + margin) * 10) / 10,
      },
      confidence,
      seasonalFactors,
    };
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 1;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  private calculateConfidence(features: ForecastFeatures): number {
    let confidence = 0.7;

    // More recent data = higher confidence
    if (features.recentDemand.length >= 7) {
      confidence += 0.15;
    }

    // Stronger trend = lower confidence
    if (Math.abs(features.trend) > 0.2) {
      confidence -= 0.1;
    }

    // Holiday predictions are less certain
    if (features.isHoliday) {
      confidence -= 0.1;
    }

    return Math.max(0.5, Math.min(0.95, confidence));
  }

  /**
   * Get optimal staffing recommendation based on forecast
   */
  getStaffingRecommendation(forecast: DemandForecastResult): number {
    // Assume each staff member can handle ~3 customers per hour comfortably
    const customersPerStaff = 3;
    const recommendedStaff = Math.ceil(forecast.predictedDemand / customersPerStaff);

    return Math.max(1, recommendedStaff);
  }
}

export const demandForecastModel = new DemandForecastModel();
