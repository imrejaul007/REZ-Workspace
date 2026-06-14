import { Router, Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service.js';
import { businessService } from '../services/business.service.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * @route   GET /api/business/:id/analytics
 * @desc    Get analytics for a specific business
 * @access  Private
 */
router.get('/business/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { period } = req.query;
    const validPeriods = ['day', 'week', 'month', 'year'];
    const analyticsPeriod = validPeriods.includes(period as string)
      ? (period as 'day' | 'week' | 'month' | 'year')
      : 'month';

    const result = await analyticsService.getBusinessAnalytics(
      req.params.id,
      analyticsPeriod
    );

    if (!result.success) {
      res.status(404).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting business analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics'
    });
  }
});

/**
 * @route   GET /api/analytics/platform
 * @desc    Get platform-wide analytics (admin only)
 * @access  Private (Admin)
 */
router.get('/platform', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await analyticsService.getPlatformAnalytics();

    if (!result.success) {
      res.status(500).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting platform analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get platform analytics'
    });
  }
});

/**
 * @route   GET /api/analytics/summary
 * @desc    Get analytics summary for all user's businesses
 * @access  Private
 */
router.get('/summary', authenticate, async (req: Response): Promise<void> => {
  try {
    // Get all businesses for the user
    const businessesResult = await businessService.getBusinessesByOwner('current-user');

    if (!businessesResult.success || !businessesResult.data) {
      res.json({
        success: true,
        data: {
          totalBusinesses: 0,
          totalRevenue: 0,
          totalOrders: 0,
          totalCustomers: 0,
          averageOrderValue: 0
        }
      });
      return;
    }

    const businesses = businessesResult.data;

    // Aggregate stats
    const summary = businesses.reduce(
      (acc, business) => {
        acc.totalRevenue += business.stats.totalRevenue;
        acc.totalOrders += business.stats.totalOrders;
        acc.totalCustomers += business.stats.totalCustomers;
        return acc;
      },
      { totalRevenue: 0, totalOrders: 0, totalCustomers: 0 }
    );

    summary.averageOrderValue = summary.totalOrders > 0
      ? summary.totalRevenue / summary.totalOrders
      : 0;

    res.json({
      success: true,
      data: {
        totalBusinesses: businesses.length,
        ...summary
      }
    });
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics summary'
    });
  }
});

/**
 * @route   GET /api/analytics/industry/:type
 * @desc    Get analytics for a specific industry
 * @access  Private (Admin)
 */
router.get('/industry/:type', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const industryType = req.params.type;

    // Get all businesses for this industry
    const businessesResult = await businessService.listBusinesses({
      industry: industryType as any,
      isActive: true,
      limit: 1000
    });

    if (!businessesResult.success) {
      res.status(500).json({
        success: false,
        error: 'Failed to get industry analytics'
      });
      return;
    }

    const businesses = businessesResult.data;

    // Aggregate stats for the industry
    const stats = businesses.reduce(
      (acc, business) => {
        acc.totalRevenue += business.stats.totalRevenue;
        acc.totalOrders += business.stats.totalOrders;
        acc.totalCustomers += business.stats.totalCustomers;
        acc.totalStaff += business.stats.totalStaff;
        return acc;
      },
      { totalRevenue: 0, totalOrders: 0, totalCustomers: 0, totalStaff: 0 }
    );

    res.json({
      success: true,
      data: {
        industry: industryType,
        businessCount: businesses.length,
        ...stats,
        averageOrderValue: stats.totalOrders > 0
          ? stats.totalRevenue / stats.totalOrders
          : 0
      }
    });
  } catch (error) {
    console.error('Error getting industry analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get industry analytics'
    });
  }
});

export default router;
