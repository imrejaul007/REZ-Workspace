import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { publisherService, inventoryService, revenueService } from '../services/index.js';
import { internalServiceAuth } from '../middleware/index.js';
import { logger, recordError } from '../utils/index.js';

const router = Router();

// Routes with internal service auth
router.use(internalServiceAuth);

/**
 * GET /api/publishers/:publisherId/performance
 * Get comprehensive performance metrics
 */
router.get('/publishers/:publisherId/performance', async (req: Request, res: Response) => {
  try {
    const { publisherId } = req.params;
    const { startDate, endDate, period = '30d' } = req.query;

    // Verify publisher exists
    const publisher = await publisherService.getById(publisherId);
    if (!publisher) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Publisher not found'
      });
      return;
    }

    // Calculate date range based on period
    let start: string;
    let end: string;

    if (startDate && endDate) {
      start = startDate as string;
      end = endDate as string;
    } else {
      const now = new Date();
      end = now.toISOString().split('T')[0];
      const days = parseInt(period as string, 10) || 30;
      start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    // Get revenue summary
    const revenueSummary = await revenueService.getSummary(publisherId, start, end);

    // Get inventory stats
    const inventoryStats = await inventoryService.getStatsSummary(publisherId);

    // Get time series
    const timeseries = await revenueService.getTimeSeries(publisherId, start, end, 'day');

    // Get breakdowns
    const [adTypeBreakdown, geoBreakdown, deviceBreakdown] = await Promise.all([
      revenueService.getBreakdown(publisherId, 'adType', start, end),
      revenueService.getBreakdown(publisherId, 'country', start, end),
      revenueService.getBreakdown(publisherId, 'device', start, end)
    ]);

    // Get top inventory
    const topInventory = await revenueService.getTopInventory(publisherId, start, end, 10);

    // Get hourly patterns
    const hourlyPatterns = await revenueService.getHourlyPatterns(publisherId, start, end);

    // Build performance response
    const performance = {
      publisher: {
        id: publisher._id.toString(),
        name: publisher.name,
        status: publisher.status
      },
      period: {
        start,
        end,
        days: Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (24 * 60 * 60 * 1000))
      },
      summary: {
        totalRevenue: revenueSummary.totalRevenue,
        totalImpressions: revenueSummary.totalImpressions,
        avgEcpm: revenueSummary.avgEcpm,
        fillRate: revenueSummary.fillRate,
        avgViewability: revenueSummary.avgViewability,
        totalClicks: revenueSummary.totalClicks,
        ctr: revenueSummary.ctr,
        totalConversions: revenueSummary.totalConversions
      },
      inventory: {
        total: inventoryStats.totalInventory,
        active: inventoryStats.activeInventory,
        avgFillRate: inventoryStats.avgFillRate,
        avgEcpm: inventoryStats.avgEcpm,
        byType: inventoryStats.byType
      },
      timeseries: timeseries.map(t => ({
        date: t.date,
        revenue: t.revenue,
        impressions: t.impressions,
        ecpm: t.ecpm
      })),
      breakdowns: {
        byAdType: adTypeBreakdown,
        byCountry: geoBreakdown.slice(0, 20), // Top 20 countries
        byDevice: deviceBreakdown
      },
      topInventory: topInventory.map(i => ({
        id: i.inventoryId,
        revenue: i.revenue,
        impressions: i.impressions,
        ecpm: i.ecpm
      })),
      hourlyPatterns: hourlyPatterns.map(h => ({
        hour: h.hour,
        avgRevenue: h.avgRevenue,
        avgImpressions: h.avgImpressions,
        avgEcpm: h.avgEcpm
      }))
    };

    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    logger.error('Failed to get performance', { error });
    recordError('get_performance', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get performance metrics'
    });
  }
});

/**
 * GET /api/publishers/:publisherId/performance/realtime
 * Get real-time performance metrics
 */
router.get('/publishers/:publisherId/performance/realtime', async (req: Request, res: Response) => {
  try {
    const { publisherId } = req.params;

    // Get today's data
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [todayStats, yesterdayStats] = await Promise.all([
      revenueService.getSummary(publisherId, today, today),
      revenueService.getSummary(publisherId, yesterday, yesterday)
    ]);

    // Calculate change
    const revenueChange = yesterdayStats.totalRevenue > 0
      ? ((todayStats.totalRevenue - yesterdayStats.totalRevenue) / yesterdayStats.totalRevenue) * 100
      : 0;

    const impressionsChange = yesterdayStats.totalImpressions > 0
      ? ((todayStats.totalImpressions - yesterdayStats.totalImpressions) / yesterdayStats.totalImpressions) * 100
      : 0;

    res.json({
      success: true,
      data: {
        today: {
          revenue: todayStats.totalRevenue,
          impressions: todayStats.totalImpressions,
          ecpm: todayStats.avgEcpm
        },
        yesterday: {
          revenue: yesterdayStats.totalRevenue,
          impressions: yesterdayStats.totalImpressions,
          ecpm: yesterdayStats.avgEcpm
        },
        changes: {
          revenue: revenueChange,
          impressions: impressionsChange
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get realtime performance', { error });
    recordError('get_realtime_performance', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get realtime metrics'
    });
  }
});

/**
 * GET /api/publishers/:publisherId/performance/trends
 * Get performance trends
 */
router.get('/publishers/:publisherId/performance/trends', async (req: Request, res: Response) => {
  try {
    const { publisherId } = req.params;
    const { weeks = '4' } = req.query;

    const weekCount = parseInt(weeks as string, 10);
    const now = new Date();
    const weeksAgo = new Date(now.getTime() - weekCount * 7 * 24 * 60 * 60 * 1000);

    const startDate = weeksAgo.toISOString().split('T')[0];
    const endDate = now.toISOString().split('T')[0];

    const timeseries = await revenueService.getTimeSeries(publisherId, startDate, endDate, 'day');

    // Calculate weekly aggregates
    const weeklyData: Record<string, { revenue: number; impressions: number; ecpm: number }> = {};

    for (const day of timeseries) {
      const date = new Date(day.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { revenue: 0, impressions: 0, ecpm: 0 };
      }

      weeklyData[weekKey].revenue += day.revenue;
      weeklyData[weekKey].impressions += day.impressions;
    }

    // Calculate average eCPM for each week
    for (const week of Object.keys(weeklyData)) {
      weeklyData[week].ecpm = weeklyData[week].impressions > 0
        ? (weeklyData[week].revenue / weeklyData[week].impressions) * 1000
        : 0;
    }

    const trends = Object.keys(weeklyData)
      .sort()
      .map(week => ({
        week,
        revenue: weeklyData[week].revenue,
        impressions: weeklyData[week].impressions,
        ecpm: weeklyData[week].ecpm
      }));

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    logger.error('Failed to get trends', { error });
    recordError('get_trends', 'unknown');
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get performance trends'
    });
  }
});

export default router;