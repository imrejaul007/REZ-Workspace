import { Router, Request, Response } from 'express';
import { UnifiedAccount, LoyaltyTransactionModel } from '../models';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Get account summary
 * GET /api/v1/analytics/:accountId/summary
 */
router.get('/:accountId/summary',
  asyncHandler(async (req: Request, res: Response) => {
    const { accountId } = req.params;

    const account = await UnifiedAccount.findOne({ accountId });
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    // Get transaction summary
    const transactionSummary = await LoyaltyTransactionModel.aggregate([
      { $match: { accountId } },
      {
        $group: {
          _id: '$type',
          totalPoints: { $sum: '$points' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get top verticals
    const topVerticals = await LoyaltyTransactionModel.aggregate([
      { $match: { accountId, type: 'earn' } },
      {
        $group: {
          _id: '$vertical',
          totalEarned: { $sum: '$points' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalEarned: -1 } },
      { $limit: 5 }
    ]);

    // Calculate summary
    const summary = {
      accountId,
      totalPoints: account.totalPoints,
      tier: account.tier,
      verticalsCount: account.verticals.length,
      totalTransactions: transactionSummary.reduce((sum: number, t: any) => sum + t.count, 0),
      totalEarned: Math.abs(
        transactionSummary.find((t: any) => t._id === 'earn')?.totalPoints || 0
      ),
      totalRedeemed: Math.abs(
        transactionSummary.find((t: any) => t._id === 'redeem')?.totalPoints || 0
      ),
      topVertical: topVerticals[0]?._id || 'N/A',
      averagePointsPerTransaction:
        transactionSummary.reduce((sum: number, t: any) => sum + t.count, 0) > 0
          ? Math.round(
              account.totalPoints /
                transactionSummary.reduce((sum: number, t: any) => sum + t.count, 0)
            )
          : 0
    };

    res.json({
      success: true,
      data: {
        summary,
        topVerticals,
        transactionBreakdown: transactionSummary.reduce((acc: any, t: any) => {
          acc[t._id] = {
            count: t.count,
            points: Math.abs(t.totalPoints)
          };
          return acc;
        }, {})
      }
    });
  })
);

/**
 * Get merchant loyalty performance
 * GET /api/v1/analytics/merchant/:merchantId/performance
 */
router.get('/merchant/:merchantId/performance',
  asyncHandler(async (req: Request, res: Response) => {
    const { merchantId } = req.params;
    const period = req.query.period as string || '30d';

    // Calculate date range based on period
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Get transaction stats for merchant
    const transactionStats = await LoyaltyTransactionModel.aggregate([
      {
        $match: {
          merchantId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$type',
          totalPoints: { $sum: '$points' },
          count: { $sum: 1 },
          avgPoints: { $avg: '$points' }
        }
      }
    ]);

    // Get unique accounts for this merchant
    const uniqueAccounts = await LoyaltyTransactionModel.distinct('accountId', {
      merchantId,
      createdAt: { $gte: startDate }
    });

    // Get vertical breakdown
    const verticalBreakdown = await LoyaltyTransactionModel.aggregate([
      {
        $match: {
          merchantId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$vertical',
          totalPoints: { $sum: '$points' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalPoints: -1 } }
    ]);

    // Get daily trend
    const dailyTrend = await LoyaltyTransactionModel.aggregate([
      {
        $match: {
          merchantId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          earned: {
            $sum: {
              $cond: [{ $eq: ['$type', 'earn'] }, '$points', 0]
            }
          },
          redeemed: {
            $sum: {
              $cond: [{ $eq: ['$type', 'redeem'] }, { $abs: '$points' }, 0]
            }
          },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const earnedPoints = Math.abs(
      transactionStats.find((t: any) => t._id === 'earn')?.totalPoints || 0
    );
    const redeemedPoints = Math.abs(
      transactionStats.find((t: any) => t._id === 'redeem')?.totalPoints || 0
    );

    const performance = {
      merchantId,
      period,
      totalAccounts: uniqueAccounts.length,
      totalPointsIssued: earnedPoints,
      totalPointsRedeemed: redeemedPoints,
      averagePointsPerTransaction:
        transactionStats.reduce((sum: number, t: any) => sum + t.count, 0) > 0
          ? Math.round(
              earnedPoints /
                transactionStats.reduce((sum: number, t: any) => sum + t.count, 0)
            )
          : 0,
      redemptionRate:
        earnedPoints > 0 ? ((redeemedPoints / earnedPoints) * 100).toFixed(2) : '0.00',
      totalTransactions: transactionStats.reduce((sum: number, t: any) => sum + t.count, 0)
    };

    res.json({
      success: true,
      data: {
        performance,
        verticalBreakdown,
        dailyTrend
      }
    });
  })
);

/**
 * Get leaderboard
 * GET /api/v1/analytics/leaderboard
 */
router.get('/leaderboard',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const tier = req.query.tier as string;
    const vertical = req.query.vertical as string;

    const query: any = {};

    if (tier) {
      query.tier = tier;
    }

    if (vertical) {
      query['verticals.vertical'] = vertical;
    }

    const leaderboard = await UnifiedAccount.find(query)
      .select('accountId userId phone totalPoints tier verticals lastActivity')
      .sort({ totalPoints: -1 })
      .limit(limit);

    // Add rank to each entry
    const rankedLeaderboard = leaderboard.map((account: any, index: number) => ({
      rank: index + 1,
      accountId: account.accountId,
      phone: account.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'), // Mask phone
      totalPoints: account.totalPoints,
      tier: account.tier,
      topVertical: account.verticals[0]?.vertical || 'N/A',
      lastActivity: account.updatedAt
    }));

    res.json({
      success: true,
      data: {
        leaderboard: rankedLeaderboard,
        count: rankedLeaderboard.length,
        filters: { tier, vertical }
      }
    });
  })
);

/**
 * Get tier distribution
 * GET /api/v1/analytics/tier-distribution
 */
router.get('/tier-distribution',
  asyncHandler(async (req: Request, res: Response) => {
    const distribution = await UnifiedAccount.aggregate([
      {
        $group: {
          _id: '$tier',
          count: { $sum: 1 },
          totalPoints: { $sum: '$totalPoints' },
          avgPoints: { $avg: '$totalPoints' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totalAccounts = distribution.reduce((sum: number, d: any) => sum + d.count, 0);

    res.json({
      success: true,
      data: {
        distribution: distribution.map((d: any) => ({
          tier: d._id,
          count: d.count,
          percentage: ((d.count / totalAccounts) * 100).toFixed(2),
          totalPoints: d.totalPoints,
          avgPoints: Math.round(d.avgPoints)
        })),
        totalAccounts
      }
    });
  })
);

/**
 * Get vertical analytics
 * GET /api/v1/analytics/verticals
 */
router.get('/verticals',
  asyncHandler(async (req: Request, res: Response) => {
    const vertical = req.query.vertical as string;

    const matchStage: any = {};
    if (vertical) {
      matchStage.vertical = vertical;
    }

    const verticalStats = await LoyaltyTransactionModel.aggregate([
      { $match: { ...matchStage, type: 'earn' } },
      {
        $group: {
          _id: '$vertical',
          totalEarned: { $sum: '$points' },
          transactionCount: { $sum: 1 },
          uniqueAccounts: { $addToSet: '$accountId' },
          uniqueMerchants: { $addToSet: '$merchantId' }
        }
      },
      {
        $project: {
          vertical: '$_id',
          totalEarned: 1,
          transactionCount: 1,
          uniqueAccounts: { $size: '$uniqueAccounts' },
          uniqueMerchants: { $size: '$uniqueMerchants' },
          avgPerTransaction: { $round: [{ $divide: ['$totalEarned', '$transactionCount'] }, 2] }
        }
      },
      { $sort: { totalEarned: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        verticals: verticalStats,
        count: verticalStats.length
      }
    });
  })
);

/**
 * Get real-time metrics
 * GET /api/v1/analytics/metrics
 */
router.get('/metrics',
  asyncHandler(async (req: Request, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Today's stats
    const todayStats = await LoyaltyTransactionModel.aggregate([
      { $match: { createdAt: { $gte: today } } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          points: { $sum: '$points' }
        }
      }
    ]);

    // Yesterday's stats for comparison
    const yesterdayStats = await LoyaltyTransactionModel.aggregate([
      { $match: { createdAt: { $gte: yesterday, $lt: today } } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          points: { $sum: '$points' }
        }
      }
    ]);

    // Total stats
    const totalStats = await UnifiedAccount.aggregate([
      {
        $group: {
          _id: null,
          totalAccounts: { $sum: 1 },
          totalPoints: { $sum: '$totalPoints' },
          avgPointsPerAccount: { $avg: '$totalPoints' }
        }
      }
    ]);

    const getStat = (stats: any[], type: string) => stats.find((s: any) => s._id === type) || { count: 0, points: 0 };

    const todayEarn = getStat(todayStats, 'earn');
    const todayRedeem = getStat(todayStats, 'redeem');
    const yesterdayEarn = getStat(yesterdayStats, 'earn');

    res.json({
      success: true,
      data: {
        today: {
          earnedPoints: todayEarn.points,
          redeemedPoints: Math.abs(todayRedeem.points),
          transactions: todayEarn.count + todayRedeem.count
        },
        comparison: {
          earnedChange: yesterdayEarn.count > 0
            ? (((todayEarn.count - yesterdayEarn.count) / yesterdayEarn.count) * 100).toFixed(2)
            : 'N/A'
        },
        total: totalStats[0] || {
          totalAccounts: 0,
          totalPoints: 0,
          avgPointsPerAccount: 0
        },
        timestamp: new Date()
      }
    });
  })
);

export default router;