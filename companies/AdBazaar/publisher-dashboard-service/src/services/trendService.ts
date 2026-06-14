import { TrendData, RevenueAnalytics, PerformanceMetric } from '../models';
import { cacheGet, cacheSet } from '../utils/cache';
import { dashboardQueriesTotal, dashboardQueryDuration } from '../utils/metrics';
import logger from '../utils/logger';

const serviceLogger = logger.child({ service: 'trendService' });

export interface TrendAnalysis {
  metric: string;
  current: {
    value: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercent: number;
  };
  historical: Array<{
    date: Date;
    value: number;
  }>;
  forecast: Array<{
    date: Date;
    predicted: number;
    lower: number;
    upper: number;
    confidence: number;
  }>;
  seasonality: {
    dayOfWeek: Array<{ day: number; avgValue: number }>;
    hourOfDay: Array<{ hour: number; avgValue: number }>;
  };
  anomalies: Array<{
    date: Date;
    value: number;
    zScore: number;
    type: 'spike' | 'drop';
  }>;
}

export interface ComparisonResult {
  metric: string;
  currentPeriod: {
    start: Date;
    end: Date;
    value: number;
    avg: number;
    min: number;
    max: number;
  };
  previousPeriod: {
    start: Date;
    end: Date;
    value: number;
    avg: number;
    min: number;
    max: number;
  };
  change: {
    absolute: number;
    percent: number;
    direction: 'up' | 'down' | 'stable';
  };
}

export class TrendService {
  /**
   * Get trend analysis for a specific metric
   */
  async getTrendAnalysis(
    publisherId: string,
    metric: 'revenue' | 'impressions' | 'ctr' | 'ecpm' | 'fillRate' | 'clicks' | 'conversions',
    startDate: Date,
    endDate: Date,
    granularity: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<TrendAnalysis> {
    const startTime = Date.now();
    const cacheKey = `trend:${publisherId}:${metric}:${startDate.toISOString()}:${endDate.toISOString()}:${granularity}`;

    // Check cache
    const cached = await cacheGet<TrendAnalysis>(cacheKey);
    if (cached) {
      dashboardQueriesTotal.inc({ type: 'trend', publisher_id: publisherId });
      return cached;
    }

    try {
      // Get or create trend data
      let trendData = await TrendData.getTrend(publisherId, metric, startDate, endDate, granularity);

      if (!trendData) {
        // Generate trend data from raw metrics
        trendData = await this.generateTrendData(publisherId, metric, startDate, endDate, granularity);
      }

      // Get historical values
      const historical = trendData.values
        .filter(v => v.date >= startDate && v.date <= endDate && !v.predicted)
        .map(v => ({ date: v.date, value: v.value }));

      // Get forecast
      const forecast = trendData.forecast
        .filter(f => f.date >= new Date())
        .map(f => ({
          date: f.date,
          predicted: f.predicted,
          lower: f.lower,
          upper: f.upper,
          confidence: f.confidence
        }));

      // Get seasonality
      const seasonality = trendData.metadata.seasonality || {};

      // Detect anomalies
      const anomalies = await TrendData.detectAnomalies(publisherId, metric, startDate, endDate);

      // Calculate current trend
      const recentValues = historical.slice(-7);
      const previousValues = historical.slice(-14, -7);

      const currentAvg = recentValues.length > 0
        ? recentValues.reduce((sum, v) => sum + v.value, 0) / recentValues.length
        : 0;
      const previousAvg = previousValues.length > 0
        ? previousValues.reduce((sum, v) => sum + v.value, 0) / previousValues.length
        : 0;

      const changePercent = previousAvg > 0
        ? ((currentAvg - previousAvg) / previousAvg) * 100
        : 0;

      const trendAnalysis: TrendAnalysis = {
        metric,
        current: {
          value: currentAvg,
          trend: this.determineTrend(changePercent),
          changePercent
        },
        historical,
        forecast,
        seasonality: {
          dayOfWeek: Object.entries(seasonality.dayOfWeek || {}).map(([day, value]) => ({
            day: parseInt(day),
            avgValue: value as number
          })),
          hourOfDay: Object.entries(seasonality.hourOfDay || {}).map(([hour, value]) => ({
            hour: parseInt(hour),
            avgValue: value as number
          }))
        },
        anomalies
      };

      // Cache for 15 minutes
      await cacheSet(cacheKey, trendAnalysis, 900);
      dashboardQueriesTotal.inc({ type: 'trend', publisher_id: publisherId });
      dashboardQueryDuration.observe({ type: 'trend' }, (Date.now() - startTime) / 1000);

      return trendAnalysis;
    } catch (error) {
      serviceLogger.error('Error getting trend analysis', {
        publisherId,
        metric,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Compare two time periods
   */
  async comparePeriods(
    publisherId: string,
    metric: 'revenue' | 'impressions' | 'ctr' | 'ecpm' | 'fillRate' | 'clicks' | 'conversions',
    currentStart: Date,
    currentEnd: Date,
    previousStart: Date,
    previousEnd: Date
  ): Promise<ComparisonResult> {
    const cacheKey = `compare:${publisherId}:${metric}:${currentStart.toISOString()}:${currentEnd.toISOString()}:${previousStart.toISOString()}:${previousEnd.toISOString()}`;

    const cached = await cacheGet<ComparisonResult>(cacheKey);
    if (cached) return cached;

    const result = await TrendData.comparePeriods(
      publisherId,
      metric,
      currentStart,
      currentEnd,
      previousStart,
      previousEnd
    );

    const comparison: ComparisonResult = {
      metric,
      currentPeriod: {
        start: currentStart,
        end: currentEnd,
        value: result.current.total,
        avg: result.current.avg,
        min: result.current.min,
        max: result.current.max
      },
      previousPeriod: {
        start: previousStart,
        end: previousEnd,
        value: result.previous.total,
        avg: result.previous.avg,
        min: result.previous.min,
        max: result.previous.max
      },
      change: {
        absolute: result.change.absolute,
        percent: result.change.percent,
        direction: result.change.direction
      }
    };

    await cacheSet(cacheKey, comparison, 600);
    return comparison;
  }

  /**
   * Get multi-metric trend analysis
   */
  async getMultiMetricTrends(
    publisherId: string,
    metrics: Array<'revenue' | 'impressions' | 'ctr' | 'ecpm' | 'fillRate' | 'clicks' | 'conversions'>,
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, TrendAnalysis['current']>> {
    const results: Record<string, TrendAnalysis['current']> = {};

    await Promise.all(
      metrics.map(async (metric) => {
        const analysis = await this.getTrendAnalysis(publisherId, metric, startDate, endDate);
        results[metric] = analysis.current;
      })
    );

    return results;
  }

  /**
   * Get forecast for a metric
   */
  async getForecast(
    publisherId: string,
    metric: 'revenue' | 'impressions' | 'ctr' | 'ecpm' | 'fillRate' | 'clicks' | 'conversions',
    daysAhead: number = 7
  ): Promise<Array<{
    date: Date;
    predicted: number;
    lower: number;
    upper: number;
    confidence: number;
  }>> {
    const cacheKey = `forecast:${publisherId}:${metric}:${daysAhead}`;

    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const forecast = await TrendData.getForecast(publisherId, metric, daysAhead);

    await cacheSet(cacheKey, forecast, 900);
    return forecast;
  }

  /**
   * Generate trend data from raw metrics
   */
  private async generateTrendData(
    publisherId: string,
    metric: string,
    startDate: Date,
    endDate: Date,
    granularity: 'hourly' | 'daily' | 'weekly' | 'monthly'
  ): Promise<any> {
    // This would typically use ML models to generate forecasts
    // For now, we'll generate basic trend data

    const groupFormat = granularity === 'hourly' ? '%Y-%m-%d %H:00' :
      granularity === 'daily' ? '%Y-%m-%d' :
 granularity === 'weekly' ? '%Y-%W' :
      '%Y-%m';

    let aggregation: any[];

    if (metric === 'revenue') {
      aggregation = await RevenueAnalytics.aggregate([
        {
          $match: {
            publisherId,
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: groupFormat, date: '$date' }
            },
            value: { $sum: '$revenue.total' }
          }
        },
        { $sort: { _id: 1 } }
      ]);
    } else if (metric === 'impressions') {
      aggregation = await PerformanceMetric.aggregate([
        {
          $match: {
            publisherId,
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: groupFormat, date: '$date' }
            },
            value: { $sum: '$impressions.total' }
          }
        },
        { $sort: { _id: 1 } }
      ]);
    } else {
      aggregation = await PerformanceMetric.aggregate([
        {
          $match: {
            publisherId,
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: groupFormat, date: '$date' }
            },
            value: { $avg: `$${metric}` }
          }
        },
        { $sort: { _id: 1 } }
      ]);
    }

    const values = aggregation.map(item => ({
      date: new Date(item._id),
      value: item.value || 0,
      predicted: false
    }));

    // Calculate basic statistics
    const allValues = values.map(v => v.value);
    const avgValue = allValues.length > 0 ? allValues.reduce((a, b) => a + b, 0) / allValues.length : 0;
    const minValue = allValues.length > 0 ? Math.min(...allValues) : 0;
    const maxValue = allValues.length > 0 ? Math.max(...allValues) : 0;
    const totalValue = allValues.reduce((a, b) => a + b, 0);

    // Calculate volatility (coefficient of variation)
    const variance = allValues.length > 0
      ? allValues.reduce((sum, val) => sum + Math.pow(val - avgValue, 2), 0) / allValues.length
      : 0;
    const stdDev = Math.sqrt(variance);
    const volatility = avgValue > 0 ? stdDev / avgValue : 0;

    // Generate simple forecast (linear regression)
    const forecast = this.generateSimpleForecast(values,7);

    // Create trend data document
    const trendData = await TrendData.create({
      publisherId,
      metric,
      granularity,
      values,
      forecast,
      trend: this.determineTrendFromValues(values),
      changePercent: this.calculateChangePercentFromValues(values),
      changeAbsolute: values.length > 1 ? values[values.length - 1].value - values[0].value : 0,
      period: {
        start: startDate,
        end: endDate
      },
      metadata: {
        avgValue,
        minValue,
        maxValue,
        totalValue,
        volatility
      }
    });

    return trendData;
  }

  /**
   * Generate simple forecast using moving average
   */
  private generateSimpleForecast(
    historical: Array<{ date: Date; value: number }>,
    daysAhead: number
  ): Array<{ date: Date; predicted: number; lower: number; upper: number; confidence: number }> {
    if (historical.length < 7) {
      return [];
    }

    // Calculate moving average
    const recentValues = historical.slice(-7).map(v => v.value);
    const avg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;

    // Calculate standard deviation for confidence intervals
    const variance = recentValues.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / recentValues.length;
    const stdDev = Math.sqrt(variance);

    // Generate forecast for each day ahead
    const lastDate = historical[historical.length - 1].date;
    const forecasts = [];

    for (let i = 1; i <= daysAhead; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + i);

      // Confidence decreases as we go further into the future
      const confidence = Math.max(0.5, 0.95 - (i * 0.05));

      forecasts.push({
        date: forecastDate,
        predicted: avg,
        lower: avg - (1.96 * stdDev * (1 + i * 0.1)),
        upper: avg + (1.96 * stdDev * (1 + i * 0.1)),
        confidence
      });
    }

    return forecasts;
  }

  /**
   * Determine trend direction from change percentage
   */
  private determineTrend(changePercent: number): 'increasing' | 'decreasing' | 'stable' {
    if (changePercent > 5) return 'increasing';
    if (changePercent < -5) return 'decreasing';
    return 'stable';
  }

  /**
   * Determine trend from values array
   */
  private determineTrendFromValues(values: Array<{ value: number }>): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((sum, v) => sum + v.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, v) => sum + v.value, 0) / secondHalf.length;

    const changePercent = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
    return this.determineTrend(changePercent);
  }

  /**
   * Calculate change percent from values
   */
  private calculateChangePercentFromValues(values: Array<{ value: number }>): number {
    if (values.length < 2) return 0;

    const first = values[0].value;
    const last = values[values.length - 1].value;

    if (first === 0) return last > 0 ? 100 : 0;
    return ((last - first) / first) * 100;
  }
}

export const trendService = new TrendService();
export default trendService;