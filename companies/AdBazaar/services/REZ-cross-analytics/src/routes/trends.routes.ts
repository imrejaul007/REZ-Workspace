import { Router, Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';
import { metricAggregatorService } from '../services/metric-aggregator.service';
import { ApiResponse, DateRange, Platform, TrendData } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('TrendsRoutes');
const router = Router();

/**
 * GET /api/trends
 * Get trend analysis data
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { start, end, granularity, metric, platforms } = req.query;

    if (!start || !end) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'start and end date parameters are required',
      };
      return res.status(400).json(response);
    }

    const dateRange: DateRange = {
      start: new Date(start as string),
      end: new Date(end as string),
    };

    const validGranularities = ['hour', 'day', 'week', 'month'];
    const validMetrics = ['impressions', 'engagements', 'likes', 'comments', 'shares', 'clicks'];

    const gran = (granularity as string) || 'day';
    const met = (metric as string) || 'engagements';

    if (!validGranularities.includes(gran)) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Invalid granularity. Must be one of: ${validGranularities.join(', ')}`,
      };
      return res.status(400).json(response);
    }

    if (!validMetrics.includes(met)) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Invalid metric. Must be one of: ${validMetrics.join(', ')}`,
      };
      return res.status(400).json(response);
    }

    const platformList = platforms
      ? (platforms as string).split(',') as Platform[]
      : undefined;

    const timeSeries = await analyticsService.getTimeSeriesData(
      dateRange,
      gran as 'hour' | 'day' | 'week' | 'month',
      met as 'impressions' | 'engagements' | 'likes' | 'comments' | 'shares',
      platformList
    );

    // Calculate trend statistics
    const trendStats = calculateTrendStatistics(timeSeries);

    const response: ApiResponse<{
      data: typeof timeSeries;
      statistics: typeof trendStats;
    }> = {
      success: true,
      data: {
        data: timeSeries,
        statistics: trendStats,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get trend data', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to get trend data',
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/trends/platform/:platform
 * Get trend data for a specific platform
 */
router.get('/platform/:platform', async (req: Request, res: Response) => {
  try {
    const { platform } = req.params;
    const { start, end, granularity, metric } = req.query;

    if (!start || !end) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'start and end date parameters are required',
      };
      return res.status(400).json(response);
    }

    const validPlatforms: Platform[] = ['twitter', 'instagram', 'linkedin', 'tiktok', 'facebook', 'youtube'];
    if (!validPlatforms.includes(platform as Platform)) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}`,
      };
      return res.status(400).json(response);
    }

    const dateRange: DateRange = {
      start: new Date(start as string),
      end: new Date(end as string),
    };

    const gran = (granularity as string) || 'day';
    const met = (metric as string) || 'engagements';

    const timeSeries = await analyticsService.getTimeSeriesData(
      dateRange,
      gran as 'hour' | 'day' | 'week' | 'month',
      met as 'impressions' | 'engagements' | 'likes' | 'comments' | 'shares',
      [platform as Platform]
    );

    const trendStats = calculateTrendStatistics(timeSeries);

    const response: ApiResponse<{
      data: typeof timeSeries;
      statistics: typeof trendStats;
      platform: Platform;
    }> = {
      success: true,
      data: {
        data: timeSeries,
        statistics: trendStats,
        platform: platform as Platform,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get platform trend data', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to get platform trend data',
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/trends/growth
 * Get growth rate analysis
 */
router.get('/growth', async (req: Request, res: Response) => {
  try {
    const { start, end, platforms } = req.query;

    if (!start || !end) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'start and end date parameters are required',
      };
      return res.status(400).json(response);
    }

    const dateRange: DateRange = {
      start: new Date(start as string),
      end: new Date(end as string),
    };

    const platformList = platforms
      ? (platforms as string).split(',') as Platform[]
      : undefined;

    const metrics = await analyticsService.fetchMetrics(dateRange, platformList);

    // Group by day and calculate daily totals
    const grouped = metricAggregatorService.groupByTimePeriod(metrics, 'day');

    const dailyData: { date: string; total: number }[] = [];
    grouped.forEach((dayMetrics, date) => {
      const totals = metricAggregatorService.aggregateCrossPlatform(dayMetrics);
      dailyData.push({ date, total: totals.totalEngagements });
    });

    // Sort by date
    dailyData.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate growth rates
    const growthRates = calculateGrowthRates(dailyData);

    const response: ApiResponse<{
      dailyData: typeof dailyData;
      growthRates: typeof growthRates;
      averageGrowthRate: number;
    }> = {
      success: true,
      data: {
        dailyData,
        growthRates,
        averageGrowthRate: growthRates.reduce((sum, g) => sum + g.rate, 0) / growthRates.length || 0,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get growth analysis', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to get growth analysis',
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/trends/compare
 * Compare trends across platforms
 */
router.get('/compare', async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'start and end date parameters are required',
      };
      return res.status(400).json(response);
    }

    const dateRange: DateRange = {
      start: new Date(start as string),
      end: new Date(end as string),
    };

    const metrics = await analyticsService.fetchMetrics(dateRange);
    const grouped = metricAggregatorService.groupByTimePeriod(metrics, 'day');

    const platformTrends: Record<string, { date: string; value: number }[]> = {};
    const platforms: Platform[] = ['twitter', 'instagram', 'linkedin', 'tiktok', 'facebook', 'youtube'];

    platforms.forEach((platform) => {
      const platformData: { date: string; value: number }[] = [];
      grouped.forEach((dayMetrics, date) => {
        const platformMetrics = dayMetrics.filter((m) => m.platform === platform);
        const totals = metricAggregatorService.aggregateCrossPlatform(platformMetrics);
        platformData.push({ date, value: totals.totalEngagements });
      });
      platformTrends[platform] = platformData.sort((a, b) => a.date.localeCompare(b.date));
    });

    // Calculate correlation between platforms
    const correlations = calculatePlatformCorrelations(platformTrends);

    const response: ApiResponse<{
      trends: typeof platformTrends;
      correlations: typeof correlations;
    }> = {
      success: true,
      data: {
        trends: platformTrends,
        correlations,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to compare platform trends', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to compare platform trends',
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/trends/forecast
 * Simple trend forecasting
 */
router.get('/forecast', async (req: Request, res: Response) => {
  try {
    const { start, end, periods, platforms } = req.query;

    if (!start || !end) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'start and end date parameters are required',
      };
      return res.status(400).json(response);
    }

    const dateRange: DateRange = {
      start: new Date(start as string),
      end: new Date(end as string),
    };

    const forecastPeriods = Math.min(parseInt(periods as string) || 7, 30);

    const platformList = platforms
      ? (platforms as string).split(',') as Platform[]
      : undefined;

    const metrics = await analyticsService.fetchMetrics(dateRange, platformList);
    const grouped = metricAggregatorService.groupByTimePeriod(metrics, 'day');

    const dailyTotals: number[] = [];
    grouped.forEach((dayMetrics) => {
      const totals = metricAggregatorService.aggregateCrossPlatform(dayMetrics);
      dailyTotals.push(totals.totalEngagements);
    });

    // Simple moving average forecast
    const forecast = simpleMovingAverageForecast(dailyTotals, forecastPeriods);

    const response: ApiResponse<{
      historical: { date: string; value: number }[];
      forecast: { date: string; value: number }[];
      confidence: number;
    }> = {
      success: true,
      data: forecast,
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to generate forecast', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to generate forecast',
    };
    res.status(500).json(response);
  }
});

// Helper functions

interface TrendStatistics {
  min: number;
  max: number;
  average: number;
  total: number;
  change: number;
  changePercentage: number;
}

function calculateTrendStatistics(data: { date: string; platform: Platform; value: number }[]): TrendStatistics {
  if (data.length === 0) {
    return { min: 0, max: 0, average: 0, total: 0, change: 0, changePercentage: 0 };
  }

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const average = values.reduce((sum, v) => sum + v, 0) / values.length;
  const total = values.reduce((sum, v) => sum + v, 0);

  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  const change = lastValue - firstValue;
  const changePercentage = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

  return { min, max, average, total, change, changePercentage };
}

interface GrowthRate {
  date: string;
  previousValue: number;
  currentValue: number;
  rate: number;
}

function calculateGrowthRates(data: { date: string; total: number }[]): GrowthRate[] {
  const rates: GrowthRate[] = [];

  for (let i = 1; i < data.length; i++) {
    const previous = data[i - 1].total;
    const current = data[i].total;
    const rate = previous > 0 ? ((current - previous) / previous) * 100 : 0;

    rates.push({
      date: data[i].date,
      previousValue: previous,
      currentValue: current,
      rate,
    });
  }

  return rates;
}

function calculatePlatformCorrelations(
  trends: Record<string, { date: string; value: number }[]>
): Record<string, Record<string, number>> {
  const platforms = Object.keys(trends);
  const correlations: Record<string, Record<string, number>> = {};

  for (const p1 of platforms) {
    correlations[p1] = {};
    for (const p2 of platforms) {
      if (p1 === p2) {
        correlations[p1][p2] = 1;
      } else {
        // Simple correlation calculation
        const data1 = trends[p1].map((d) => d.value);
        const data2 = trends[p2].map((d) => d.value);
        correlations[p1][p2] = calculatePearsonCorrelation(data1, data2);
      }
    }
  }

  return correlations;
}

function calculatePearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const n = x.length;
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
  const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator > 0 ? numerator / denominator : 0;
}

function simpleMovingAverageForecast(
  historical: number[],
  periods: number
): {
  historical: { date: string; value: number }[];
  forecast: { date: string; value: number }[];
  confidence: number;
} {
  // Calculate moving average
  const windowSize = Math.min(7, historical.length);
  const recentValues = historical.slice(-windowSize);
  const movingAverage = recentValues.reduce((sum, v) => sum + v, 0) / recentValues.length;

  // Calculate trend (simple linear regression slope)
  const n = historical.length;
  let trend = 0;
  if (n > 1) {
    const xMean = (n - 1) / 2;
    const yMean = historical.reduce((sum, v) => sum + v, 0) / n;
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (historical[i] - yMean);
      denominator += (i - xMean) * (i - xMean);
    }
    trend = denominator > 0 ? numerator / denominator : 0;
  }

  // Generate historical data points
  const historicalResult: { date: string; value: number }[] = historical.map((value, i) => ({
    date: `day-${i}`,
    value,
  }));

  // Generate forecast
  const forecast: { date: string; value: number }[] = [];
  const lastDate = historical.length;

  for (let i = 1; i <= periods; i++) {
    // Use weighted combination of moving average and trend
    const trendComponent = trend * (lastDate + i);
    const maComponent = movingAverage;
    const forecastValue = maComponent * 0.7 + trendComponent * 0.3;

    forecast.push({
      date: `forecast-${i}`,
      value: Math.max(0, Math.round(forecastValue)),
    });
  }

  // Calculate confidence based on data consistency
  const variance = historical.reduce((sum, v) => sum + Math.pow(v - movingAverage, 2), 0) / historical.length;
  const stdDev = Math.sqrt(variance);
  const cv = movingAverage > 0 ? stdDev / movingAverage : 1;
  const confidence = Math.max(0, Math.min(100, 100 - cv * 50));

  return {
    historical: historicalResult,
    forecast,
    confidence,
  };
}

export default router;
