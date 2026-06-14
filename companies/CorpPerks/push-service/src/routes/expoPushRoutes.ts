import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { expoPushService } from '../services';
import { internalAuth } from '../middleware';

// ==================== ROUTER SETUP ====================

const router = Router();

// ==================== VALIDATION SCHEMAS ====================

const RegisterTokenSchema = z.object({
  userId: z.string().min(1),
  companyId: z.string().min(1),
  expoPushToken: z.string().min(1),
  platform: z.enum(['ios', 'android', 'web']),
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
  deviceModel: z.string().optional(),
  osVersion: z.string().optional(),
  appVersion: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const UnregisterTokenSchema = z.object({
  expoPushToken: z.string().min(1),
});

const SendPushSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  data: z.record(z.unknown()).optional(),
  sound: z.enum(['default', 'none']).optional(),
  priority: z.enum(['default', 'normal', 'high']).optional(),
  badge: z.number().int().min(0).max(999).optional(),
  deepLink: z.string().url().optional(),
});

const SendToUsersSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1).max(100),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  data: z.record(z.unknown()).optional(),
  sound: z.enum(['default', 'none']).optional(),
  priority: z.enum(['default', 'normal', 'high']).optional(),
  badge: z.number().int().min(0).max(999).optional(),
  deepLink: z.string().url().optional(),
});

const ScheduleNotificationSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  data: z.record(z.unknown()).optional(),
  sound: z.enum(['default', 'none']).optional(),
  priority: z.enum(['default', 'normal', 'high']).optional(),
  scheduledAt: z.string().datetime(),
  deepLink: z.string().url().optional(),
});

// ==================== PUBLIC ROUTES ====================

/**
 * POST /api/push/register
 * Register a device token for push notifications
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const validation = RegisterTokenSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: validation.error.errors,
      });
      return;
    }

    const token = await expoPushService.registerToken(validation.data);

    res.json({
      success: true,
      data: {
        tokenId: token.tokenId,
        expoPushToken: token.expoPushToken,
        platform: token.platform,
        isActive: token.isActive,
      },
      message: 'Device token registered successfully',
    });
  } catch (error) {
    logger.error('Failed to register token:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register token',
    });
  }
});

/**
 * DELETE /api/push/unregister
 * Unregister a device token
 */
router.delete('/unregister', async (req: Request, res: Response) => {
  try {
    const validation = UnregisterTokenSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: validation.error.errors,
      });
      return;
    }

    const result = await expoPushService.unregisterToken(validation.data.expoPushToken);

    res.json({
      success: result,
      message: result ? 'Token unregistered successfully' : 'Token not found',
    });
  } catch (error) {
    logger.error('Failed to unregister token:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to unregister token',
    });
  }
});

// ==================== AUTHENTICATED ROUTES ====================

/**
 * POST /api/push/send
 * Send push notification to a user
 */
router.post('/send', internalAuth, async (req: Request, res: Response) => {
  try {
    const validation = SendPushSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: validation.error.errors,
      });
      return;
    }

    const result = await expoPushService.sendToUser(validation.data.userId, {
      title: validation.data.title,
      body: validation.data.body,
      data: validation.data.data,
      sound: validation.data.sound,
      priority: validation.data.priority,
      badge: validation.data.badge,
      deepLink: validation.data.deepLink,
    });

    res.json({
      success: result.success,
      data: {
        notificationId: result.notificationId,
        deliveryResults: result.deliveryResults,
      },
      message: result.success ? 'Notification sent successfully' : 'Failed to send notification',
    });
  } catch (error) {
    logger.error('Failed to send notification:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send notification',
    });
  }
});

/**
 * POST /api/push/send/batch
 * Send push notification to multiple users
 */
router.post('/send/batch', internalAuth, async (req: Request, res: Response) => {
  try {
    const validation = SendToUsersSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: validation.error.errors,
      });
      return;
    }

    const result = await expoPushService.sendToUsers(validation.data.userIds, {
      title: validation.data.title,
      body: validation.data.body,
      data: validation.data.data,
      sound: validation.data.sound,
      priority: validation.data.priority,
      badge: validation.data.badge,
      deepLink: validation.data.deepLink,
    });

    res.json({
      success: result.success,
      data: {
        notificationId: result.notificationId,
        totalUsers: result.deliveryResults.length,
        successCount: result.deliveryResults.filter((r) => r.status === 'sent').length,
        failureCount: result.deliveryResults.filter((r) => r.status === 'failed').length,
        deliveryResults: result.deliveryResults,
      },
    });
  } catch (error) {
    logger.error('Failed to send batch notification:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send notifications',
    });
  }
});

/**
 * POST /api/push/schedule
 * Schedule a push notification for future delivery
 */
router.post('/schedule', internalAuth, async (req: Request, res: Response) => {
  try {
    const validation = ScheduleNotificationSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: validation.error.errors,
      });
      return;
    }

    const scheduledAt = new Date(validation.data.scheduledAt);
    if (scheduledAt <= new Date()) {
      res.status(400).json({
        success: false,
        error: 'Scheduled time must be in the future',
      });
      return;
    }

    const result = await expoPushService.scheduleNotification(
      validation.data.userId,
      {
        title: validation.data.title,
        body: validation.data.body,
        data: validation.data.data,
        sound: validation.data.sound,
        priority: validation.data.priority,
        deepLink: validation.data.deepLink,
      },
      scheduledAt
    );

    res.json({
      success: result.success,
      data: {
        scheduleId: result.scheduleId,
        scheduledAt: scheduledAt.toISOString(),
      },
      message: 'Notification scheduled successfully',
    });
  } catch (error) {
    logger.error('Failed to schedule notification:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to schedule notification',
    });
  }
});

/**
 * DELETE /api/push/schedule/:scheduleId
 * Cancel a scheduled notification
 */
router.delete('/schedule/:scheduleId', internalAuth, async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;

    const result = await expoPushService.cancelScheduledNotification(scheduleId);

    res.json({
      success: result,
      message: result ? 'Scheduled notification cancelled' : 'Schedule not found',
    });
  } catch (error) {
    logger.error('Failed to cancel scheduled notification:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel notification',
    });
  }
});

// ==================== QUERY ROUTES ====================

/**
 * GET /api/push/tokens/:userId
 * Get all device tokens for a user
 */
router.get('/tokens/:userId', internalAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const tokens = await expoPushService.getUserTokens(userId);

    res.json({
      success: true,
      data: {
        userId,
        tokens: tokens.map((token) => ({
          tokenId: token.tokenId,
          platform: token.platform,
          deviceName: token.deviceName,
          deviceModel: token.deviceModel,
          osVersion: token.osVersion,
          appVersion: token.appVersion,
          isActive: token.isActive,
          lastUsedAt: token.lastUsedAt,
          notificationCount: token.notificationCount,
        })),
        totalTokens: tokens.length,
      },
    });
  } catch (error) {
    logger.error('Failed to get user tokens:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get tokens',
    });
  }
});

/**
 * GET /api/push/tokens/company/:companyId
 * Get all device tokens for a company
 */
router.get('/tokens/company/:companyId', internalAuth, async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;

    const tokens = await expoPushService.getCompanyTokens(companyId);

    res.json({
      success: true,
      data: {
        companyId,
        totalDevices: tokens.length,
        platforms: {
          ios: tokens.filter((t) => t.platform === 'ios').length,
          android: tokens.filter((t) => t.platform === 'android').length,
          web: tokens.filter((t) => t.platform === 'web').length,
        },
      },
    });
  } catch (error) {
    logger.error('Failed to get company tokens:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get tokens',
    });
  }
});

/**
 * GET /api/push/history/:userId
 * Get notification history for a user
 */
router.get('/history/:userId', internalAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const history = await expoPushService.getUserNotificationHistory(userId, limit);

    res.json({
      success: true,
      data: {
        userId,
        history,
        count: history.length,
      },
    });
  } catch (error) {
    logger.error('Failed to get notification history:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get history',
    });
  }
});

/**
 * GET /api/push/stats/:notificationId
 * Get delivery statistics for a notification
 */
router.get('/stats/:notificationId', internalAuth, async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;

    const stats = await expoPushService.getDeliveryStats(notificationId);

    res.json({
      success: true,
      data: {
        notificationId,
        ...stats,
        deliveryRate: stats.total > 0 ? ((stats.delivered / stats.total) * 100).toFixed(2) + '%' : '0%',
      },
    });
  } catch (error) {
    logger.error('Failed to get delivery stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats',
    });
  }
});

// ==================== HEALTH CHECK ====================

/**
 * GET /api/push/health
 * Health check for Expo push service
 */
router.get('/health', async (_req: Request, res: Response) => {
  const expoHealthy = await expoPushService.healthCheck();

  res.json({
    success: true,
    service: 'expo-push-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    status: expoHealthy ? 'healthy' : 'degraded',
    dependencies: {
      expoApi: expoHealthy ? 'connected' : 'disconnected',
    },
  });
});

// ==================== EXPORT ====================

export default router;
