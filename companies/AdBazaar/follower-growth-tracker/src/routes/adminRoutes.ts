import { Router, Request, Response } from 'express';
import { growthService, instagramService } from '../services/index.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const syncBodySchema = z.object({
  accountId: z.string().min(1),
  fetchFromInstagram: z.boolean().optional().default(true),
});

const unfollowBodySchema = z.object({
  accountId: z.string().min(1),
  unfollowerId: z.string().min(1),
  unfollowerUsername: z.string().optional(),
  daysAsFollower: z.number().min(0).optional(),
});

const competitorBodySchema = z.object({
  accountId: z.string().min(1),
  competitorId: z.string().min(1),
  competitorUsername: z.string().min(1),
  competitorName: z.string().optional(),
});

const snapshotBodySchema = z.object({
  accountId: z.string().min(1),
  followers: z.number().min(0),
  following: z.number().min(0).optional(),
  posts: z.number().min(0).optional(),
  change: z.number().optional(),
  sources: z
    .object({
      hashtag: z.number().min(0).optional(),
      explore: z.number().min(0).optional(),
      profile: z.number().min(0).optional(),
      suggested: z.number().min(0).optional(),
      other: z.number().min(0).optional(),
    })
    .optional(),
});

// POST /api/sync - Sync follower data
router.post('/sync', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { accountId, fetchFromInstagram } = syncBodySchema.parse(req.body);

    if (fetchFromInstagram) {
      // Sync from Instagram API
      await instagramService.syncUserProfile();
      const profile = await instagramService.getUserProfile();
      const followerInsights = await instagramService.getFollowerInsights();

      await growthService.createSnapshot(accountId, {
        followers: profile.followers_count,
        following: profile.following_count,
        posts: profile.media_count,
        sources: followerInsights.follower_source,
      });

      logger.info('Synced from Instagram', { accountId, followers: profile.followers_count });
    }

    res.json({
      success: true,
      message: 'Sync completed',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.errors,
      });
    }
    logger.error('Failed to sync', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to sync data',
    });
  }
});

// POST /api/snapshot - Create a manual snapshot
router.post('/snapshot', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = snapshotBodySchema.parse(req.body);

    await growthService.createSnapshot(data.accountId, {
      followers: data.followers,
      following: data.following || 0,
      posts: data.posts || 0,
      change: data.change,
      sources: data.sources,
    });

    res.status(201).json({
      success: true,
      message: 'Snapshot created',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.errors,
      });
    }
    logger.error('Failed to create snapshot', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to create snapshot',
    });
  }
});

// POST /api/unfollow - Record an unfollow event
router.post('/unfollow', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { accountId, unfollowerId, unfollowerUsername, daysAsFollower } = unfollowBodySchema.parse(req.body);

    await growthService.recordUnfollow(accountId, unfollowerId, unfollowerUsername, daysAsFollower);

    res.status(201).json({
      success: true,
      message: 'Unfollow recorded',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.errors,
      });
    }
    logger.error('Failed to record unfollow', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to record unfollow',
    });
  }
});

// POST /api/competitor - Add a competitor
router.post('/competitor', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { accountId, competitorId, competitorUsername, competitorName } = competitorBodySchema.parse(req.body);

    const competitor = await growthService.addCompetitor(
      accountId,
      competitorId,
      competitorUsername,
      competitorName
    );

    res.status(201).json({
      success: true,
      data: competitor,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.errors,
      });
    }
    logger.error('Failed to add competitor', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to add competitor',
    });
  }
});

// GET /api/profile/:accountId - Get Instagram profile (via internal service)
router.get('/profile/:accountId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = await instagramService.getUserProfile();

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    logger.error('Failed to get profile', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get profile',
    });
  }
});

export default router;