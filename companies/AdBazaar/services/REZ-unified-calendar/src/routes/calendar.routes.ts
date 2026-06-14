import { Router, Request, Response } from 'express';
import { calendarService } from '../services/calendar.service';
import { CalendarFiltersSchema, PlatformPostSchema } from '../types';
import { ZodError } from 'zod';
import { apiLogger as logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/calendar/view
 * Get calendar view with filtered events
 */
router.get('/view', async (req: Request, res: Response) => {
  try {
    const filters = {
      platforms: req.query.platforms
        ? (req.query.platforms as string).split(',') as CalendarFiltersSchema._type['platforms']
        : undefined,
      statuses: req.query.statuses
        ? (req.query.statuses as string).split(',') as CalendarFiltersSchema._type['statuses']
        : undefined,
      dateRange: req.query.start && req.query.end
        ? {
            start: new Date(req.query.start as string),
            end: new Date(req.query.end as string),
          }
        : undefined,
      searchQuery: req.query.search as string | undefined,
      userId: req.query.userId as string | undefined,
    };

    const calendarView = await calendarService.getCalendarView(filters);

    res.json({
      success: true,
      data: calendarView,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to get calendar view', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get calendar view',
      timestamp: new Date(),
    });
  }
});

/**
 * GET /api/calendar/events
 * Get events for a specific date range (alternative endpoint)
 */
router.get('/events', async (req: Request, res: Response) => {
  try {
    const start = req.query.start as string;
    const end = req.query.end as string;

    if (!start || !end) {
      res.status(400).json({
        success: false,
        error: 'Start and end dates are required',
        timestamp: new Date(),
      });
      return;
    }

    const filters = {
      dateRange: {
        start: new Date(start),
        end: new Date(end),
      },
    };

    const calendarView = await calendarService.getCalendarView(filters);

    res.json({
      success: true,
      data: calendarView.events,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to get events', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get events',
      timestamp: new Date(),
    });
  }
});

/**
 * GET /api/calendar/analytics
 * Get calendar analytics
 */
router.get('/analytics', async (_req: Request, res: Response) => {
  try {
    const analytics = await calendarService.getAnalytics();

    res.json({
      success: true,
      data: analytics,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to get analytics', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics',
      timestamp: new Date(),
    });
  }
});

/**
 * POST /api/calendar/sync
 * Force sync all platforms
 */
router.post('/sync', async (_req: Request, res: Response) => {
  try {
    logger.info('Manual sync triggered');
    await calendarService.syncAllPlatforms();

    res.json({
      success: true,
      message: 'Sync completed',
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to sync platforms', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to sync platforms',
      timestamp: new Date(),
    });
  }
});

/**
 * GET /api/calendar/settings/:userId
 * Get user calendar settings
 */
router.get('/settings/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const settings = await calendarService.getUserSettings(userId);

    res.json({
      success: true,
      data: settings,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to get user settings', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get user settings',
      timestamp: new Date(),
    });
  }
});

/**
 * PUT /api/calendar/settings/:userId
 * Update user calendar settings
 */
router.put('/settings/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const settings = req.body;

    await calendarService.updateUserSettings(userId, settings);
    const updatedSettings = await calendarService.getUserSettings(userId);

    res.json({
      success: true,
      data: updatedSettings,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to update user settings', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update user settings',
      timestamp: new Date(),
    });
  }
});

/**
 * POST /api/calendar/bulk
 * Perform bulk operations
 */
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const { ids, action, newValues } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({
        success: false,
        error: 'IDs array is required',
        timestamp: new Date(),
      });
      return;
    }

    if (!action || !['publish', 'delete', 'reschedule', 'change_status'].includes(action)) {
      res.status(400).json({
        success: false,
        error: 'Valid action is required (publish, delete, reschedule, change_status)',
        timestamp: new Date(),
      });
      return;
    }

    const result = await calendarService.performBulkOperation({
      ids,
      action,
      newValues,
    });

    res.json({
      success: true,
      data: result,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Bulk operation failed', { error });
    res.status(500).json({
      success: false,
      error: 'Bulk operation failed',
      timestamp: new Date(),
    });
  }
});

/**
 * GET /api/calendar/platforms/status
 * Check status of all platform connections
 */
router.get('/platforms/status', async (_req: Request, res: Response) => {
  try {
    const { platformConnectorService } = await import('../services/platform-connector.service');
    const healthStatus = await platformConnectorService.checkAllPlatformHealth();

    const status: Record<string, { healthy: boolean; lastChecked: string }> = {};
    healthStatus.forEach((healthy, platform) => {
      status[platform] = {
        healthy,
        lastChecked: new Date().toISOString(),
      };
    });

    res.json({
      success: true,
      data: status,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to check platform status', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to check platform status',
      timestamp: new Date(),
    });
  }
});

export default router;
