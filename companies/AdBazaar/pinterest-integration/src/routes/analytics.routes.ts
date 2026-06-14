import { Router, Request, Response, NextFunction } from 'express';
import { PinterestService } from '../services/pinterest.service';
import { authMiddleware, IAuthenticatedRequest, AppError } from '../middleware';
import { z } from 'zod';

const router = Router();
const pinterestService = new PinterestService();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Validation schemas
const analyticsSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pinId: z.string().optional(),
});

/**
 * @route GET /api/analytics
 * @description Get overall analytics for the account
 */
router.get('/', async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const accountId = req.accountId!;
    const { startDate, endDate, pinId } = req.query;

    // Default to last 30 days if no dates provided
    const end = endDate
      ? new Date(endDate as string)
      : new Date();
    const start = startDate
      ? new Date(startDate as string)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };

    const analytics = await pinterestService.getAnalytics(
      accountId,
      formatDate(start),
      formatDate(end)
    );

    res.json({
      success: true,
      data: {
        dateRange: {
          startDate: formatDate(start),
          endDate: formatDate(end),
        },
        summary: analytics[0] ? {
          impressions: analytics[0].impressions,
          saves: analytics[0].saves,
          clicks: analytics[0].clicks,
          repins: analytics[0].repins,
          comments: analytics[0].comments,
          followers: analytics[0].followers,
        } : null,
        topPins: analytics[0]?.topPins || [],
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/analytics/audience
 * @description Get audience insights
 */
router.get('/audience', async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const accountId = req.accountId!;
    const insights = await pinterestService.getAudienceInsights(accountId);

    res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/analytics/pins/:id
 * @description Get analytics for a specific pin
 */
router.get('/pins/:id', async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // Default to last 30 days if no dates provided
    const end = endDate
      ? new Date(endDate as string)
      : new Date();
    const start = startDate
      ? new Date(startDate as string)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };

    // Get pin details
    const pin = await pinterestService.getPinById(id);
    if (!pin) {
      throw new AppError(404, 'Pin not found');
    }

    res.json({
      success: true,
      data: {
        pinId: id,
        title: pin.title,
        dateRange: {
          startDate: formatDate(start),
          endDate: formatDate(end),
        },
        metrics: {
          viewCount: pin.viewCount,
          repinCount: pin.repinCount,
          clickCount: pin.clickCount,
          savedCount: pin.savedCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/analytics/boards/:id
 * @description Get analytics for a specific board
 */
router.get('/boards/:id', async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // Get board details
    const board = await pinterestService.getBoardById(id);
    if (!board) {
      throw new AppError(404, 'Board not found');
    }

    // Get all pins for this board
    const pins = await pinterestService.getPins(req.accountId!, id);

    // Calculate aggregate metrics
    const aggregateMetrics = pins.reduce(
      (acc, pin) => ({
        totalViews: acc.totalViews + pin.viewCount,
        totalRepins: acc.totalRepins + pin.repinCount,
        totalClicks: acc.totalClicks + pin.clickCount,
        totalSaves: acc.totalSaves + pin.savedCount,
      }),
      { totalViews: 0, totalRepins: 0, totalClicks: 0, totalSaves: 0 }
    );

    res.json({
      success: true,
      data: {
        boardId: id,
        boardName: board.name,
        dateRange: {
          startDate: startDate || 'all-time',
          endDate: endDate || 'today',
        },
        metrics: {
          totalPins: pins.length,
          totalViews: aggregateMetrics.totalViews,
          totalRepins: aggregateMetrics.totalRepins,
          totalClicks: aggregateMetrics.totalClicks,
          totalSaves: aggregateMetrics.totalSaves,
          followerCount: board.followerCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/analytics/export
 * @description Export analytics data
 */
router.get('/export', async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const accountId = req.accountId!;
    const { format = 'json', startDate, endDate } = req.query;

    // Default to last 30 days if no dates provided
    const end = endDate
      ? new Date(endDate as string)
      : new Date();
    const start = startDate
      ? new Date(startDate as string)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };

    const analytics = await pinterestService.getAnalytics(
      accountId,
      formatDate(start),
      formatDate(end)
    );

    if (format === 'csv') {
      // Generate CSV
      const csvHeader = 'Date,Impressions,Saves,Clicks,Repins,Comments,Followers\n';
      const csvData = analytics
        .map((a) => `${formatDate(a.date)},${a.impressions},${a.saves},${a.clicks},${a.repins},${a.comments},${a.followers}`)
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${formatDate(start)}-${formatDate(end)}.csv`);
      res.send(csvHeader + csvData);
    } else {
      res.json({
        success: true,
        data: analytics,
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;