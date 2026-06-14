import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { campaignService } from '../services/index.js';
import { asyncHandler, authMiddleware, AuthenticatedRequest, ValidationError, NotFoundError } from '../middleware/index.js';

const router = Router();

// Validation schemas
const CreateCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  format: z.enum(['preroll', 'midroll', 'postroll', 'pod']),
  budget: z.object({
    daily: z.number().min(0),
    total: z.number().min(0),
  }),
  bid: z.object({
    type: z.enum(['cpm', 'cpv', 'cpa']),
    amount: z.number().positive(),
    maxBid: z.number().positive(),
  }),
  targeting: z.object({
    geo: z.array(z.string()).optional(),
    deviceTypes: z.array(z.string()).optional(),
    apps: z.array(z.string()).optional(),
    contentCategories: z.array(z.string()).optional(),
    dayparting: z.object({
      days: z.array(z.string()),
      startHour: z.number().min(0).max(23),
      endHour: z.number().min(0).max(23),
    }).optional(),
    ageRating: z.array(z.string()).optional(),
  }).optional(),
  creatives: z.array(z.object({
    name: z.string().min(1),
    videoUrl: z.string().url(),
    duration: z.number().positive(),
    clickUrl: z.string().url(),
    mimeType: z.string().optional(),
    bitrate: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    companionAds: z.array(z.object({
      id: z.string(),
      type: z.enum(['static', 'html']),
      content: z.string(),
      clickUrl: z.string(),
      altText: z.string().optional(),
    })).optional(),
  })).min(1),
  pacing: z.object({
    type: z.enum(['even', 'asap', 'frontloaded']),
    dailyPacingPercent: z.number().optional(),
  }),
  frequency: z.object({
    maxImpressions: z.number().int().positive(),
    windowHours: z.number().int().positive(),
  }),
  startDate: z.string().datetime().or(z.string()),
  endDate: z.string().datetime().or(z.string()).optional(),
  status: z.enum(['active', 'paused', 'completed', 'draft']).optional(),
});

const UpdateCampaignSchema = CreateCampaignSchema.partial();

/**
 * GET /api/campaigns
 * List active campaigns (with pagination)
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', sortBy = 'createdAt', sortOrder = 'desc', status } = req.query;

  // For authenticated requests, filter by advertiser
  const advertiserId = (req as AuthenticatedRequest).user?.advertiserId;

  const pagination = {
    page: parseInt(page as string, 10),
    limit: Math.min(parseInt(limit as string, 10), 100),
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
  };

  let result;
  if (advertiserId) {
    result = await campaignService.findByAdvertiser(advertiserId, pagination);
  } else {
    // Return all campaigns (for admin)
    const campaigns = await campaignService.findActiveCampaigns({});
    result = {
      success: true,
      data: campaigns,
      pagination: {
        page: 1,
        limit: campaigns.length,
        total: campaigns.length,
        totalPages: 1,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Filter by status if provided
  if (status) {
    result.data = result.data.filter((c: any) => c.status === status);
  }

  res.json(result);
}));

/**
 * POST /api/campaigns
 * Create CTV campaign
 */
router.post('/', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const parseResult = CreateCampaignSchema.safeParse(req.body);

  if (!parseResult.success) {
    throw new ValidationError(parseResult.error.errors[0].message);
  }

  const data = parseResult.data;
  const advertiserId = req.user?.advertiserId || 'default-advertiser';

  const campaign = await campaignService.create({
    ...data,
    advertiserId,
    startDate: new Date(data.startDate),
    endDate: data.endDate ? new Date(data.endDate) : undefined,
    status: data.status || 'draft',
  });

  res.status(201).json({
    success: true,
    data: campaign,
    message: 'Campaign created successfully',
    timestamp: new Date().toISOString(),
  });
}));

/**
 * GET /api/campaigns/:id
 * Get campaign details
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const campaign = await campaignService.findById(id);

  if (!campaign) {
    throw new NotFoundError('Campaign not found');
  }

  res.json({
    success: true,
    data: campaign,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * PUT /api/campaigns/:id
 * Update campaign
 */
router.put('/:id', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const parseResult = UpdateCampaignSchema.safeParse(req.body);

  if (!parseResult.success) {
    throw new ValidationError(parseResult.error.errors[0].message);
  }

  const data = parseResult.data;

  // Convert date strings to Date objects
  if (data.startDate) {
    data.startDate = new Date(data.startDate as unknown as string) as any;
  }
  if (data.endDate) {
    data.endDate = new Date(data.endDate as unknown as string) as any;
  }

  const campaign = await campaignService.update(id, data);

  if (!campaign) {
    throw new NotFoundError('Campaign not found');
  }

  res.json({
    success: true,
    data: campaign,
    message: 'Campaign updated successfully',
    timestamp: new Date().toISOString(),
  });
}));

/**
 * DELETE /api/campaigns/:id
 * Delete campaign
 */
router.delete('/:id', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const deleted = await campaignService.delete(id);

  if (!deleted) {
    throw new NotFoundError('Campaign not found');
  }

  res.json({
    success: true,
    message: 'Campaign deleted successfully',
    timestamp: new Date().toISOString(),
  });
}));

/**
 * PATCH /api/campaigns/:id/status
 * Update campaign status
 */
router.patch('/:id/status', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'paused', 'completed', 'draft'].includes(status)) {
    throw new ValidationError('Invalid status');
  }

  const campaign = await campaignService.updateStatus(id, status);

  if (!campaign) {
    throw new NotFoundError('Campaign not found');
  }

  res.json({
    success: true,
    data: campaign,
    message: 'Campaign status updated',
    timestamp: new Date().toISOString(),
  });
}));

export default router;