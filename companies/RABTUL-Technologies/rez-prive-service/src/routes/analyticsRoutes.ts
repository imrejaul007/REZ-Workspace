/**
 * Analytics Routes
 * API endpoints for Prive analytics
 */

import { Router, Response } from 'express';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { logger } from '../config/logger';
import { PriveTransaction, PriveUser } from '../models';

const router = Router();

/**
 * GET /api/analytics/dashboard
 * Get analytics dashboard data
 */
router.get('/dashboard', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Get current date ranges
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Fetch analytics from database
    const [totalResult, thisMonthResult, lastMonthResult] = await Promise.all([
      PriveTransaction.aggregate([
        { $match: { userId, type: 'earning' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      PriveTransaction.aggregate([
        { $match: { userId, type: 'earning', createdAt: { $gte: startOfThisMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      PriveTransaction.aggregate([
        { $match: { userId, type: 'earning', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const totalEarnings = totalResult[0]?.total || 0;
    const thisMonth = thisMonthResult[0]?.total || 0;
    const lastMonth = lastMonthResult[0]?.total || 0;

    // Calculate month-over-month change
    const change = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    const dashboard = {
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      thisMonth: Math.round(thisMonth * 100) / 100,
      lastMonth: Math.round(lastMonth * 100) / 100,
      change: Math.round(change * 100) / 100,
    };

    logger.info('[Analytics] Dashboard data fetched', { userId, dashboard });
    res.json({ success: true, data: dashboard });
  } catch (error) {
    logger.error('Failed to get analytics', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'Failed to get analytics' });
  }
});

/**
 * GET /api/analytics/by-tier
 * Get statistics by Prive tier
 */
router.get('/by-tier', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Fetch tier statistics from database
    const tierStats = await PriveTransaction.aggregate([
      { $match: { userId } },
      {
        $lookup: {
          from: 'prive_users',
          localField: 'userId',
          foreignField: 'userId',
          as: 'priveUser',
        },
      },
      { $unwind: { path: '$priveUser', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$priveUser.tier', 'entry'] },
          count: { $sum: 1 },
          earnings: { $sum: { $cond: [{ $eq: ['$type', 'earning'] }, '$amount', 0] } },
        },
      },
    ]);

    // Format results into expected structure
    const byTier: Record<string, { count: number; earnings: number }> = {
      entry: { count: 0, earnings: 0 },
      signature: { count: 0, earnings: 0 },
      elite: { count: 0, earnings: 0 },
    };

    for (const stat of tierStats) {
      const tierKey = String(stat._id).toLowerCase();
      if (tierKey in byTier) {
        byTier[tierKey] = {
          count: stat.count,
          earnings: Math.round(stat.earnings * 100) / 100,
        };
      }
    }

    logger.info('[Analytics] Tier statistics fetched', { userId, byTier });
    res.json({ success: true, data: byTier });
  } catch (error) {
    logger.error('Failed to get tier analytics', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'Failed to get analytics' });
  }
});

export default router;
