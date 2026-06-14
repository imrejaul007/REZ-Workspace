/**
 * Creator Profile Routes - Unified Creator API
 *
 * Single API for creators across the ecosystem:
 * - Creator QR
 * - Prive
 * - Wallet
 *
 * Base path: /api/creator
 */

import { Router, Request, Response, NextFunction } from 'express';
import { CreatorProfile, ICreatorProfile, CreatorStatus, CreatorTier, CreatorCategory } from '../../models';
import { AppError } from '../../middleware/errorHandler';
import { authMiddleware, requireAuth, optionalAuth } from '../../middleware/auth';
import { logger } from '../../config/logger';

const router = Router();

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * GET /api/creator/:userId
 * Get creator profile by userId
 */
router.get('/:userId', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    const creator = await CreatorProfile.findOne({ userId })
      .select('-__v')
      .lean();

    if (!creator) {
      throw new AppError(404, 'Creator not found');
    }

    // Don't expose internal fields
    const publicProfile = {
      userId: creator.userId,
      displayName: creator.displayName,
      bio: creator.bio,
      avatar: creator.avatar,
      coverImage: creator.coverImage,
      category: creator.category,
      tags: creator.tags,
      socialLinks: creator.socialLinks,
      tier: creator.tier,
      priveTier: creator.priveTier,
      priveBadgeColor: creator.priveBadgeColor,
      isVerified: creator.isVerified,
      isFeatured: creator.isFeatured,
      stats: {
        totalFollowers: creator.stats.totalFollowers,
        totalViews: creator.stats.totalViews,
        totalConversions: creator.stats.totalConversions,
        engagementRate: creator.stats.engagementRate,
      },
    };

    res.json({
      success: true,
      data: publicProfile,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/creator/search?q=
 * Search creators by name or category
 */
router.get('/search/query', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, category, tier, limit = 20 } = req.query;

    let query: unknown = { status: 'approved' };

    if (category) {
      query.category = category;
    }

    if (tier) {
      query.tier = tier;
    }

    if (q) {
      query.$text = { $search: q as string };
    }

    const creators = await CreatorProfile.find(query)
      .select('userId displayName bio avatar category tier priveTier isVerified stats')
      .sort(q ? { score: { $meta: 'textScore' } } : { 'stats.totalFollowers': -1 })
      .limit(parseInt(limit as string))
      .lean();

    res.json({
      success: true,
      data: creators,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/creator/featured
 * Get featured creators
 */
router.get('/list/featured', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 10 } = req.query;

    const creators = await CreatorProfile.find({ isFeatured: true, status: 'approved' })
      .select('userId displayName bio avatar category tier priveTier stats')
      .sort({ featuredOrder: 1 })
      .limit(parseInt(limit as string))
      .lean();

    res.json({
      success: true,
      data: creators,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/creator/tier/:tier
 * Get creators by tier
 */
router.get('/list/tier/:tier', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tier } = req.params;
    const { limit = 20 } = req.query;

    const creators = await CreatorProfile.find({ tier, status: 'approved' })
      .select('userId displayName avatar category priveTier stats')
      .sort({ 'stats.totalFollowers': -1 })
      .limit(parseInt(limit as string))
      .lean();

    res.json({
      success: true,
      data: creators,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/creator/prive/elite
 * Get Prive Elite creators
 */
router.get('/list/prive-elite', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 20 } = req.query;

    const creators = await CreatorProfile.find({ priveTier: 'elite', status: 'approved' })
      .select('userId displayName avatar priveTier priveScore stats')
      .sort({ priveScore: -1 })
      .limit(parseInt(limit as string))
      .lean();

    res.json({
      success: true,
      data: creators,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// AUTHENTICATED ROUTES
// ============================================

/**
 * GET /api/creator/me
 * Get current user's creator profile
 */
router.get('/profile/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as unknown).user?.userId;

    if (!userId) {
      throw new AppError(401, 'Authentication required');
    }

    const creator = await CreatorProfile.findOne({ userId });

    if (!creator) {
      throw new AppError(404, 'Creator profile not found');
    }

    res.json({
      success: true,
      data: creator,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/creator/apply
 * Apply to become a creator
 */
router.post('/apply', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as unknown).user?.userId;
    const { displayName, bio, category, tags, socialLinks } = req.body;

    if (!userId) {
      throw new AppError(401, 'Authentication required');
    }

    // Check if already has profile
    const existing = await CreatorProfile.findOne({ userId });
    if (existing) {
      throw new AppError(400, 'Creator profile already exists');
    }

    // Create profile
    const creator = new CreatorProfile({
      userId,
      displayName,
      bio: bio || '',
      category,
      tags: tags || [],
      socialLinks: socialLinks || [],
      status: 'pending',
      applicationDate: new Date(),
      stats: {
        totalPicks: 0,
        totalViews: 0,
        totalLikes: 0,
        totalFollowers: 0,
        totalConversions: 0,
        totalEarnings: 0,
        engagementRate: 0,
      },
    });

    await creator.save();

    logger.info('Creator application submitted', { userId, category });

    res.status(201).json({
      success: true,
      data: creator,
      message: 'Application submitted for review',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/creator/profile
 * Update own creator profile
 */
router.put('/profile', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as unknown).user?.userId;

    if (!userId) {
      throw new AppError(401, 'Authentication required');
    }

    const { displayName, bio, avatar, coverImage, category, tags, socialLinks } = req.body;

    const creator = await CreatorProfile.findOneAndUpdate(
      { userId },
      {
        $set: {
          ...(displayName && { displayName }),
          ...(bio !== undefined && { bio }),
          ...(avatar && { avatar }),
          ...(coverImage && { coverImage }),
          ...(category && { category }),
          tags: tags || [],
          socialLinks: socialLinks || [],
        },
      },
      { new: true }
    );

    if (!creator) {
      throw new AppError(404, 'Creator profile not found');
    }

    logger.info('Creator profile updated', { userId });

    res.json({
      success: true,
      data: creator,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/creator/prive
 * Update Prive info (called by Prive service)
 */
router.put('/prive', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as unknown).user?.userId;
    const { priveTier, priveScore, priveBadgeColor } = req.body;

    if (!userId) {
      throw new AppError(401, 'Authentication required');
    }

    const creator = await CreatorProfile.findOneAndUpdate(
      { userId },
      {
        $set: {
          ...(priveTier && { priveTier }),
          ...(priveScore !== undefined && { priveScore }),
          ...(priveBadgeColor && { priveBadgeColor }),
        },
      },
      { new: true }
    );

    if (!creator) {
      throw new AppError(404, 'Creator profile not found');
    }

    res.json({
      success: true,
      data: {
        priveTier: creator.priveTier,
        priveScore: creator.priveScore,
        priveBadgeColor: creator.priveBadgeColor,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * PUT /api/creator/admin/:userId/approve
 * Approve creator application
 */
router.put('/admin/:userId/approve', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const adminId = (req as unknown).user?.userId;

    const creator = await CreatorProfile.findOneAndUpdate(
      { userId, status: 'pending' },
      {
        $set: {
          status: 'approved',
          approvedDate: new Date(),
          approvedBy: adminId,
        },
      },
      { new: true }
    );

    if (!creator) {
      throw new AppError(404, 'Pending creator not found');
    }

    logger.info('Creator approved', { userId, adminId });

    res.json({
      success: true,
      data: creator,
      message: 'Creator approved',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/creator/admin/:userId/tier
 * Update creator tier
 */
router.put('/admin/:userId/tier', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { tier } = req.body;

    const creator = await CreatorProfile.findOneAndUpdate(
      { userId },
      { $set: { tier } },
      { new: true }
    );

    if (!creator) {
      throw new AppError(404, 'Creator not found');
    }

    res.json({
      success: true,
      data: { tier: creator.tier },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/creator/admin/:userId/stats
 * Update creator stats
 */
router.put('/admin/:userId/stats', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const stats = req.body;

    const creator = await CreatorProfile.findOneAndUpdate(
      { userId },
      {
        $set: {
          'stats': { ...stats, lastUpdated: new Date() },
        },
      },
      { new: true }
    );

    if (!creator) {
      throw new AppError(404, 'Creator not found');
    }

    res.json({
      success: true,
      data: { stats: creator.stats },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
