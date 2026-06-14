import { Router, Response } from 'express';
import { z } from 'zod';
import { growthService } from '../services/index.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Validation schemas
const milestoneSchema = z.object({
  milestone: z.number().positive().multipleOf(1000),
});

const compareSchema = z.object({
  competitorIds: z.array(z.string()).min(1).max(10),
});

const snapshotQuerySchema = z.object({
  days: z.coerce.number().min(1).max(365).optional().default(30),
});

const periodQuerySchema = z.object({
  periods: z.coerce.number().min(1).max(52).optional().default(12),
});

// GET /api/growth/:accountId - Get overall growth data
router.get('/:accountId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { accountId } = req.params;
    const { days } = snapshotQuerySchema.parse(req.query);

    const growthData = await growthService.getGrowthData(accountId, days);

    res.json({
      success: true,
      data: growthData,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.errors,
      });
    }
    logger.error('Failed to get growth data', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get growth data',
    });
  }
});

// GET /api/growth/:accountId/daily - Daily snapshots
router.get('/:accountId/daily', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { accountId } = req.params;
    const { days } = snapshotQuerySchema.parse(req.query);

    const snapshots = await growthService.getDailySnapshots(accountId, days);

    res.json({
      success: true,
      data: snapshots,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.errors,
      });
    }
    logger.error('Failed to get daily snapshots', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get daily snapshots',
    });
  }
});

// GET /api/growth/:accountId/weekly - Weekly summary
router.get('/:accountId/weekly', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { accountId } = req.params;
    const { periods } = periodQuerySchema.parse(req.query);

    const summary = await growthService.getWeeklySummary(accountId, periods);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.errors,
      });
    }
    logger.error('Failed to get weekly summary', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get weekly summary',
    });
  }
});

// GET /api/growth/:accountId/monthly - Monthly summary
router.get('/:accountId/monthly', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { accountId } = req.params;
    const { periods } = periodQuerySchema.parse(req.query);

    const summary = await growthService.getMonthlySummary(accountId, periods);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.errors,
      });
    }
    logger.error('Failed to get monthly summary', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get monthly summary',
    });
  }
});

// GET /api/growth/:accountId/analytics - Deep analysis
router.get('/:accountId/analytics', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { accountId } = req.params;

    const analytics = await growthService.getAnalytics(accountId);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error('Failed to get analytics', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics',
    });
  }
});

// GET /api/growth/:accountId/predictions - Growth predictions
router.get('/:accountId/predictions', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { accountId } = req.params;

    const predictions = await growthService.getPredictions(accountId);

    res.json({
      success: true,
      data: predictions,
    });
  } catch (error) {
    logger.error('Failed to get predictions', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get predictions',
    });
  }
});

// GET /api/growth/:accountId/compare - Competitor comparison
router.get('/:accountId/compare', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { accountId } = req.params;
    const { competitorIds } = compareSchema.parse(req.query);

    const comparison = await growthService.compareWithCompetitors(accountId, competitorIds);

    res.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.errors,
      });
    }
    logger.error('Failed to compare with competitors', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to compare with competitors',
    });
  }
});

// POST /api/growth/:accountId/alerts - Set milestone alerts
router.post('/:accountId/alerts', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { accountId } = req.params;
    const { milestone } = milestoneSchema.parse(req.body);

    const alert = await growthService.setMilestoneAlert(accountId, milestone);

    res.status(201).json({
      success: true,
      data: alert,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.errors,
      });
    }
    logger.error('Failed to set milestone alert', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to set milestone alert',
    });
  }
});

// GET /api/growth/:accountId/alerts - Get milestone alerts
router.get('/:accountId/alerts', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { accountId } = req.params;

    const alerts = await growthService.getMilestoneAlerts(accountId);

    res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    logger.error('Failed to get milestone alerts', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get milestone alerts',
    });
  }
});

// GET /api/growth/:accountId/sources - Follower source breakdown
router.get('/:accountId/sources', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { accountId } = req.params;

    const sources = await growthService.getSourceBreakdown(accountId);

    res.json({
      success: true,
      data: sources,
    });
  } catch (error) {
    logger.error('Failed to get source breakdown', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get source breakdown',
    });
  }
});

// GET /api/growth/:accountId/engagement - Engagement correlation
router.get('/:accountId/engagement', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { accountId } = req.params;

    const engagement = await growthService.getEngagementCorrelation(accountId);

    res.json({
      success: true,
      data: engagement,
    });
  } catch (error) {
    logger.error('Failed to get engagement correlation', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get engagement correlation',
    });
  }
});

// GET /api/growth/:accountId/churn - Unfollow tracking
router.get('/:accountId/churn', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { accountId } = req.params;

    const churn = await growthService.getChurnAnalysis(accountId);

    res.json({
      success: true,
      data: churn,
    });
  } catch (error) {
    logger.error('Failed to get churn analysis', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get churn analysis',
    });
  }
});

export default router;