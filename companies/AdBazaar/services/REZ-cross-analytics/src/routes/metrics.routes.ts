import { Router, Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';
import { metricAggregatorService } from '../services/metric-aggregator.service';
import { ApiResponse, DateRange, Platform, UnifiedMetrics, AggregatedMetrics } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('MetricsRoutes');
const router = Router();

/**
 * GET /api/metrics
 * Get unified metrics from all platforms
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { start, end, platforms, limit, offset } = req.query;

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

    let metrics = await analyticsService.fetchMetrics(dateRange, platformList);

    // Apply pagination
    const limitNum = parseInt(limit as string) || 100;
    const offsetNum = parseInt(offset as string) || 0;
    const total = metrics.length;

    metrics = metrics.slice(offsetNum, offsetNum + limitNum);

    const response: ApiResponse<UnifiedMetrics[]> = {
      success: true,
      data: metrics,
      pagination: {
        page: Math.floor(offsetNum / limitNum) + 1,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get metrics', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to get metrics',
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/metrics/platform/:platform
 * Get metrics from a specific platform
 */
router.get('/platform/:platform', async (req: Request, res: Response) => {
  try {
    const { platform } = req.params;
    const { start, end, limit, offset } = req.query;

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

    let metrics = await analyticsService.fetchPlatformMetrics(platform as Platform, dateRange);

    // Apply pagination
    const limitNum = parseInt(limit as string) || 100;
    const offsetNum = parseInt(offset as string) || 0;
    const total = metrics.length;

    metrics = metrics.slice(offsetNum, offsetNum + limitNum);

    const response: ApiResponse<UnifiedMetrics[]> = {
      success: true,
      data: metrics,
      pagination: {
        page: Math.floor(offsetNum / limitNum) + 1,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get platform metrics', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to get platform metrics',
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/metrics/aggregated
 * Get aggregated metrics by platform
 */
router.get('/aggregated', async (req: Request, res: Response) => {
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

    const aggregated = await analyticsService.getAggregatedMetrics(dateRange, platformList);

    const response: ApiResponse<AggregatedMetrics[]> = {
      success: true,
      data: aggregated,
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get aggregated metrics', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to get aggregated metrics',
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/metrics/timeseries
 * Get time-series metrics for charts
 */
router.get('/timeseries', async (req: Request, res: Response) => {
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
    const validMetrics = ['impressions', 'engagements', 'likes', 'comments', 'shares'];

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

    const response: ApiResponse<typeof timeSeries> = {
      success: true,
      data: timeSeries,
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get time-series metrics', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to get time-series metrics',
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/metrics/top
 * Get top performing content
 */
router.get('/top', async (req: Request, res: Response) => {
  try {
    const { start, end, metric, limit, platforms } = req.query;

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

    const validMetrics = ['impressions', 'engagements', 'likes', 'comments', 'shares'];
    const sortMetric = (metric as string) || 'engagements';

    if (!validMetrics.includes(sortMetric)) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Invalid metric. Must be one of: ${validMetrics.join(', ')}`,
      };
      return res.status(400).json(response);
    }

    const limitNum = Math.min(parseInt(limit as string) || 10, 50);

    const metrics = await analyticsService.fetchMetrics(dateRange);
    const platformList = platforms
      ? (platforms as string).split(',') as Platform[]
      : undefined;

    let filteredMetrics = metrics;
    if (platformList) {
      filteredMetrics = metricAggregatorService.filterByPlatforms(filteredMetrics, platformList);
    }

    const topContent = metricAggregatorService.getTopPerforming(
      filteredMetrics,
      sortMetric as 'impressions' | 'engagements' | 'likes' | 'comments' | 'shares',
      limitNum
    );

    const response: ApiResponse<UnifiedMetrics[]> = {
      success: true,
      data: topContent,
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get top content', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to get top content',
    };
    res.status(500).json(response);
  }
});

export default router;
