import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { shareRateLimiter } from '../middleware/rateLimiter';
import { creatorEngine } from '../services/creatorEngine';
import { qrCloud } from '../integrations/qrCloud';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const createProfileSchema = z.object({
  handle: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/),
  displayName: z.string().min(1).max(100),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
});

const createCollectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  items: z.array(z.object({
    type: z.enum(['product', 'merchant', 'service', 'event', 'guide']),
    name: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    imageUrl: z.string().url().optional(),
    url: z.string().optional(),
  })).optional(),
});

const trackScanSchema = z.object({
  collectionSlug: z.string().optional(),
  ip: z.string().optional(),
  deviceId: z.string().optional(),
});

/**
 * GET /api/creator/profile
 * Get creator profile
 */
router.get('/api/creator/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const companyId = req.companyId || 'rez';

    let profile = await creatorEngine.getProfileByUser(userId, companyId);

    if (!profile) {
      return sendSuccess(res, {
        hasProfile: false,
        message: 'No creator profile found. Create one with POST /api/creator/profile',
      });
    }

    const referralCode = await creatorEngine.getCreatorCode(profile._id.toString());

    return sendSuccess(res, {
      hasProfile: true,
      profile: {
        id: profile._id,
        handle: profile.handle,
        displayName: profile.displayName,
        bio: profile.bio,
        avatar: profile.avatar,
        tier: profile.tier,
        referralCode,
        referralUrl: `https://rez.app/c/${profile.handle}`,
        stats: {
          totalViews: profile.totalViews,
          totalScans: profile.totalScans,
          totalClicks: profile.totalClicks,
          totalInstalls: profile.totalInstalls,
          totalRegistrations: profile.totalRegistrations,
          totalOrders: profile.totalOrders,
          totalRevenue: profile.totalRevenue,
        },
        earnings: {
          pending: profile.pendingEarnings,
          approved: profile.approvedEarnings,
          paid: profile.paidEarnings,
        },
        payoutEnabled: profile.payoutEnabled,
      },
    });
  } catch (error) {
    logger.error('[CreatorRoutes] Error getting profile:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * POST /api/creator/profile
 * Create/update creator profile
 */
router.post('/api/creator/profile', requireAuth, shareRateLimiter, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const companyId = req.companyId || 'rez';
    const validation = createProfileSchema.safeParse(req.body);

    if (!validation.success) {
      return sendError(res, 'VALIDATION_ERROR', 400, validation.error.errors);
    }

    const { handle, displayName, bio, avatar } = validation.data;

    const profile = await creatorEngine.createProfile({
      userId,
      handle,
      displayName,
      bio,
      avatar,
      companyId,
    });

    const referralCode = await creatorEngine.getCreatorCode(profile._id.toString());

    return sendSuccess(res, {
      id: profile._id,
      handle: profile.handle,
      displayName: profile.displayName,
      referralCode,
      referralUrl: `https://rez.app/c/${profile.handle}`,
      tier: profile.tier,
    }, 201);
  } catch (error) {
    logger.error('[CreatorRoutes] Error creating profile:', error);
    if ((error as Error).message.includes('handle')) {
      return sendError(res, 'CREATOR_HANDLE_EXISTS', 409);
    }
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * GET /api/creator/collections
 * List creator collections
 */
router.get('/api/creator/collections', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const collections = await creatorEngine.getCollections(userId);

    return sendSuccess(res, {
      collections: collections.map((c) => ({
        id: c._id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        itemCount: c.items.length,
        totalScans: c.totalScans,
        totalConversions: c.totalConversions,
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    logger.error('[CreatorRoutes] Error listing collections:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * POST /api/creator/collections
 * Create collection
 */
router.post('/api/creator/collections', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const validation = createCollectionSchema.safeParse(req.body);

    if (!validation.success) {
      return sendError(res, 'VALIDATION_ERROR', 400, validation.error.errors);
    }

    const { name, description, items } = validation.data;

    const collection = await creatorEngine.createCollection({
      creatorId: userId,
      name,
      description,
      items,
    });

    return sendSuccess(res, {
      id: collection._id,
      name: collection.name,
      slug: collection.slug,
      description: collection.description,
      itemCount: collection.items.length,
    }, 201);
  } catch (error) {
    logger.error('[CreatorRoutes] Error creating collection:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * GET /api/creator/qr/:collectionSlug
 * Get QR code for collection (uses QR Cloud integration)
 */
router.get('/api/creator/qr/:collectionSlug', async (req: Request, res: Response) => {
  try {
    const { collectionSlug } = req.params;
    const handle = req.query.handle as string;

    if (!handle) {
      return sendError(res, 'VALIDATION_ERROR', 400, 'Handle is required');
    }

    const profile = await creatorEngine.getProfileByHandle(handle);
    if (!profile) {
      return sendError(res, 'CREATOR_NOT_FOUND', 404);
    }

    // Use QR Cloud integration for generating QR codes
    const qrResult = await qrCloud.generateQRCode({
      type: collectionSlug !== 'default' ? 'creator_collection' : 'referral',
      collectionSlug: collectionSlug !== 'default' ? collectionSlug : undefined,
      creatorHandle: handle,
      metadata: {
        creatorId: profile._id.toString(),
        creatorHandle: handle,
      },
    });

    // Fallback to local generation if QR Cloud fails
    let qrCode = qrResult.qrCode;
    if (!qrCode) {
      qrCode = await creatorEngine.generateQRCode({
        creatorId: profile._id.toString(),
        collectionSlug: collectionSlug !== 'default' ? collectionSlug : undefined,
        baseUrl: process.env.BASE_URL || 'https://rez.app',
      });
    }

    return sendSuccess(res, {
      qrCode,
      qrUrl: qrResult.url,
      shortCode: qrResult.shortCode,
      creator: {
        handle: profile.handle,
        displayName: profile.displayName,
        avatar: profile.avatar,
      },
      collection: collectionSlug !== 'default' ? collectionSlug : null,
      url: `https://rez.app/c/${handle}${collectionSlug !== 'default' ? `/${collectionSlug}` : ''}`,
    });
  } catch (error) {
    logger.error('[CreatorRoutes] Error generating QR:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * GET /api/creator/stats
 * Get creator analytics
 */
router.get('/api/creator/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const profile = await creatorEngine.getProfileByUser(userId);
    if (!profile) {
      return sendError(res, 'CREATOR_NOT_FOUND', 404);
    }

    const earnings = await creatorEngine.getEarningsSummary(profile._id.toString());

    return sendSuccess(res, {
      stats: {
        totalViews: profile.totalViews,
        totalScans: profile.totalScans,
        totalClicks: profile.totalClicks,
        totalInstalls: profile.totalInstalls,
        totalRegistrations: profile.totalRegistrations,
        totalOrders: profile.totalOrders,
        totalRevenue: profile.totalRevenue,
      },
      earnings,
      tier: profile.tier,
    });
  } catch (error) {
    logger.error('[CreatorRoutes] Error getting stats:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * GET /api/creator/earnings
 * Get creator earnings
 */
router.get('/api/creator/earnings', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const earnings = await creatorEngine.getEarningsSummary(userId);

    return sendSuccess(res, earnings);
  } catch (error) {
    logger.error('[CreatorRoutes] Error getting earnings:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * GET /api/creator/leaderboard
 * Get top creators
 */
router.get('/api/creator/leaderboard', async (req: Request, res: Response) => {
  try {
    const companyId = (req.query.companyId as string) || 'rez';
    const limit = parseInt(req.query.limit as string) || 10;

    const leaderboard = await creatorEngine.getLeaderboard(companyId, limit);

    return sendSuccess(res, {
      leaderboard: leaderboard.map((creator, index) => ({
        rank: index + 1,
        handle: creator.handle,
        displayName: creator.displayName,
        avatar: creator.avatar,
        tier: creator.tier,
        totalRegistrations: creator.totalRegistrations,
        totalRevenue: creator.totalRevenue,
      })),
    });
  } catch (error) {
    logger.error('[CreatorRoutes] Error getting leaderboard:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * GET /api/creator/referrals
 * Get creator referrals (attribution)
 */
router.get('/api/creator/referrals', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = parseInt(req.query.skip as string) || 0;

    const referrals = await creatorEngine.getReferrals(userId, { limit, skip });

    return sendSuccess(res, {
      referrals,
      pagination: { limit, skip, total: referrals.length },
    });
  } catch (error) {
    logger.error('[CreatorRoutes] Error getting referrals:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * POST /api/creator/scan
 * Track QR scan
 */
router.post('/api/creator/scan', async (req: Request, res: Response) => {
  try {
    const validation = trackScanSchema.safeParse(req.body);

    if (!validation.success) {
      return sendError(res, 'VALIDATION_ERROR', 400, validation.error.errors);
    }

    const { collectionSlug, ip, deviceId } = validation.data;
    const creatorId = req.body.creatorId as string;

    if (!creatorId) {
      return sendError(res, 'VALIDATION_ERROR', 400, 'Creator ID is required');
    }

    await creatorEngine.trackScan({
      creatorId,
      ip,
      deviceId,
      userId: req.userId,
    });

    return sendSuccess(res, { tracked: true });
  } catch (error) {
    logger.error('[CreatorRoutes] Error tracking scan:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

export default router;
