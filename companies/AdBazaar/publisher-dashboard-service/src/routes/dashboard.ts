import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  dashboardService,
  revenueService,
  performanceService,
  trendService,
  exportService
} from '../services';
import { extractPublisherId, validateRequest } from '../middleware';
import logger from '../utils/logger';

const router = Router();
const serviceLogger = logger.child({ service: 'dashboardRoutes' });

// Validation schemas
const dateRangeSchema = z.object({
  startDate: z.string().transform(s => new Date(s)).pipe(z.date()),
  endDate: z.string().transform(s => new Date(s)).pipe(z.date()),
});

const exportSchema = z.object({
  format: z.enum(['csv', 'json', 'xlsx', 'pdf']).default('json'),
  type: z.enum(['revenue', 'performance', 'trends', 'full']).default('full'),
  metrics: z.array(z.string()).optional(),
  includeForecast: z.boolean().optional(),
});

/**
 * GET /api/dashboard/:publisherId
 * Main dashboard data
 */
router.get('/dashboard/:publisherId',
  extractPublisherId,
  validateRequest(z.object({
    params: z.object({ publisherId: z.string() }),
    query: z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional()
  })),
  async (req: Request, res: Response) => {
    try {
      const { publisherId } = req.params;
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

      const dateRange = startDate && endDate
        ? { start: new Date(startDate), end: new Date(endDate) }
        : undefined;

      const dashboard = await dashboardService.getDashboard(publisherId, dateRange);

      res.json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      serviceLogger.error('Error getting dashboard', {
        publisherId: req.params.publisherId,
        error: (error as Error).message
      });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get dashboard data'
      });
    }
  }
);

/**
 * GET /api/dashboard/:publisherId/revenue
 * Revenue analytics
 */
router.get('/dashboard/:publisherId/revenue',
  extractPublisherId,
  validateRequest(z.object({
    params: z.object({ publisherId: z.string() }),
    query: z.object({
      startDate: z.string(),
      endDate: z.string(),
      groupBy: z.enum(['hourly', 'daily', 'weekly', 'monthly']).optional(),
    })
 })),
  async (req: Request, res: Response) => {
    try {
      const { publisherId } = req.params;
      const { startDate, endDate, groupBy } = req.query as {
        startDate: string;
        endDate: string;
        groupBy?: 'hourly' | 'daily' | 'weekly' | 'monthly';
      };

      const [revenueAnalytics, byFormat, byCountry, byDevice, hourlyPatterns, dowPatterns] = await Promise.all([
        revenueService.getRevenueAnalytics(publisherId, new Date(startDate), new Date(endDate), groupBy || 'daily'),
        revenueService.getRevenueByFormat(publisherId, new Date(startDate), new Date(endDate)),
        revenueService.getRevenueByCountry(publisherId, new Date(startDate), new Date(endDate)),
        revenueService.getRevenueByDevice(publisherId, new Date(startDate), new Date(endDate)),
        revenueService.getHourlyPatterns(publisherId, new Date(startDate), new Date(endDate)),
        revenueService.getDayOfWeekPatterns(publisherId, new Date(startDate), new Date(endDate)),
      ]);

      res.json({
        success: true,
        data: {
          summary: revenueAnalytics,
          byFormat,
          byCountry,
          byDevice,
          hourlyPatterns,
          dayOfWeekPatterns: dowPatterns
        }
      });
    } catch (error) {
      serviceLogger.error('Error getting revenue analytics', {
        publisherId: req.params.publisherId,
        error: (error as Error).message
      });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get revenue analytics'
      });
    }
  }
);

/**
 * GET /api/dashboard/:publisherId/inventory
 * Inventory overview
 */
router.get('/dashboard/:publisherId/inventory',
  extractPublisherId,
  async (req: Request, res: Response) => {
    try {
      const { publisherId } = req.params;
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const [performance, topAdUnits] = await Promise.all([
        performanceService.getPerformanceMetrics(publisherId, start, end),
        performanceService.getTopAdUnits(publisherId, start, end, 20, 'revenue')
      ]);

      res.json({
        success: true,
        data: {
          overview: performance,
          topAdUnits,
          inventoryHealth: {
            fillRate: performance.fillRate.fillRate,
            viewabilityRate: performance.impressions.viewabilityRate,
            bidRate: performance.fillRate.bidRate
          }
        }
      });
    } catch (error) {
      serviceLogger.error('Error getting inventory', {
        publisherId: req.params.publisherId,
        error: (error as Error).message
      });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get inventory data'
      });
    }
  }
);

/**
 * GET /api/dashboard/:publisherId/performance
 * Performance metrics
 */
router.get('/dashboard/:publisherId/performance',
  extractPublisherId,
  async (req: Request, res: Response) => {
    try {
      const { publisherId } = req.params;
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const [performance, byDevice, byCountry, hourlyPatterns, timeSeries] = await Promise.all([
        performanceService.getPerformanceMetrics(publisherId, start, end),
        performanceService.getPerformanceByDevice(publisherId, start, end),
        performanceService.getPerformanceByCountry(publisherId, start, end),
        performanceService.getHourlyPatterns(publisherId, start, end),
        performanceService.getTimeSeries(publisherId, start, end, ['impressions', 'clicks', 'revenue', 'ctr', 'ecpm'])
      ]);

      res.json({
        success: true,
        data: {
          summary: performance,
          byDevice,
          byCountry,
          hourlyPatterns,
          timeSeries
        }
      });
    } catch (error) {
      serviceLogger.error('Error getting performance metrics', {
        publisherId: req.params.publisherId,
        error: (error as Error).message
      });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get performance metrics'
      });
    }
  }
);

/**
 * GET /api/dashboard/:publisherId/trends
 * Trend analysis
 */
router.get('/dashboard/:publisherId/trends',
  extractPublisherId,
  async (req: Request, res: Response) => {
    try {
      const { publisherId } = req.params;
      const { startDate, endDate, metric, granularity } = req.query as {
        startDate?: string;
        endDate?: string;
        metric?: 'revenue' | 'impressions' | 'ctr' | 'ecpm' | 'fillRate' | 'clicks' | 'conversions';
        granularity?: 'hourly' | 'daily' | 'weekly' | 'monthly';
      };

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      const selectedMetric = metric || 'revenue';
      const selectedGranularity = granularity || 'daily';

      const [revenueTrend, impressionsTrend, ctrTrend, ecpmTrend] = await Promise.all([
        trendService.getTrendAnalysis(publisherId, 'revenue', start, end, selectedGranularity),
        trendService.getTrendAnalysis(publisherId, 'impressions', start, end, selectedGranularity),
        trendService.getTrendAnalysis(publisherId, 'ctr', start, end, selectedGranularity),
        trendService.getTrendAnalysis(publisherId, 'ecpm', start, end, selectedGranularity)
      ]);

      res.json({
        success: true,
        data: {
          revenue: revenueTrend,
          impressions: impressionsTrend,
          ctr: ctrTrend,
          ecpm: ecpmTrend
        }
      });
    } catch (error) {
      serviceLogger.error('Error getting trends', {
        publisherId: req.params.publisherId,
        error: (error as Error).message
      });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get trend analysis'
      });
    }
  }
);

/**
 * GET /api/dashboard/:publisherId/demographics
 * Audience demographics
 */
router.get('/dashboard/:publisherId/demographics',
  extractPublisherId,
  async (req: Request, res: Response) => {
    try {
      const { publisherId } = req.params;
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const [byCountry, byDevice] = await Promise.all([
        performanceService.getPerformanceByCountry(publisherId, start, end, 50),
        performanceService.getPerformanceByDevice(publisherId, start, end)
      ]);

      res.json({
        success: true,
        data: {
          byCountry,
          byDevice,
          summary: {
            topCountries: byCountry.slice(0, 10),
            deviceBreakdown: byDevice,
            totalCountries: byCountry.length
          }
        }
      });
    } catch (error) {
      serviceLogger.error('Error getting demographics', {
        publisherId: req.params.publisherId,
        error: (error as Error).message
      });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get demographics data'
      });
    }
  }
);

/**
 * GET /api/dashboard/:publisherId/geography
 * Geographic breakdown
 */
router.get('/dashboard/:publisherId/geography',
  extractPublisherId,
  async (req: Request, res: Response) => {
    try {
      const { publisherId } = req.params;
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const [performanceByCountry, revenueByCountry] = await Promise.all([
        performanceService.getPerformanceByCountry(publisherId, start, end, 100),
        revenueService.getRevenueByCountry(publisherId, start, end, 100)
      ]);

      // Calculate geographic distribution
      const totalRevenue = revenueByCountry.reduce((sum, c) => sum + c.revenue, 0);
      const totalImpressions = performanceByCountry.reduce((sum, c) => sum + c.impressions, 0);

      const geographicData = performanceByCountry.map(country => {
        const revenue = revenueByCountry.find(r => r.country === country.country);
        return {
          country: country.country,
          revenue: revenue?.revenue || 0,
          impressions: country.impressions,
          clicks: country.clicks,
          ctr: country.ctr,
          ecpm: country.ecpm,
          revenueShare: totalRevenue > 0 ? (revenue?.revenue || 0) / totalRevenue * 100 : 0,
          impressionsShare: totalImpressions > 0 ? country.impressions / totalImpressions * 100 : 0
        };
      });

      res.json({
        success: true,
        data: {
          breakdown: geographicData.sort((a, b) => b.revenue - a.revenue),
          summary: {
            totalCountries: geographicData.length,
            topMarket: geographicData[0]?.country || 'N/A',
            topMarketRevenue: geographicData[0]?.revenue || 0,
            geographicConcentration: geographicData.slice(0, 5).reduce((sum, c) => sum + c.revenueShare, 0)
          }
        }
      });
    } catch (error) {
      serviceLogger.error('Error getting geography', {
        publisherId: req.params.publisherId,
        error: (error as Error).message
      });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get geographic data'
      });
    }
  }
);

/**
 * GET /api/dashboard/:publisherId/devices
 * Device breakdown
 */
router.get('/dashboard/:publisherId/devices',
  extractPublisherId,
  async (req: Request, res: Response) => {
    try {
      const { publisherId } = req.params;
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const [performanceByDevice, hourlyPatterns] = await Promise.all([
        performanceService.getPerformanceByDevice(publisherId, start, end),
        performanceService.getHourlyPatterns(publisherId, start, end)
      ]);

      res.json({
        success: true,
        data: {
          breakdown: performanceByDevice,
          hourlyPatterns,
          summary: {
            dominantDevice: performanceByDevice[0]?.deviceType || 'N/A',
            mobileShare: performanceByDevice.find(d => d.deviceType === 'mobile')?.percentage || 0,
            desktopShare: performanceByDevice.find(d => d.deviceType === 'desktop')?.percentage || 0,
            tabletShare: performanceByDevice.find(d => d.deviceType === 'tablet')?.percentage || 0
          }
        }
      });
    } catch (error) {
      serviceLogger.error('Error getting device breakdown', {
        publisherId: req.params.publisherId,
        error: (error as Error).message
      });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get device data'
      });
    }
  }
);

/**
 * GET /api/dashboard/:publisherId/compare
 * Compare periods
 */
router.get('/dashboard/:publisherId/compare',
  extractPublisherId,
  async (req: Request, res: Response) => {
    try {
      const { publisherId } = req.params;
      const {
        metric,
        currentStart,
        currentEnd,
        previousStart,
        previousEnd
      } = req.query as {
        metric?: 'revenue' | 'impressions' | 'ctr' | 'ecpm' | 'fillRate' | 'clicks' | 'conversions';
        currentStart: string;
        currentEnd: string;
        previousStart: string;
        previousEnd: string;
      };

      const selectedMetric = metric || 'revenue';

      const [revenueComparison, impressionsComparison, ctrComparison] = await Promise.all([
        trendService.comparePeriods(
          publisherId,
          'revenue',
          new Date(currentStart),
          new Date(currentEnd),
          new Date(previousStart),
          new Date(previousEnd)
        ),
        trendService.comparePeriods(
          publisherId,
          'impressions',
          new Date(currentStart),
          new Date(currentEnd),
          new Date(previousStart),
          new Date(previousEnd)
        ),
        trendService.comparePeriods(
          publisherId,
          'ctr',
          new Date(currentStart),
          new Date(currentEnd),
          new Date(previousStart),
          new Date(previousEnd)
        )
      ]);

      res.json({
        success: true,
        data: {
          revenue: revenueComparison,
          impressions: impressionsComparison,
          ctr: ctrComparison,
          summary: {
            revenueChange: revenueComparison.change.percent,
            impressionsChange: impressionsComparison.change.percent,
            ctrChange: ctrComparison.change.percent
          }
        }
      });
    } catch (error) {
      serviceLogger.error('Error comparing periods', {
        publisherId: req.params.publisherId,
        error: (error as Error).message
      });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to compare periods'
      });
    }
  }
);

/**
 * GET /api/dashboard/:publisherId/export
 * Export data
 */
router.get('/dashboard/:publisherId/export',
  extractPublisherId,
  async (req: Request, res: Response) => {
    try {
      const { publisherId } = req.params;
      const {
        startDate,
        endDate,
        format = 'json',
        type = 'full',
        metrics,
        includeForecast
      } = req.query as {
        startDate: string;
        endDate: string;
        format?: 'csv' | 'json' | 'xlsx' | 'pdf';
        type?: 'revenue' | 'performance' | 'trends' | 'full';
        metrics?: string;
        includeForecast?: string;
      };

      const exportOptions = {
        publisherId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        format: format as 'csv' | 'json' | 'xlsx' | 'pdf',
        type: type as 'revenue' | 'performance' | 'trends' | 'full',
        metrics: metrics ? metrics.split(',') : undefined,
        includeForecast: includeForecast === 'true'
      };

      const result = await exportService.exportData(exportOptions);

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.data);
    } catch (error) {
      serviceLogger.error('Error exporting data', {
        publisherId: req.params.publisherId,
        error: (error as Error).message
      });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to export data'
      });
    }
  }
);

export default router;