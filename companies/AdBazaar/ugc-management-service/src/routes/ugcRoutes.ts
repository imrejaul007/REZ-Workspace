import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ugcCollectorService, moderationService, rightsService, displayService } from '../services';
import { UGCContent } from '../models';
import { logger } from '../config/logger';

const router = Router();

// Validation schemas
const collectSchema = z.object({
  platforms: z.array(z.enum(['instagram', 'twitter', 'facebook', 'tiktok'])),
  hashtags: z.array(z.string()).min(1),
  campaignId: z.string().optional()
});

const moderateSchema = z.object({
  contentIds: z.array(z.string()).min(1),
  action: z.enum(['approve', 'reject']),
  notes: z.string().optional()
});

const approveSchema = z.object({
  contentId: z.string(),
  notes: z.string().optional()
});

const rejectSchema = z.object({
  contentId: z.string(),
  reason: z.string().optional()
});

const rightsRequestSchema = z.object({
  ugcId: z.string(),
  rightsType: z.enum(['display', 'repost', 'commercial', 'all']),
  usageTerms: z.string().optional(),
  expiresAt: z.string().datetime().optional()
});

const rightsRespondSchema = z.object({
  action: z.enum(['approve', 'deny']),
  notes: z.string().optional()
});

const displaySchema = z.object({
  displayType: z.enum(['wall', 'ticker', 'grid', 'carousel']),
  maxItems: z.number().min(1).max(100).optional().default(20),
  showCaption: z.boolean().optional().default(true),
  showAuthor: z.boolean().optional().default(true),
  showEngagement: z.boolean().optional().default(true),
  autoRotate: z.boolean().optional().default(false),
  rotationInterval: z.number().optional().default(5000),
  filterBy: z.object({
    sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
    minEngagement: z.number().optional(),
    platforms: z.array(z.string()).optional()
  }).optional()
});

// Middleware for async error handling
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * @route POST /api/ugc/collect
 * @desc Collect UGC from platforms
 */
router.post('/collect', asyncHandler(async (req: Request, res: Response) => {
  const { platforms, hashtags, campaignId } = collectSchema.parse(req.body);

  logger.info('UGC collection requested', { platforms, hashtags, campaignId });

  const result = await ugcCollectorService.collectUGC(platforms, hashtags, campaignId);

  res.json({
    success: true,
    data: result
  });
}));

/**
 * @route POST /api/ugc/moderate
 * @desc Moderate content (bulk)
 */
router.post('/moderate', asyncHandler(async (req: Request, res: Response) => {
  const { contentIds, action, notes } = moderateSchema.parse(req.body);
  const moderatedBy = req.headers['x-user-id'] as string || 'system';

  logger.info('Bulk moderation requested', { contentIds, action, moderatedBy });

  const result = await moderationService.bulkModerate(contentIds, action, moderatedBy);

  res.json({
    success: true,
    data: result
  });
}));

/**
 * @route POST /api/ugc/approve
 * @desc Approve UGC content
 */
router.post('/approve', asyncHandler(async (req: Request, res: Response) => {
  const { contentId, notes } = approveSchema.parse(req.body);
  const approvedBy = req.headers['x-user-id'] as string || 'system';

  logger.info('UGC approval requested', { contentId, approvedBy });

  const content = await moderationService.approveContent(contentId, approvedBy, notes);

  res.json({
    success: true,
    data: content
  });
}));

/**
 * @route POST /api/ugc/reject
 * @desc Reject UGC content
 */
router.post('/reject', asyncHandler(async (req: Request, res: Response) => {
  const { contentId, reason } = rejectSchema.parse(req.body);
  const rejectedBy = req.headers['x-user-id'] as string || 'system';

  logger.info('UGC rejection requested', { contentId, rejectedBy });

  const content = await moderationService.rejectContent(contentId, rejectedBy, reason);

  res.json({
    success: true,
    data: content
  });
}));

/**
 * @route GET /api/ugc/approved
 * @desc List approved UGC
 */
router.get('/approved', asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;
  const campaignId = req.query.campaignId as string;

  const query: any = { status: 'approved' };
  if (campaignId) {
    query.campaignId = campaignId;
  }

  const [content, total] = await Promise.all([
    UGCContent.find(query)
      .sort({ approvedAt: -1 })
      .skip(offset)
      .limit(limit),
    UGCContent.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      items: content,
      total,
      limit,
      offset
    }
  });
}));

/**
 * @route GET /api/ugc/pending
 * @desc List pending UGC
 */
router.get('/pending', asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;
  const campaignId = req.query.campaignId as string;

  const query: any = { status: 'pending_review' };
  if (campaignId) {
    query.campaignId = campaignId;
  }

  const [content, total] = await Promise.all([
    UGCContent.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit),
    UGCContent.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      items: content,
      total,
      limit,
      offset
    }
  });
}));

/**
 * @route POST /api/ugc/rights
 * @desc Request rights for UGC
 */
router.post('/rights', asyncHandler(async (req: Request, res: Response) => {
  const { ugcId, rightsType, usageTerms, expiresAt } = rightsRequestSchema.parse(req.body);
  const requestedBy = req.headers['x-user-id'] as string || 'system';

  logger.info('Rights requested', { ugcId, rightsType, requestedBy });

  const rights = await rightsService.requestRights(
    ugcId,
    requestedBy,
    rightsType,
    usageTerms,
    expiresAt ? new Date(expiresAt) : undefined
  );

  res.json({
    success: true,
    data: rights
  });
}));

/**
 * @route POST /api/ugc/rights/:id/respond
 * @desc Respond to rights request
 */
router.post('/rights/:id/respond', asyncHandler(async (req: Request, res: Response) => {
  const { action, notes } = rightsRespondSchema.parse(req.body);
  const rightsId = req.params.id;
  const respondedBy = req.headers['x-user-id'] as string || 'system';

  logger.info('Rights response requested', { rightsId, action, respondedBy });

  const rights = await rightsService.respondToRights(rightsId, action, respondedBy, notes);

  res.json({
    success: true,
    data: rights
  });
}));

/**
 * @route GET /api/ugc/rights
 * @desc List rights requests
 */
router.get('/rights', asyncHandler(async (req: Request, res: Response) => {
  const status = req.query.status as any;
  const rightsType = req.query.rightsType as any;
  const requestedBy = req.query.requestedBy as string;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  const result = await rightsService.listRights({
    status,
    rightsType,
    requestedBy,
    limit,
    offset
  });

  res.json({
    success: true,
    data: result
  });
}));

/**
 * @route POST /api/ugc/display
 * @desc Generate display embed
 */
router.post('/display', asyncHandler(async (req: Request, res: Response) => {
  const { campaignId, ...config } = {
    ...displaySchema.parse(req.body),
    campaignId: req.query.campaignId as string
  };

  if (!campaignId) {
    res.status(400).json({ success: false, error: 'campaignId is required' });
    return;
  }

  logger.info('Display embed requested', { campaignId, config });

  const embed = await displayService.generateDisplayEmbed(campaignId, config);

  res.json({
    success: true,
    data: embed
  });
}));

/**
 * @route GET /api/ugc/embed/:campaignId
 * @desc Get embed HTML for campaign
 */
router.get('/embed/:campaignId', asyncHandler(async (req: Request, res: Response) => {
  const { campaignId } = req.params;
  const displayType = (req.query.type as any) || 'grid';
  const theme = (req.query.theme as any) || 'light';

  const embedCode = await displayService.generateEmbedCode(campaignId, displayType, {
    theme
  });

  res.type('html').send(embedCode);
}));

/**
 * @route GET /api/ugc/feed/:campaignId
 * @desc Get JSON feed for campaign
 */
router.get('/feed/:campaignId', asyncHandler(async (req: Request, res: Response) => {
  const { campaignId } = req.params;
  const limit = parseInt(req.query.limit as string) || 50;

  const feed = await displayService.generateJSONFeed(campaignId, limit);

  res.json({
    success: true,
    data: feed
  });
}));

/**
 * @route GET /api/ugc/:id
 * @desc Get single UGC content
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const content = await UGCContent.findById(req.params.id);

  if (!content) {
    res.status(404).json({ success: false, error: 'Content not found' });
    return;
  }

  res.json({
    success: true,
    data: content
  });
}));

/**
 * @route DELETE /api/ugc/:id
 * @desc Delete UGC content
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const content = await UGCContent.findByIdAndDelete(req.params.id);

  if (!content) {
    res.status(404).json({ success: false, error: 'Content not found' });
    return;
  }

  logger.info('UGC deleted', { id: req.params.id });

  res.json({
    success: true,
    message: 'Content deleted successfully'
  });
}));

export default router;