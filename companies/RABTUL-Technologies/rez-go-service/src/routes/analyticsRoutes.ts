/**
 * REZ Go Analytics Routes
 */

import { Router, Request, Response } from 'express';
import {
  trackEvent,
  getSessionMetrics,
  getStoreMetrics,
  getMerchantMetrics,
  getDashboardData,
} from '../services/analyticsService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/analytics/event
 * Track an analytics event
 */
router.post('/event', authMiddleware, async (req: Request, res: Response) => {
  try {
    const event = req.body;
    await trackEvent({
      ...event,
      timestamp: new Date(),
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Analytics event error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

/**
 * GET /api/analytics/dashboard/:storeId
 * Get real-time dashboard data
 */
router.get('/dashboard/:storeId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const data = await getDashboardData(storeId);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

/**
 * GET /api/analytics/store/:storeId
 * Get store metrics
 */
router.get('/store/:storeId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const { startDate, endDate } = req.query;

    const metrics = await getStoreMetrics(
      storeId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    res.json({ success: true, metrics });
  } catch (error) {
    console.error('Store metrics error:', error);
    res.status(500).json({ error: 'Failed to get store metrics' });
  }
});

/**
 * GET /api/analytics/merchant/:merchantId
 * Get merchant metrics
 */
router.get('/merchant/:merchantId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const { startDate, endDate } = req.query;

    const metrics = await getMerchantMetrics(
      merchantId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    res.json({ success: true, metrics });
  } catch (error) {
    console.error('Merchant metrics error:', error);
    res.status(500).json({ error: 'Failed to get merchant metrics' });
  }
});

export default router;
