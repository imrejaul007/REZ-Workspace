import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ValidationError } from '../middleware/errorHandler.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { logger } from '../../utils/logger.js';

export const notificationsRouter = Router();

// In-memory push token store (use database in production)
const pushTokenStore = new Map<string, {
  token: string;
  platform: 'ios' | 'android';
  userId: string;
  createdAt: string;
  updatedAt: string;
}>();

// In-memory notification preferences
const notificationPreferencesStore = new Map<string, {
  push: boolean;
  sms: boolean;
  email: boolean;
  whatsapp: boolean;
  bookingReminders: boolean;
  walletUpdates: boolean;
  dealsAndOffers: boolean;
  karmaUpdates: boolean;
}>();

// Validation schemas
const registerTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  platform: z.enum(['ios', 'android']).default('ios'),
});

const updatePreferencesSchema = z.object({
  push: z.boolean().optional(),
  sms: z.boolean().optional(),
  email: z.boolean().optional(),
  whatsapp: z.boolean().optional(),
  bookingReminders: z.boolean().optional(),
  walletUpdates: z.boolean().optional(),
  dealsAndOffers: z.boolean().optional(),
  karmaUpdates: z.boolean().optional(),
});

// POST /notifications/register-token - Register push token
notificationsRouter.post(
  '/register-token',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;

    const parsed = registerTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const { token, platform } = parsed.data;

    // Store or update token
    pushTokenStore.set(token, {
      token,
      platform,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Initialize notification preferences if not exists
    if (!notificationPreferencesStore.has(userId)) {
      notificationPreferencesStore.set(userId, {
        push: true,
        sms: true,
        email: true,
        whatsapp: false,
        bookingReminders: true,
        walletUpdates: true,
        dealsAndOffers: true,
        karmaUpdates: true,
      });
    }

    logger.info('Push token registered', { userId, platform });

    res.json({
      success: true,
      message: 'Push token registered',
    });
  })
);

// DELETE /notifications/unregister-token - Unregister push token
notificationsRouter.delete(
  '/unregister-token',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const { token } = req.body;

    if (token) {
      pushTokenStore.delete(token);
      logger.info('Push token unregistered', { userId });
    }

    res.json({
      success: true,
      message: 'Push token unregistered',
    });
  })
);

// GET /notifications/preferences - Get notification preferences
notificationsRouter.get(
  '/preferences',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;

    const preferences = notificationPreferencesStore.get(userId) || {
      push: true,
      sms: true,
      email: true,
      whatsapp: false,
      bookingReminders: true,
      walletUpdates: true,
      dealsAndOffers: true,
      karmaUpdates: true,
    };

    res.json({
      success: true,
      preferences,
    });
  })
);

// PATCH /notifications/preferences - Update notification preferences
notificationsRouter.patch(
  '/preferences',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;

    const parsed = updatePreferencesSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    // Get existing or create new preferences
    const current = notificationPreferencesStore.get(userId) || {
      push: true,
      sms: true,
      email: true,
      whatsapp: false,
      bookingReminders: true,
      walletUpdates: true,
      dealsAndOffers: true,
      karmaUpdates: true,
    };

    const updated = { ...current, ...parsed.data };
    notificationPreferencesStore.set(userId, updated);

    logger.info('Notification preferences updated', { userId, preferences: updated });

    res.json({
      success: true,
      message: 'Preferences updated',
      preferences: updated,
    });
  })
);

// GET /notifications/device-tokens - Get all tokens for a user
notificationsRouter.get(
  '/device-tokens',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;

    const tokens = Array.from(pushTokenStore.values())
      .filter((entry) => entry.userId === userId)
      .map((entry) => ({
        token: entry.token.slice(0, 20) + '...',
        platform: entry.platform,
        createdAt: entry.createdAt,
      }));

    res.json({
      success: true,
      tokens,
      count: tokens.length,
    });
  })
);

// POST /notifications/test - Send test notification (development only)
notificationsRouter.post(
  '/test',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;

    // Find user's tokens
    const tokens = Array.from(pushTokenStore.values())
      .filter((entry) => entry.userId === userId);

    if (tokens.length === 0) {
      res.json({
        success: false,
        message: 'No push tokens registered',
      });
      return;
    }

    logger.info('Test notification sent', { userId, tokenCount: tokens.length });

    res.json({
      success: true,
      message: `Test notification would be sent to ${tokens.length} device(s)`,
      tokens: tokens.length,
    });
  })
);
