/**
 * Savings Admin Routes
 *
 * Admin endpoints for savings analytics and reporting.
 * Requires admin authentication.
 */

import { Router, Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import {
  SavingsEntry,
  SavingsGoal,
  SavingsStreak,
  SavingsInsight,
  SavingsProjection,
  UserSavingsSummary,
  ISavingsStreak,
} from '../models/Savings';
import { requireAdminToken } from '../middleware/adminAuth';
import { logger } from '../config/logger';

const router = Router();

// ─── Helper: Parse date range ──────────────────────────────────────────────────

function parseDateRange(query: Record<string, unknown>) {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;

  if (query.period === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (query.period === 'week') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (query.period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (query.period === 'quarter') {
    const quarter = Math.floor(now.getMonth() / 3);
    startDate = new Date(now.getFullYear(), quarter * 3, 1);
  } else if (query.period === 'year') {
    startDate = new Date(now.getFullYear(), 0, 1);
  } else if (query.startDate && query.endDate) {
    startDate = new Date(query.startDate as string);
    endDate = new Date(query.endDate as string);
  } else {
    // Default: last 30 days
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return { startDate, endDate };
}

// ─── Overview Stats ────────────────────────────────────────────────────────────

/**
 * GET /api/admin/savings/overview
 * Get overall savings statistics
 */
router.get('/overview', requireAdminToken, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = parseDateRange(req.query as Record<string, unknown>);

    // Total users with savings
    const totalUsers = await SavingsEntry.distinct('userId').countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    // Total savings amount
    const totalSavings = await SavingsEntry.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    // Savings by type
    const byType = await SavingsEntry.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    // Top savers
    const topSavers = await UserSavingsSummary.find()
      .sort({ totalSavings: -1 })
      .limit(10)
      .lean();

    // Average savings per user
    const avgSavingsPerUser = totalUsers > 0
      ? (totalSavings[0]?.total || 0) / totalUsers
      : 0;

    // Active streaks
    const activeStreaks = await SavingsStreak.countDocuments({
      streakActive: true,
      currentStreak: { $gte: 7 },
    });

    // Goals stats
    const totalGoals = await SavingsGoal.countDocuments();
    const completedGoals = await SavingsGoal.countDocuments({ isCompleted: true });
    const activeGoals = totalGoals - completedGoals;

    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        totalUsers,
        totalSavings: totalSavings[0]?.total || 0,
        totalTransactions: totalSavings[0]?.count || 0,
        avgSavingsPerUser: Math.round(avgSavingsPerUser),
        activeStreaks: activeStreaks,
        goals: {
          total: totalGoals,
          active: activeGoals,
          completed: completedGoals,
          completionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
        },
        byType: byType.reduce((acc, item) => {
          acc[item._id] = { total: item.total, count: item.count };
          return acc;
        }, {} as Record<string, unknown>),
        topSavers: topSavers.slice(0, 5).map((user) => ({
          userId: user.userId,
          totalSavings: user.totalSavings,
          streak: user.totalSavingsAmount,
        })),
      },
    });
  } catch (error) {
    logger.error('Admin savings overview error', { error });
    res.status(500).json({ success: false, message: 'Failed to get overview' });
  }
});

// ─── Daily Trends ───────────────────────────────────────────────────────────────

/**
 * GET /api/admin/savings/trends
 * Get daily savings trends
 */
router.get('/trends', requireAdminToken, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = parseDateRange(req.query as Record<string, unknown>);

    const dailyTrends = await SavingsEntry.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
        },
      },
      {
        $project: {
          date: '$_id',
          totalAmount: 1,
          transactionCount: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
        },
      },
      { $sort: { date: 1 } },
    ]);

    res.json({ success: true, data: dailyTrends });
  } catch (error) {
    logger.error('Admin savings trends error', { error });
    res.status(500).json({ success: false, message: 'Failed to get trends' });
  }
});

// ─── Category Breakdown ──────────────────────────────────────────────────────────

/**
 * GET /api/admin/savings/categories
 * Get savings by category
 */
router.get('/categories', requireAdminToken, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = parseDateRange(req.query as Record<string, unknown>);

    const categories = await SavingsEntry.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, category: { $exists: true } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    // Category growth (this period vs last)
    const periodLength = endDate.getTime() - startDate.getTime();
    const lastPeriodStart = new Date(startDate.getTime() - periodLength);
    const lastPeriodEnd = new Date(startDate.getTime());

    const lastPeriodCategories = await SavingsEntry.aggregate([
      { $match: { createdAt: { $gte: lastPeriodStart, $lte: lastPeriodEnd }, category: { $exists: true } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]);

    const lastPeriodMap = lastPeriodCategories.reduce((acc, item) => {
      acc[item._id] = item.total;
      return acc;
    }, {} as Record<string, number>);

    const growthData = categories.map((cat) => {
      const lastPeriodTotal = lastPeriodMap[cat._id] || 0;
      const growth = lastPeriodTotal > 0
        ? Math.round(((cat.total - lastPeriodTotal) / lastPeriodTotal) * 100)
        : 100;
      return {
        category: cat._id,
        total: cat.total,
        count: cat.count,
        growth,
      };
    });

    res.json({ success: true, data: growthData });
  } catch (error) {
    logger.error('Admin savings categories error', { error });
    res.status(500).json({ success: false, message: 'Failed to get categories' });
  }
});

// ─── Streak Analytics ──────────────────────────────────────────────────────────

/**
 * GET /api/admin/savings/streaks
 * Get streak analytics
 */
router.get('/streaks', requireAdminToken, async (req: Request, res: Response) => {
  try {
    const streaks = await SavingsStreak.find().lean() as unknown as Array<ISavingsStreak & { streakActive: boolean }>;

    // Distribution
    const distribution = {
      '1-7': 0,   // 1-7 days
      '8-14': 0,  // 8-14 days
      '15-30': 0, // 15-30 days
      '31-60': 0, // 31-60 days
      '60+': 0,   // 60+ days
    };

    for (const streak of streaks) {
      if (streak.currentStreak <= 7) distribution['1-7']++;
      else if (streak.currentStreak <= 14) distribution['8-14']++;
      else if (streak.currentStreak <= 30) distribution['15-30']++;
      else if (streak.currentStreak <= 60) distribution['31-60']++;
      else distribution['60+']++;
    }

    // Top streaks
    const topStreaks = await SavingsStreak.find()
      .sort({ currentStreak: -1 })
      .limit(10)
      .lean() as unknown as Array<ISavingsStreak & { streakActive: boolean }>;

    // Stats
    const avgStreak = streaks.length > 0
      ? Math.round(streaks.reduce((sum, s) => sum + s.currentStreak, 0) / streaks.length)
      : 0;
    const maxStreak = streaks.length > 0
      ? Math.max(...streaks.map((s) => s.currentStreak))
      : 0;
    const activeStreakCount = streaks.filter((s) => s.streakActive).length;

    res.json({
      success: true,
      data: {
        distribution,
        topStreaks: topStreaks.map((s) => ({
          userId: s.userId,
          currentStreak: s.currentStreak,
          longestStreak: s.longestStreak,
          totalStreakDays: s.totalStreakDays,
          streakActive: s.streakActive,
        })),
        stats: {
          totalStreakUsers: streaks.length,
          activeStreakCount,
          avgStreak,
          maxStreak,
        },
      },
    });
  } catch (error) {
    logger.error('Admin streak analytics error', { error });
    res.status(500).json({ success: false, message: 'Failed to get streak analytics' });
  }
});

// ─── User Savings Details ─────────────────────────────────────────────────────

/**
 * GET /api/admin/savings/users/:userId
 * Get detailed savings info for a user
 */
router.get('/users/:userId', requireAdminToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const [summary, goals, streak, recentEntries] = await Promise.all([
      UserSavingsSummary.findOne({ userId }).lean(),
      SavingsGoal.find({ userId }).lean(),
      SavingsStreak.findOne({ userId }).lean(),
      SavingsEntry.find({ userId }).sort({ createdAt: -1 }).limit(50).lean(),
    ]);

    // Calculate projections
    const projections = await SavingsProjection.findOne({ userId }).lean();

    // Calculate savings rate
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentTotal = recentEntries
      .filter((e) => new Date(e.createdAt) >= thirtyDaysAgo)
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    res.json({
      success: true,
      data: {
        userId,
        summary,
        goals,
        streak,
        recentEntries: recentEntries.slice(0, 20),
        projections,
        savingsRate30Days: recentTotal,
      },
    });
  } catch (error) {
    logger.error('Admin user savings error', { error, userId: req.params.userId });
    res.status(500).json({ success: false, message: 'Failed to get user savings' });
  }
});

// ─── Export Report ─────────────────────────────────────────────────────────────

/**
 * GET /api/admin/savings/export
 * Export savings data as CSV
 */
router.get('/export', requireAdminToken, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = parseDateRange(req.query as Record<string, unknown>);
    const format = req.query.format || 'csv';

    const entries = await SavingsEntry.find({
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: -1 })
      .lean();

    if (format === 'json') {
      res.json({ success: true, data: entries });
      return;
    }

    // CSV export
    const headers = ['entryId', 'userId', 'type', 'amount', 'source', 'description', 'category', 'createdAt'];
    const csvRows = [headers.join(',')];

    for (const entry of entries) {
      const row = [
        entry.entryId,
        entry.userId,
        entry.type,
        entry.amount,
        entry.source,
        `"${(entry.description || '').replace(/"/g, '""')}"`,
        entry.category || '',
        entry.createdAt.toISOString(),
      ];
      csvRows.push(row.join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=savings_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.csv`);
    res.send(csvRows.join('\n'));
  } catch (error) {
    logger.error('Admin savings export error', { error });
    res.status(500).json({ success: false, message: 'Failed to export data' });
  }
});

export default router;
