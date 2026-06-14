import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { sessionService } from '../services/sessionService.js';
import { GoStore } from '../models/GoStore.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/merchants/:merchantId/live-sessions
 * Get live sessions for merchant
 */
router.get('/:merchantId/live-sessions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;

    const result = await sessionService.getSessions({
      merchantId,
      status: 'active',
    });

    res.json({
      success: true,
      sessions: result.sessions,
      count: result.total,
    });
  } catch (error) {
    console.error('Get live sessions error:', error);
    res.status(500).json({ error: 'Failed to get live sessions' });
  }
});

/**
 * GET /api/merchants/:merchantId/analytics
 * Get merchant analytics
 */
router.get('/:merchantId/analytics', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const days = parseInt(req.query.days as string) || 7;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get completed sessions
    const result = await sessionService.getSessions({
      merchantId,
      status: 'completed',
      startDate,
      limit: 1000,
    });

    const sessions = result.sessions;

    // Calculate analytics
    const totalRevenue = sessions.reduce((sum, s) => sum + s.total, 0);
    const totalOrders = sessions.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalCashback = sessions.reduce((sum, s) => sum + s.cashbackEarned, 0);
    const totalSavings = sessions.reduce((sum, s) => sum + s.savings.totalSaved, 0);

    // Fraud stats
    const fraudSessions = sessions.filter((s) => s.fraudScore >= 50);
    const fraudRate = totalOrders > 0 ? (fraudSessions.length / totalOrders) * 100 : 0;

    // Sessions by day
    const sessionsByDay: Record<string, number> = {};
    const revenueByDay: Record<string, number> = {};

    for (const session of sessions) {
      const day = session.completedAt?.toISOString().split('T')[0] || 'unknown';
      sessionsByDay[day] = (sessionsByDay[day] || 0) + 1;
      revenueByDay[day] = (revenueByDay[day] || 0) + session.total;
    }

    res.json({
      success: true,
      analytics: {
        period: {
          days,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
        },
        summary: {
          totalRevenue,
          totalOrders,
          avgOrderValue: Math.round(avgOrderValue),
          totalCashback,
          totalSavings: Math.round(totalSavings),
          fraudRate: Math.round(fraudRate * 100) / 100,
        },
        byDay: {
          sessions: sessionsByDay,
          revenue: revenueByDay,
        },
      },
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

/**
 * GET /api/merchants/:merchantId/stores
 * Get merchant's stores
 */
router.get('/:merchantId/stores', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;

    const stores = await GoStore.find({
      merchantId,
      goEnabled: true,
    }).select('-cashback.rules -metadata');

    res.json({
      success: true,
      stores,
      count: stores.length,
    });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ error: 'Failed to get stores' });
  }
});

/**
 * GET /api/merchants/:merchantId/dashboard
 * Get merchant dashboard summary
 */
router.get('/:merchantId/dashboard', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;

    // Get store count
    const storeCount = await GoStore.countDocuments({
      merchantId,
      goEnabled: true,
    });

    // Get live sessions count
    const liveSessions = await sessionService.getSessions({
      merchantId,
      status: 'active',
      limit: 1,
    });

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySessions = await sessionService.getSessions({
      merchantId,
      status: 'completed',
      startDate: today,
      limit: 1000,
    });

    const todayRevenue = todaySessions.sessions.reduce((sum, s) => sum + s.total, 0);
    const todayOrders = todaySessions.sessions.length;

    res.json({
      success: true,
      dashboard: {
        storeCount,
        liveShoppers: liveSessions.total,
        todayOrders,
        todayRevenue,
        todayCashback: todaySessions.sessions.reduce((sum, s) => sum + s.cashbackEarned, 0),
      },
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard' });
  }
});

export default router;
