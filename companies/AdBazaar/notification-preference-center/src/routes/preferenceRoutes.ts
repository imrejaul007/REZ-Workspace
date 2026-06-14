import { Router, Response } from 'express';
import { z } from 'zod';
import { preferenceService } from '../services/PreferenceService';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import logger from 'utils/logger.js';

const router = Router();

const updatePreferencesSchema = z.object({
  channels: z.object({
    email: z.object({
      enabled: z.boolean().optional(),
      frequency: z.enum(['realtime', 'daily', 'weekly', 'monthly']).optional(),
      quietHours: z.object({
        start: z.string(),
        end: z.string(),
        timezone: z.string().optional(),
      }).optional(),
    }).optional(),
    sms: z.object({
      enabled: z.boolean().optional(),
      quietHours: z.object({
        start: z.string(),
        end: z.string(),
        timezone: z.string().optional(),
      }).optional(),
    }).optional(),
    push: z.object({
      enabled: z.boolean().optional(),
      sound: z.boolean().optional(),
      vibration: z.boolean().optional(),
    }).optional(),
    inApp: z.object({
      enabled: z.boolean().optional(),
      sound: z.boolean().optional(),
    }).optional(),
  }).optional(),
  categories: z.record(z.object({
    enabled: z.boolean(),
    channels: z.array(z.string()),
  })).optional(),
  marketing: z.object({
    enabled: z.boolean().optional(),
    frequency: z.enum(['realtime', 'daily', 'weekly', 'monthly']).optional(),
    categories: z.array(z.string()).optional(),
  }).optional(),
  transactional: z.object({
    enabled: z.boolean().optional(),
    types: z.array(z.string()).optional(),
  }).optional(),
});

const subscribeSchema = z.object({
  type: z.enum(['campaign', 'promotion', 'update', 'reminder', 'alert']),
  name: z.string().min(1),
  description: z.string().optional(),
  channels: z.array(z.enum(['email', 'sms', 'push', 'inApp'])).optional(),
  frequency: z.enum(['realtime', 'daily', 'weekly', 'monthly']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

router.get('/preferences/:userId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const preferences = await preferenceService.getOrCreatePreferences(req.params.userId);
    res.json(preferences);
  } catch (error) {
    logger.error('Error fetching preferences', { error });
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

router.put('/preferences/:userId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = updatePreferencesSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
      return;
    }

    const preferences = await preferenceService.updatePreferences(req.params.userId, parsed.data);
    res.json(preferences);
  } catch (error) {
    logger.error('Error updating preferences', { error });
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

router.post('/preferences/:userId/reset', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const preferences = await preferenceService.resetPreferences(req.params.userId);
    res.json(preferences);
  } catch (error) {
    logger.error('Error resetting preferences', { error });
    res.status(500).json({ error: 'Failed to reset preferences' });
  }
});

router.post('/preferences/:userId/subscribe', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = subscribeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
      return;
    }

    const subscription = await preferenceService.subscribe({
      ...parsed.data,
      userId: req.params.userId,
    });

    res.status(201).json(subscription);
  } catch (error) {
    logger.error('Error subscribing', { error });
    res.status(500).json({ error: (error as Error).message });
  }
});

router.delete('/preferences/:userId/subscribe/:subscriptionId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const unsubscribed = await preferenceService.unsubscribe(req.params.subscriptionId, req.params.userId);
    if (!unsubscribed) {
      res.status(404).json({ error: 'Subscription not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    logger.error('Error unsubscribing', { error });
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

router.get('/preferences/:userId/subscriptions', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, status, page = '1', limit = '50' } = req.query;
    const result = await preferenceService.getUserSubscriptions(req.params.userId, {
      type: type as string,
      status: status as string,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    });

    res.json({
      subscriptions: result.subscriptions,
      pagination: {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        total: result.total,
      },
    });
  } catch (error) {
    logger.error('Error fetching subscriptions', { error });
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

router.post('/preferences/:userId/subscriptions/:subscriptionId/pause', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const subscription = await preferenceService.pauseSubscription(req.params.subscriptionId, req.params.userId);
    if (!subscription) {
      res.status(404).json({ error: 'Subscription not found' });
      return;
    }
    res.json(subscription);
  } catch (error) {
    logger.error('Error pausing subscription', { error });
    res.status(500).json({ error: 'Failed to pause subscription' });
  }
});

router.post('/preferences/:userId/subscriptions/:subscriptionId/resume', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const subscription = await preferenceService.resumeSubscription(req.params.subscriptionId, req.params.userId);
    if (!subscription) {
      res.status(404).json({ error: 'Subscription not found' });
      return;
    }
    res.json(subscription);
  } catch (error) {
    logger.error('Error resuming subscription', { error });
    res.status(500).json({ error: 'Failed to resume subscription' });
  }
});

router.get('/preferences/:userId/analytics', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const analytics = await preferenceService.getPreferenceAnalytics(req.params.userId);
    res.json(analytics);
  } catch (error) {
    logger.error('Error fetching analytics', { error });
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

router.post('/preferences/:userId/category/:category', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { enabled, channels } = req.body;
    const preferences = await preferenceService.bulkUpdateCategory(
      req.params.userId,
      req.params.category,
      enabled,
      channels
    );
    res.json(preferences);
  } catch (error) {
    logger.error('Error updating category', { error });
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.post('/preferences/:userId/opt-out-marketing', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const preferences = await preferenceService.optOutAllMarketing(req.params.userId);
    res.json(preferences);
  } catch (error) {
    logger.error('Error opting out of marketing', { error });
    res.status(500).json({ error: 'Failed to opt out' });
  }
});

router.get('/can-send/:userId/:channel', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, channel } = req.params;
    const category = req.query.category as string;
    const canSend = await preferenceService.canSendNotification(userId, channel, category);
    res.json({ canSend });
  } catch (error) {
    logger.error('Error checking can send', { error });
    res.status(500).json({ error: 'Failed to check notification permission' });
  }
});

export default router;