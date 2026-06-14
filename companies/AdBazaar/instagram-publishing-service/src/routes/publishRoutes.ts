import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { publishingService } from '../services/index.js';
import { asyncHandler, ValidationError } from '../middleware/index.js';
import logger from 'utils/logger.js';

const router = Router();

// Validation schemas
const publishContentSchema = z.object({
  accountId: z.string().min(1, 'Account ID is required'),
  contentType: z.enum(['feed_image', 'feed_album', 'feed_video', 'reel', 'story']),
  mediaUrl: z.string().url().optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  caption: z.string().max(2200).optional(),
  hashtags: z.array(z.string()).max(30).optional(),
  location: z.object({
    id: z.string(),
    name: z.string(),
  }).optional(),
  userTags: z.array(z.string()).optional(),
  productTags: z.array(z.object({
    productId: z.string(),
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
  })).optional(),
  storyConfig: z.object({
    type: z.enum(['image', 'video', 'poll', 'question', 'link']),
    pollQuestion: z.string().optional(),
    pollOptions: z.array(z.string()).optional(),
    question: z.string().optional(),
    linkUrl: z.string().url().optional(),
    stickerElements: z.array(z.unknown()).optional(),
  }).optional(),
  firstComment: z.string().max(300).optional(),
});

const scheduleContentSchema = publishContentSchema.extend({
  scheduledTime: z.string().datetime().or(z.date()),
});

/**
 * POST /api/publish
 * Publish content immediately
 */
router.post('/',
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = publishContentSchema.safeParse(req.body);
    if (!validatedData.success) {
      throw new ValidationError('Invalid request body',
        validatedData.error.errors.reduce((acc, err) => {
          acc[err.path.join('.')] = err.message;
          return acc;
        }, {} as Record<string, string>)
      );
    }

    const result = await publishingService.publishContent(validatedData.data);

    if (!result.success) {
      res.status(500).json({
        success: false,
        error: result.error,
        publishRequestId: result.publishRequestId,
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        publishRequestId: result.publishRequestId,
        publishedContentId: result.publishedContentId,
        instagramMediaId: result.instagramMediaId,
        instagramPermalink: result.instagramPermalink,
      },
    });
  })
);

/**
 * POST /api/publish/schedule
 * Schedule content for future publishing
 */
router.post('/schedule',
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = scheduleContentSchema.safeParse(req.body);
    if (!validatedData.success) {
      throw new ValidationError('Invalid request body',
        validatedData.error.errors.reduce((acc, err) => {
          acc[err.path.join('.')] = err.message;
          return acc;
        }, {} as Record<string, string>)
      );
    }

    // Validate scheduled time
    const scheduledTime = new Date(validatedData.data.scheduledTime as unknown as string);
    if (scheduledTime <= new Date()) {
      throw new ValidationError('Scheduled time must be in the future');
    }

    const result = await publishingService.scheduleContent({
      ...validatedData.data,
      scheduledTime,
    });

    res.status(201).json({
      success: true,
      data: {
        scheduleId: result.scheduleId,
        scheduledTime,
      },
    });
  })
);

/**
 * POST /api/publish/draft
 * Save content as draft
 */
router.post('/draft',
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = publishContentSchema.omit({
      firstComment: true,
    }).safeParse(req.body);

    if (!validatedData.success) {
      throw new ValidationError('Invalid request body',
        validatedData.error.errors.reduce((acc, err) => {
          acc[err.path.join('.')] = err.message;
          return acc;
        }, {} as Record<string, string>)
      );
    }

    const result = await publishingService.saveDraft(validatedData.data);

    res.status(201).json({
      success: true,
      data: {
        draftId: result.draftId,
      },
    });
  })
);

/**
 * GET /api/publish/drafts
 * Get all drafts
 */
router.get('/drafts',
  asyncHandler(async (req: Request, res: Response) => {
    const { accountId } = req.query;

    if (!accountId || typeof accountId !== 'string') {
      throw new ValidationError('accountId query parameter is required');
    }

    const drafts = await publishingService.getDrafts(accountId);

    res.json({
      success: true,
      data: {
        drafts,
        count: (drafts as unknown[]).length,
      },
    });
  })
);

/**
 * GET /api/content/:id
 * Get content by ID
 */
router.get('/content/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const content = await publishingService.getContent(id);

    res.json({
      success: true,
      data: content,
    });
  })
);

/**
 * DELETE /api/content/:id
 * Delete content
 */
router.delete('/content/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await publishingService.deleteContent(id);

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * GET /api/accounts/:id/content
 * Get all content for an account
 */
router.get('/accounts/:id/content',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { page, limit, contentType } = req.query;

    const result = await publishingService.getAccountContent(id, {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      contentType: contentType as string | undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * PUT /api/content/:id/metrics
 * Update content metrics from Instagram
 */
router.put('/content/:id/metrics',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await publishingService.updateMetrics(id);

    res.json({
      success: true,
      message: 'Metrics updated',
    });
  })
);

export default router;