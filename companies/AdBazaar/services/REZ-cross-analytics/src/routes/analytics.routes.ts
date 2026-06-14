import { Router, Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';
import { ApiResponse, DateRange, Platform, CrossPlatformSummary, DashboardData } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('AnalyticsRoutes');
const router = Router();

/**
 * GET /api/analytics/summary
 * Get cross-platform analytics summary
 */
router.get('/summary', async (req: Request, res: Response) => {
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

    const summary = await analyticsService.getDashboardSummary(dateRange);

    const response: ApiResponse<CrossPlatformSummary> = {
      success: true,
      data: summary,
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get analytics summary', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to get analytics summary',
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/analytics/dashboard
 * Get full dashboard data
 */
router.get('/dashboard', async (req: Request, res: Response) => {
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

    const dashboardData = await analyticsService.getDashboardData(dateRange);

    const response: ApiResponse<DashboardData> = {
      success: true,
      data: dashboardData,
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get dashboard data', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to get dashboard data',
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/analytics/engagement
 * Get engagement metrics
 */
router.get('/engagement', async (req: Request, res: Response) => {
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

    const engagement = await analyticsService.getEngagementMetrics(dateRange, platformList);

    const response: ApiResponse<typeof engagement> = {
      success: true,
      data: engagement,
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get engagement metrics', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to get engagement metrics',
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/analytics/roi
 * Get ROI metrics
 */
router.get('/roi', async (req: Request, res: Response) => {
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

    const roi = await analyticsService.getROIMetrics(dateRange, platformList);

    const response: ApiResponse<typeof roi> = {
      success: true,
      data: roi,
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get ROI metrics', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to get ROI metrics',
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/analytics/compare
 * Compare current period with previous period
 */
router.get('/compare', async (req: Request, res: Response) => {
  try {
    const { start, end, platforms } = req.query;

    if (!start || !end) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'start and end date parameters are required',
      };
      return res.status(400).json(response);
    }

    const currentRange: DateRange = {
      start: new Date(start as string),
      end: new Date(end as string),
    };

    // Calculate previous period (same duration)
    const duration = currentRange.end.getTime() - currentRange.start.getTime();
    const previousRange: DateRange = {
      start: new Date(currentRange.start.getTime() - duration),
      end: new Date(currentRange.start.getTime() - 1),
    };

    const platformList = platforms
      ? (platforms as string).split(',') as Platform[]
      : undefined;

    const comparison = await analyticsService.comparePeriods(
      currentRange,
      previousRange,
      platformList
    );

    const response: ApiResponse<typeof comparison> = {
      success: true,
      data: comparison,
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to compare periods', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to compare periods',
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/analytics/rankings
 * Get content performance rankings
 */
router.get('/rankings', async (req: Request, res: Response) => {
  try {
    const { start, end, sortBy, limit, platforms } = req.query;

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

    const sortMetric = (sortBy as 'impressions' | 'engagements' | 'engagementRate') || 'engagements';
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);

    const platformList = platforms
      ? (platforms as string).split(',') as Platform[]
      : undefined;

    const rankings = await analyticsService.getContentRankings(
      dateRange,
      sortMetric,
      limitNum
    );

    const response: ApiResponse<typeof rankings> = {
      success: true,
      data: rankings,
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get content rankings', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to get content rankings',
    };
    res.status(500).json(response);
  }
});

export default router;
