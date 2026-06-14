import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { discoveryService, SearchFilters } from '../services/discoveryService';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const createInfluencerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  niche: z.array(z.string()).min(1),
  platforms: z.array(z.object({
    platform: z.string(),
    handle: z.string(),
    followers: z.number().min(0),
    engagementRate: z.number().optional()
  })),
  audience: z.object({
    size: z.number().min(0),
    demographics: z.object({
      ageRange: z.object({ min: z.number(), max: z.number() }).optional(),
      gender: z.enum(['male', 'female', 'other', 'all']).optional(),
      locations: z.array(z.string()).optional()
    }).optional()
  }).optional(),
  location: z.string().optional(),
  language: z.array(z.string()).optional(),
  rates: z.object({
    story: z.number().optional(),
    post: z.number().optional(),
    video: z.number().optional(),
    reel: z.number().optional(),
    live: z.number().optional()
  }).optional(),
  tags: z.array(z.string()).optional()
});

const searchSchema = z.object({
  niche: z.array(z.string()).optional(),
  platform: z.array(z.string()).optional(),
  minFollowers: z.number().optional(),
  maxFollowers: z.number().optional(),
  minEngagementRate: z.number().optional(),
  location: z.string().optional(),
  language: z.array(z.string()).optional(),
  verificationStatus: z.enum(['verified', 'pending', 'rejected']).optional(),
  minScore: z.number().optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().optional().default(1),
  limit: z.number().optional().default(20)
});

// POST /api/influencers - Create influencer
router.post('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = createInfluencerSchema.parse(req.body);
    const influencer = await discoveryService.createInfluencer(validatedData);
    logger.info('Influencer created via API', { userId: req.userId, influencerId: influencer._id });
    res.status(201).json(influencer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      next(error);
    }
  }
});

// GET /api/influencers - List all influencers
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await discoveryService.getAllInfluencers(page, limit);
    res.json({
      influencers: result.influencers,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit)
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/influencers/:id - Get influencer by ID
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const influencer = await discoveryService.getInfluencerById(req.params.id);
    if (!influencer) {
      return res.status(404).json({ error: 'Influencer not found' });
    }
    res.json(influencer);
  } catch (error) {
    next(error);
  }
});

// POST /api/influencers/search - Search influencers
router.post('/search', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = searchSchema.parse(req.body);
    const filters: SearchFilters = {
      niche: validatedData.niche,
      platform: validatedData.platform,
      minFollowers: validatedData.minFollowers,
      maxFollowers: validatedData.maxFollowers,
      minEngagementRate: validatedData.minEngagementRate,
      location: validatedData.location,
      language: validatedData.language,
      verificationStatus: validatedData.verificationStatus,
      minScore: validatedData.minScore,
      tags: validatedData.tags
    };

    const result = await discoveryService.searchInfluencers(
      filters,
      validatedData.page || 1,
      validatedData.limit || 20
    );

    res.json({
      influencers: result.influencers,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit)
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      next(error);
    }
  }
});

// GET /api/influencers/:id/profile - Get influencer profile
router.get('/:id/profile', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await discoveryService.getInfluencerProfile(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Influencer not found' });
    }
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

// POST /api/influencers/:id/match - Match influencer to campaign
router.post('/:id/match', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { campaignId, requirements } = req.body;
    const result = await discoveryService.matchInfluencersToCampaign(campaignId, requirements);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// PUT /api/influencers/:id - Update influencer
router.put('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createInfluencerSchema.partial().parse(req.body);
    const influencer = await discoveryService.updateInfluencer(req.params.id, validatedData);
    if (!influencer) {
      return res.status(404).json({ error: 'Influencer not found' });
    }
    res.json(influencer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      next(error);
    }
  }
});

// DELETE /api/influencers/:id - Delete influencer
router.delete('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await discoveryService.deleteInfluencer(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Influencer not found' });
    }
    res.json({ message: 'Influencer deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export { router as influencerRoutes };
