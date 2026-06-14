import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { campaignService } from '../services/campaignService';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logger } from 'utils/logger.js';

const router = Router();

// Validation schemas
const createCampaignSchema = z.object({
  name: z.string().min(1),
  brandId: z.string(),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  budget: z.object({
    total: z.number().min(0),
    currency: z.string().default('INR')
  }),
  brief: z.object({
    objectives: z.array(z.string()),
    keyMessages: z.array(z.string()),
    contentGuidelines: z.string().optional(),
    hashtags: z.array(z.string()).optional()
  }).optional(),
  platforms: z.array(z.string()),
  deliverables: z.array(z.object({
    type: z.enum(['post', 'story', 'reel', 'video', 'live', 'blog']),
    quantity: z.number(),
    platform: z.string().optional()
  })).optional(),
  tracking: z.object({
    promoCode: z.string().optional(),
    utmSource: z.string().optional(),
    landingPage: z.string().optional()
  }).optional()
});

const updateCampaignSchema = createCampaignSchema.partial();

const addInfluencerSchema = z.object({
  influencerId: z.string().optional(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  platform: z.string(),
  handle: z.string(),
  followers: z.number(),
  agreedRate: z.number().optional(),
  deliverables: z.array(z.object({
    type: z.enum(['post', 'story', 'reel', 'video', 'live', 'blog']),
    platform: z.string().optional(),
    description: z.string().optional(),
    scheduledDate: z.string().datetime().optional()
  })).optional()
});

// POST /api/campaigns - Create campaign
router.post('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = createCampaignSchema.parse(req.body);
    const campaign = await campaignService.createCampaign({
      ...validatedData,
      startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined
    });
    logger.info('Campaign created via API', { userId: req.userId, campaignId: campaign._id });
    res.status(201).json(campaign);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      next(error);
    }
  }
});

// GET /api/campaigns - List campaigns
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { brandId, status, page, limit } = req.query;
    const result = await campaignService.getAllCampaigns({
      brandId: brandId as string,
      status: status as string,
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 20
    });
    res.json({
      campaigns: result.campaigns,
      total: result.total,
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 20
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/campaigns/:id - Get campaign by ID
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaign = await campaignService.getCampaignById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (error) {
    next(error);
  }
});

// PUT /api/campaigns/:id - Update campaign
router.put('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = updateCampaignSchema.parse(req.body);
    const campaign = await campaignService.updateCampaign(req.params.id, {
      ...validatedData,
      startDate: validatedData.startDate ? new Date(validatedData.startDate as any) : undefined,
      endDate: validatedData.endDate ? new Date(validatedData.endDate as any) : undefined
    } as any);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      next(error);
    }
  }
});

// POST /api/campaigns/:id/influencers - Add influencer to campaign
router.post('/:id/influencers', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = addInfluencerSchema.parse(req.body);
    const influencer = await campaignService.addInfluencerToCampaign(req.params.id, {
      ...validatedData,
      deliverables: validatedData.deliverables?.map(d => ({
        ...d,
        scheduledDate: d.scheduledDate ? new Date(d.scheduledDate) : undefined
      }))
    } as any);
    res.status(201).json(influencer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      next(error);
    }
  }
});

// GET /api/campaigns/:id/influencers - Get campaign influencers
router.get('/:id/influencers', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const influencers = await campaignService.getCampaignInfluencers(req.params.id);
    res.json(influencers);
  } catch (error) {
    next(error);
  }
});

// PUT /api/campaigns/:id/influencers/:influencerId - Update influencer status
router.put('/:id/influencers/:influencerId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const influencer = await campaignService.updateInfluencerStatus(
      req.params.id,
      req.params.influencerId,
      status
    );
    if (!influencer) {
      return res.status(404).json({ error: 'Influencer not found in campaign' });
    }
    res.json(influencer);
  } catch (error) {
    next(error);
  }
});

// GET /api/campaigns/:id/performance - Get campaign performance
router.get('/:id/performance', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const performance = await campaignService.getCampaignPerformance(req.params.id);
    res.json(performance);
  } catch (error) {
    next(error);
  }
});

// POST /api/campaigns/:id/brief - Create campaign brief
router.post('/:id/brief', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brief = await campaignService.createBrief(req.params.id, req.body);
    res.status(201).json(brief);
  } catch (error) {
    next(error);
  }
});

// GET /api/campaigns/:id/brief - Get campaign briefs
router.get('/:id/brief', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const briefs = await campaignService.getCampaignBriefs(req.params.id);
    res.json(briefs);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/campaigns/:id - Delete campaign
router.delete('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await campaignService.deleteCampaign(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export { router as campaignRoutes };
