import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { accountService } from '../services/index.js';
import { asyncHandler, ValidationError } from '../middleware/index.js';
import logger from 'utils/logger.js';

const router = Router();

// Validation schemas
const connectAccountSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  pageId: z.string().optional(),
});

/**
 * GET /api/accounts
 * List all connected Instagram accounts
 */
router.get('/',
  asyncHandler(async (req: Request, res: Response) => {
    const accounts = await accountService.getAccounts();

    res.json({
      success: true,
      data: {
        accounts,
        count: (accounts as unknown[]).length,
      },
    });
  })
);

/**
 * GET /api/accounts/:id
 * Get account details
 */
router.get('/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const account = await accountService.getAccount(id);

    res.json({
      success: true,
      data: account,
    });
  })
);

/**
 * POST /api/accounts/:id/connect
 * Connect an Instagram Business account
 */
router.post('/:id/connect',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const validatedData = connectAccountSchema.safeParse(req.body);
    if (!validatedData.success) {
      throw new ValidationError('Invalid request body',
        validatedData.error.errors.reduce((acc, err) => {
          acc[err.path.join('.')] = err.message;
          return acc;
        }, {} as Record<string, string>)
      );
    }

    const result = await accountService.connectAccount({
      accountId: id,
      accessToken: validatedData.data.accessToken,
      pageId: validatedData.data.pageId,
    });

    res.status(201).json({
      success: true,
      data: {
        accountId: result.accountId,
        success: result.success,
      },
    });
  })
);

/**
 * POST /api/accounts/:id/disconnect
 * Disconnect an Instagram account
 */
router.post('/:id/disconnect',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await accountService.disconnectAccount(id);

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * POST /api/accounts/:id/sync
 * Sync account data from Instagram
 */
router.post('/:id/sync',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await accountService.syncAccount(id);

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
router.get('/:id/content',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { page, limit, contentType } = req.query;

    // This route is handled by publishRoutes
    // This is just for documentation purposes
    res.json({
      success: true,
      message: 'Use GET /api/accounts/:id/content via publish routes',
    });
  })
);

/**
 * GET /api/accounts/:id/stats
 * Get account statistics
 */
router.get('/:id/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const account = await accountService.getAccount(id) as { instagramId?: string };
    if (!account) {
      throw new ValidationError('Account not found');
    }

    // Get recent content for stats
    const { publishingService } = await import('../services/index.js');
    const content = await publishingService.getAccountContent(id, { limit: 100 });

    // Calculate stats
    const totalPosts = content.total;
    const totalLikes = (content.content as Array<{ metrics?: { likes: number } }>)
      .reduce((sum, c) => sum + (c.metrics?.likes || 0), 0);
    const totalComments = (content.content as Array<{ metrics?: { comments: number } }>)
      .reduce((sum, c) => sum + (c.metrics?.comments || 0), 0);
    const totalSaves = (content.content as Array<{ metrics?: { saves: number } }>)
      .reduce((sum, c) => sum + (c.metrics?.saves || 0), 0);

    res.json({
      success: true,
      data: {
        accountId: id,
        totalPosts,
        totalLikes,
        totalComments,
        totalSaves,
        avgLikes: totalPosts > 0 ? Math.round(totalLikes / totalPosts) : 0,
        avgComments: totalPosts > 0 ? Math.round(totalComments / totalPosts) : 0,
        avgSaves: totalPosts > 0 ? Math.round(totalSaves / totalPosts) : 0,
      },
    });
  })
);

export default router;