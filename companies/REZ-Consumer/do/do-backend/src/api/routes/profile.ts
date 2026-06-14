import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ValidationError } from '../middleware/errorHandler.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { authService, walletService, karmaService, userIntelligenceService } from '../../integrations/rezIntegrations.js';
import { logger } from '../../utils/logger.js';

export const profileRouter = Router();

// In-memory style preferences store (use database in production)
const stylePreferencesStore = new Map<string, {
  vibes?: string[];
  occasions?: string[];
  cuisines?: string[];
}>();

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional(),
});

const stylePreferencesSchema = z.object({
  vibes: z.array(z.string()).optional(),
  occasions: z.array(z.string()).optional(),
  cuisines: z.array(z.string()).optional(),
});

// GET /profile - Get user profile
profileRouter.get(
  '/',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const token = req.headers.authorization?.replace('Bearer ', '') || '';

    try {
      // Get profile from Auth Service
      const profile = await authService.getProfile(userId, token);

      // Get wallet balance
      let wallet = { coins: 0, cash: 0, locked: 0 };
      try {
        wallet = await walletService.getBalance(userId, token);
      } catch (e) {
        logger.warn('Profile: wallet fetch failed', { error: e });
      }

      // Get karma status
      let karma = { tier: 'Bronze', points: 0, nextTier: 'Silver', progress: 0 };
      try {
        karma = await karmaService.getStatus(userId, token);
      } catch (e) {
        logger.warn('Profile: karma fetch failed', { error: e });
      }

      // Get user intelligence/preferences
      let intelligence = null;
      try {
        intelligence = await userIntelligenceService.getPreferences(userId, token);
      } catch (e) {
        logger.warn('Profile: user intelligence fetch failed', { error: e });
      }

      res.json({
        success: true,
        profile: {
          id: profile.id || userId,
          email: profile.email,
          phone: profile.phone,
          name: profile.name,
          avatar: profile.avatar,
          createdAt: profile.createdAt,
          wallet: {
            coins: wallet.coins,
            cash: wallet.cash,
          },
          karma: {
            tier: karma.tier,
            points: karma.points,
            nextTier: karma.nextTier,
            progress: karma.progress,
          },
          intelligence: intelligence || undefined,
        },
      });
    } catch (error) {
      logger.warn('Profile fetch failed, using fallback', { error: error.message });
      // Fallback for development
      res.json({
        success: true,
        profile: {
          id: userId,
          phone: req.user!.phone,
          wallet: {
            coins: 0,
            cash: 0,
          },
          karma: {
            tier: 'Bronze',
            points: 0,
            nextTier: 'Silver',
            progress: 0,
          },
        },
      });
    }
  })
);

// PATCH /profile - Update profile
profileRouter.patch(
  '/',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    const { name, email, avatar } = req.body;

    try {
      const updatedProfile = await authService.updateProfile(token, { name, email, avatar });

      res.json({
        success: true,
        profile: updatedProfile,
      });
    } catch (error) {
      logger.warn('Profile update failed', { error: error.message });
      res.json({
        success: false,
        error: { message: 'Profile update failed' },
      });
    }
  })
);

// GET /profile/preferences - Get user preferences
profileRouter.get(
  '/preferences',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const token = req.headers.authorization?.replace('Bearer ', '') || '';

    try {
      const preferences = await userIntelligenceService.getPreferences(userId, token);

      res.json({
        success: true,
        preferences,
      });
    } catch (error) {
      logger.warn('Preferences fetch failed', { error: error.message });
      res.json({
        success: true,
        preferences: {
          notifications: { email: true, push: true, sms: true },
          language: 'en',
          currency: 'INR',
        },
      });
    }
  })
);

// PATCH /profile/preferences - Update user preferences
profileRouter.patch(
  '/preferences',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    const preferences = req.body;

    try {
      await userIntelligenceService.updatePreferences(userId, token, preferences);

      res.json({
        success: true,
        message: 'Preferences updated',
      });
    } catch (error) {
      logger.warn('Preferences update failed', { error: error.message });
      res.json({
        success: false,
        error: { message: 'Failed to update preferences' },
      });
    }
  })
);

// GET /profile/behavior - Get behavioral insights
profileRouter.get(
  '/behavior',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const token = req.headers.authorization?.replace('Bearer ', '') || '';

    try {
      const behavior = await userIntelligenceService.getBehavioralScore(userId, token);

      res.json({
        success: true,
        behavior,
      });
    } catch (error) {
      logger.warn('Behavior fetch failed', { error: error.message });
      res.json({
        success: true,
        behavior: {
          engagement: 'medium',
          riskLevel: 'low',
          lifetimeValue: 'medium',
        },
      });
    }
  })
);

// PATCH /profile/style-preferences - Update style preferences
profileRouter.patch(
  '/style-preferences',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const token = req.headers.authorization?.replace('Bearer ', '') || '';

    const parsed = stylePreferencesSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    // Store style preferences
    const currentPrefs = stylePreferencesStore.get(userId) || {};
    const updatedPrefs = { ...currentPrefs, ...parsed.data };
    stylePreferencesStore.set(userId, updatedPrefs);

    // Try to sync with user intelligence service
    try {
      await userIntelligenceService.updatePreferences(userId, token, updatedPrefs);
    } catch (e) {
      logger.warn('Style preferences sync failed', { error: e });
    }

    logger.info('Style preferences updated', { userId, preferences: updatedPrefs });

    res.json({
      success: true,
      message: 'Style preferences updated',
      preferences: updatedPrefs,
    });
  })
);

// GET /profile/style-preferences - Get style preferences
profileRouter.get(
  '/style-preferences',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;

    const preferences = stylePreferencesStore.get(userId) || {
      vibes: [],
      occasions: [],
      cuisines: [],
    };

    res.json({
      success: true,
      preferences,
    });
  })
);
