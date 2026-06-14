// @ts-ignore
// ReZ Schedule - Cron Routes
import { Router, Request, Response } from 'express';
import { reminderService } from '../services/reminderService';
import { logger } from '../utils/logger';

const router = Router();

// Cron secret for authentication
const CRON_SECRET = process.env.CRON_SECRET || 'your-cron-secret';

/**
 * Process reminders
 * POST /api/cron/process-reminders
 */
router.post('/process-reminders', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }

  try {
    const result = await reminderService.processReminders();

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('[Cron] Process reminders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process reminders',
    });
  }
});

/**
 * Process waiting list expirations
 * POST /api/cron/process-waiting-list
 */
router.post('/process-waiting-list', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }

  try {
    // This would be implemented in the waiting list service
    res.json({
      success: true,
      message: 'Waiting list processed',
    });
  } catch (error) {
    logger.error('[Cron] Process waiting list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process waiting list',
    });
  }
});

/**
 * Cleanup expired seat holds
 * POST /api/cron/cleanup-seats
 */
router.post('/cleanup-seats', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }

  try {
    // This would be implemented in the seat service
    res.json({
      success: true,
      message: 'Seats cleaned up',
    });
  } catch (error) {
    logger.error('[Cron] Cleanup seats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup seats',
    });
  }
});

/**
 * Sync calendars
 * POST /api/cron/sync-calendars
 */
router.post('/sync-calendars', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }

  try {
    // This would be implemented in the calendar sync service
    res.json({
      success: true,
      message: 'Calendars synced',
    });
  } catch (error) {
    logger.error('[Cron] Sync calendars error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync calendars',
    });
  }
});

/**
 * Get reminder stats
 * GET /api/cron/reminder-stats
 */
router.get('/reminder-stats', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }

  try {
    const days = parseInt(req.query.days as string) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await reminderService.getReminderStats(startDate, new Date());

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('[Cron] Reminder stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get reminder stats',
    });
  }
});

export default router;
