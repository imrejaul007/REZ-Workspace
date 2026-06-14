/**
 * Dashboard Routes - API endpoints for dashboard statistics
 */

import { Router, Request, Response } from 'express';
import { dashboardService } from '../services/DashboardService';
import { standardLimiter } from '../middleware/rateLimiter';
import { logger } from '../config/logger';

const router = Router();

/**
 * GET /api/dashboard
 * Get main dashboard statistics
 */
router.get('/', standardLimiter, async (_req: Request, res: Response) => {
  try {
    const stats = await dashboardService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error getting dashboard stats', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get dashboard statistics' });
  }
});

/**
 * GET /api/dashboard/service-requests
 * Get service request statistics
 */
router.get('/service-requests', standardLimiter, async (_req: Request, res: Response) => {
  try {
    const stats = await dashboardService.getServiceRequestStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error getting service request stats', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get service request statistics' });
  }
});

/**
 * GET /api/dashboard/bookings
 * Get booking statistics
 */
router.get('/bookings', standardLimiter, async (_req: Request, res: Response) => {
  try {
    const stats = await dashboardService.getBookingStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error getting booking stats', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get booking statistics' });
  }
});

/**
 * GET /api/dashboard/activity
 * Get recent activity
 */
router.get('/activity', standardLimiter, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const activity = await dashboardService.getRecentActivity(limit);
    res.json({ success: true, data: activity });
  } catch (error) {
    logger.error('Error getting recent activity', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get recent activity' });
  }
});

export default router;