import { ForecastAnalytics, IForecastAnalytics } from '../models/ForecastAnalytics';
import { Forecast } from '../models/Forecast';
import { DemandTrend } from '../models/DemandTrend';
import { logger } from '../utils/logger';
import { forecastRequestsTotal, forecastAccuracyGauge } from '../utils/metrics';

// Analytics request interface
export interface AnalyticsRequest {
  eventId: string;
  startDate?: Date;
  endDate?: Date;
}

// Analytics response interface
export interface AnalyticsResponse {
  success: boolean;
  data?: IForecastAnalytics;
  error?: string;
}

// Dashboard data interface
export interface DashboardData {
  totalForecasts: number;
  activeForecasts: number;
  avgAccuracy: number;
  avgMape: number;
  topCategories: { category: string; count: number; avgDemand: number }[];
  topLocations: { location: string; count: number; avgDemand: number }[];
  recentAnalytics: IForecastAnalytics[];
  trendSummary: {
    increasing: number;
    decreasing: number;
    stable: number;
    volatile: number;
  };
}

// Analytics Service
class AnalyticsService {
  /**
   * Get forecast analytics for an event
   */
  async getAnalytics(eventId: string): Promise<AnalyticsResponse> {
    try {
      const analytics = await ForecastAnalytics.findOne({ eventId })
        .sort({ 'period.end': -1 });

      if (!analytics) {
        // Generate analytics if not exists
        return this.generateAnalytics(eventId);
      }

      forecastRequestsTotal.inc({ type: 'analytics', status: 'success' });
      return {
        success: true,
        data: analytics
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get analytics', { error: errorMessage, eventId });
      forecastRequestsTotal.inc({ type: 'analytics', status: 'error' });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Generate analytics for an event
   */
  async generateAnalytics(eventId: string): Promise<AnalyticsResponse> {
    try {
      const forecast = await Forecast.findOne({ eventId });
      if (!forecast) {
        return {
          success: false,
          error: `Forecast for event ${eventId} not found`
        };
      }

      // Get trend data
      const trends = await DemandTrend.find({ eventId })
        .sort({ date: -1 })
        .limit(30);

      // Calculate error metrics
      const errors = this.calculateErrorMetrics(trends);

      // Calculate performance metrics
      const performance = this.calculatePerformanceMetrics(errors);

      // Get comparison data
      const comparison = await this.getComparisonData(forecast, trends);

      // Calculate data quality
      const dataQuality = this.calculateDataQuality(trends, forecast);

      // Generate insights
      const insights = this.generateInsights(forecast, trends, errors, performance);

      // Create analytics record
      const analytics = new ForecastAnalytics({
        eventId,
        eventName: forecast.eventName,
        category: forecast.category,
        location: forecast.location,
        period: {
          start: forecast.startDate,
          end: forecast.endDate,
          days: Math.ceil((forecast.endDate.getTime() - forecast.startDate.getTime()) / (1000 * 60 * 60 * 24))
        },
        errors,
        performance,
        comparison,
        dataQuality,
        status: 'completed',
        insights,
        metadata: {
          dataPoints: trends.length,
          algorithms: ['ensemble', 'time-series'],
          lastCalculated: new Date()
        }
      });

      await analytics.save();

      // Update accuracy gauge
      forecastAccuracyGauge.set(
        { event_category: forecast.category, location: forecast.location },
        performance.accuracy * 100
      );

      logger.info('Analytics generated', {
        eventId,
        accuracy: performance.accuracy,
        mape: errors.mape
      });

      return {
        success: true,
        data: analytics
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to generate analytics', { error: errorMessage, eventId });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get dashboard data
   */
  async getDashboard(): Promise<{
    success: boolean;
    data?: DashboardData;
    error?: string;
  }> {
    try {
      // Get forecast counts
      const totalForecasts = await Forecast.countDocuments();
      const activeForecasts = await Forecast.countDocuments({
        status: { $in: ['active', 'calibrated'] }
      });

      // Get analytics stats
      const overallStats = await ForecastAnalytics.getOverallStats();
      const avgAccuracy = overallStats[0]?.avgAccuracy || 0;
      const avgMape = overallStats[0]?.avgMape || 0;

      // Get top categories
      const topCategories = await Forecast.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            avgDemand: { $avg: '$predicted.totalDemand' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]).exec();

      // Get top locations
      const topLocations = await Forecast.aggregate([
        {
          $group: {
            _id: '$location',
            count: { $sum: 1 },
            avgDemand: { $avg: '$predicted.totalDemand' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]).exec();

      // Get recent analytics
      const recentAnalytics = await ForecastAnalytics.find()
        .sort({ createdAt: -1 })
        .limit(10);

      // Get trend summary
      const trendSummary = await this.getTrendSummary();

      const dashboard: DashboardData = {
        totalForecasts,
        activeForecasts,
        avgAccuracy: Math.round(avgAccuracy * 10000) / 100,
        avgMape: Math.round(avgMape * 100) / 100,
        topCategories: topCategories.map(c => ({
          category: c._id,
          count: c.count,
          avgDemand: Math.round(c.avgDemand)
        })),
        topLocations: topLocations.map(l => ({
          location: l._id,
          count: l.count,
          avgDemand: Math.round(l.avgDemand)
        })),
        recentAnalytics,
        trendSummary
      };

      forecastRequestsTotal.inc({ type: 'dashboard', status: 'success' });
      return {
        success: true,
        data: dashboard
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get dashboard', { error: errorMessage });
      forecastRequestsTotal.inc({ type: 'dashboard', status: 'error' });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Calculate error metrics from trends
   */
  private calculateErrorMetrics(trends: InstanceType<typeof DemandTrend>[]): {
    mae: number;
    mse: number;
    rmse: number;
    mape: number;
    bias: number;
  } {
    if (trends.length === 0) {
      return { mae: 0, mse: 0, rmse: 0, mape: 0, bias: 0 };
    }

    const errors: number[] = [];
    const squaredErrors: number[] = [];
    const percentageErrors: number[] = [];
    let bias = 0;

    for (const trend of trends) {
      const error = trend.demand.variance;
      const predicted = trend.demand.predicted;

      errors.push(Math.abs(error));
      squaredErrors.push(error * error);
      bias += error;

      if (predicted > 0) {
        percentageErrors.push(Math.abs(error / predicted) * 100);
      }
    }

    const mae = errors.reduce((a, b) => a + b, 0) / errors.length;
    const mse = squaredErrors.reduce((a, b) => a + b, 0) / squaredErrors.length;
    const rmse = Math.sqrt(mse);
    const mape = percentageErrors.length > 0
      ? percentageErrors.reduce((a, b) => a + b, 0) / percentageErrors.length
      : 0;
    const biasAvg = bias / errors.length;

    return {
      mae: Math.round(mae * 100) / 100,
      mse: Math.round(mse * 100) / 100,
      rmse: Math.round(rmse * 100) / 100,
      mape: Math.round(mape * 100) / 100,
      bias: Math.round(biasAvg * 100) / 100
    };
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(errors: { mape: number; mae: number }): {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  } {
    // Accuracy based on MAPE (lower is better)
    const accuracy = Math.max(0, 1 - errors.mape / 100);

    // Precision: how consistent are predictions
    const precision = errors.mape <= 5 ? 0.95 : errors.mape <= 10 ? 0.85 : errors.mape <= 20 ? 0.7 : 0.5;

    // Recall: how often do we capture actual demand
    const recall = errors.mape <= 10 ? 0.9 : errors.mape <= 20 ? 0.75 : 0.6;

    // F1 Score
    const f1Score = 2 * (precision * recall) / (precision + recall);

    return {
      accuracy: Math.round(accuracy * 1000) / 1000,
      precision: Math.round(precision * 1000) / 1000,
      recall: Math.round(recall * 1000) / 1000,
      f1Score: Math.round(f1Score * 1000) / 1000
    };
  }

  /**
   * Get comparison data
   */
  private async getComparisonData(
    forecast: InstanceType<typeof Forecast>,
    trends: InstanceType<typeof DemandTrend>[]
  ): Promise<{
    vsHistorical: number;
    vsCategoryAvg: number;
    vsLocationAvg: number;
  }> {
    const currentDemand = forecast.predicted.totalDemand;

    // Compare with historical
    const historicalFactor = forecast.factors.historical;
    const vsHistorical = historicalFactor > 0
      ? ((currentDemand - historicalFactor) / historicalFactor) * 100
      : 0;

    // Compare with category average
    const categoryAvg = await Forecast.aggregate([
      { $match: { category: forecast.category } },
      { $group: { _id: null, avgDemand: { $avg: '$predicted.totalDemand' } } }
    ]).exec();
    const catAvg = categoryAvg[0]?.avgDemand || currentDemand;
    const vsCategoryAvg = ((currentDemand - catAvg) / catAvg) * 100;

    // Compare with location average
    const locationAvg = await Forecast.aggregate([
      { $match: { location: forecast.location } },
      { $group: { _id: null, avgDemand: { $avg: '$predicted.totalDemand' } } }
    ]).exec();
    const locAvg = locationAvg[0]?.avgDemand || currentDemand;
    const vsLocationAvg = ((currentDemand - locAvg) / locAvg) * 100;

    return {
      vsHistorical: Math.round(vsHistorical * 100) / 100,
      vsCategoryAvg: Math.round(vsCategoryAvg * 100) / 100,
      vsLocationAvg: Math.round(vsLocationAvg * 100) / 100
    };
  }

  /**
   * Calculate data quality metrics
   */
  private calculateDataQuality(
    trends: InstanceType<typeof DemandTrend>[],
    forecast: InstanceType<typeof Forecast>
  ): {
    completeness: number;
    freshness: number;
    reliability: number;
  } {
    // Completeness: what % of expected data points do we have
    const expectedDays = Math.ceil((forecast.endDate.getTime() - forecast.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const completeness = Math.min(1, trends.length / expectedDays);

    // Freshness: how recent is the data
    const lastTrend = trends[0];
    const hoursSinceLastUpdate = lastTrend
      ? (Date.now() - lastTrend.date.getTime()) / (1000 * 60 * 60)
      : 24;
    const freshness = Math.max(0, 1 - hoursSinceLastUpdate / 48);

    // Reliability: based on data sources
    const avgConfidence = trends.length > 0
      ? trends.reduce((a, t) => a + t.confidence, 0) / trends.length
      : 0.5;
    const reliability = avgConfidence;

    return {
      completeness: Math.round(completeness * 1000) / 1000,
      freshness: Math.round(freshness * 1000) / 1000,
      reliability: Math.round(reliability * 1000) / 1000
    };
  }

  /**
   * Generate insights from analytics
   */
  private generateInsights(
    forecast: InstanceType<typeof Forecast>,
    trends: InstanceType<typeof DemandTrend>[],
    errors: { mape: number; bias: number },
    performance: { accuracy: number }
  ): {
    majorFactors: string[];
    anomalies: string[];
    recommendations: string[];
  } {
    const majorFactors: string[] = [];
    const anomalies: string[] = [];
    const recommendations: string[] = [];

    // Identify major factors
    const factorValues = [
      { name: 'historical', value: forecast.factors.historical },
      { name: 'seasonal', value: forecast.factors.seasonal },
      { name: 'promotional', value: forecast.factors.promotional },
      { name: 'weather', value: forecast.factors.weather },
      { name: 'location', value: forecast.factors.location }
    ];

    factorValues
      .filter(f => f.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .forEach(f => majorFactors.push(f.name));

    // Identify anomalies
    if (errors.mape > 20) {
      anomalies.push(`High MAPE (${errors.mape}%) indicates forecast model needs recalibration`);
    }

    if (errors.bias > 100) {
      anomalies.push(`Positive bias suggests systematic overestimation`);
    } else if (errors.bias < -100) {
      anomalies.push(`Negative bias suggests systematic underestimation`);
    }

    // Generate recommendations
    if (performance.accuracy < 0.7) {
      recommendations.push('Consider adding more historical data to improve accuracy');
    }

    if (errors.mape > 15) {
      recommendations.push('Review factor weights and adjust based on recent performance');
    }

    if (trends.length < 10) {
      recommendations.push('More data points needed for reliable trend analysis');
    }

    if (forecast.confidence.score < 0.5) {
      recommendations.push('Low confidence - consider adding external signals (weather, social media)');
    }

    // Always add general recommendations
    recommendations.push('Monitor daily trends and adjust forecast as event date approaches');

    return {
      majorFactors,
      anomalies,
      recommendations
    };
  }

  /**
   * Get trend summary across all events
   */
  private async getTrendSummary(): Promise<{
    increasing: number;
    decreasing: number;
    stable: number;
    volatile: number;
  }> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const summary = await DemandTrend.aggregate([
        { $match: { date: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: '$trend.direction',
            count: { $sum: 1 }
          }
        }
      ]).exec();

      const result = {
        increasing: 0,
        decreasing: 0,
        stable: 0,
        volatile: 0
      };

      for (const item of summary) {
        if (item._id in result) {
          result[item._id as keyof typeof result] = item.count;
        }
      }

      return result;
    } catch (error) {
      logger.warn('Failed to get trend summary', { error });
      return {
        increasing: 0,
        decreasing: 0,
        stable: 0,
        volatile: 0
      };
    }
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;