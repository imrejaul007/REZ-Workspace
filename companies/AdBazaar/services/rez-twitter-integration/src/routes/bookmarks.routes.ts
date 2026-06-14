import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import twitterService from '../services/twitter.service';
import logger from '../utils/logger';
import { ApiResponse } from '../types';
import { tweetIdParamsSchema } from '../utils/validation';
import { ZodError } from 'zod';

const router = Router();

// Middleware to extract tenant ID
const extractTenantId = (req: Request): string | null => {
  return req.headers['x-tenant-id'] as string || null;
};

// GET /bookmarks - Get all bookmarked tweets
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = extractTenantId(req);

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_TENANT_ID',
          message: 'X-Tenant-ID header is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    const { maxResults, paginationToken } = req.query;

    const result = await twitterService.getBookmarks(tenantId, {
      maxResults: maxResults ? parseInt(maxResults as string, 10) : undefined,
      paginationToken: paginationToken as string | undefined,
    });

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get bookmarks', { error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'GET_BOOKMARKS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get bookmarks',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// POST /bookmarks/:id - Add tweet to bookmarks
router.post('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = extractTenantId(req);

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_TENANT_ID',
          message: 'X-Tenant-ID header is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    // Validate params
    try {
      tweetIdParamsSchema.parse({ id: req.params.id });
    } catch (e) {
      const zodError = e as ZodError;
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: zodError.errors[0]?.message || 'Invalid tweet ID',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    await twitterService.bookmarkTweet(tenantId, req.params.id);

    const response: ApiResponse<{ bookmarked: boolean }> = {
      success: true,
      data: { bookmarked: true },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Failed to bookmark tweet', { tweetId: req.params.id, error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'BOOKMARK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to bookmark tweet',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// DELETE /bookmarks/:id - Remove tweet from bookmarks
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = extractTenantId(req);

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_TENANT_ID',
          message: 'X-Tenant-ID header is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    // Validate params
    try {
      tweetIdParamsSchema.parse({ id: req.params.id });
    } catch (e) {
      const zodError = e as ZodError;
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: zodError.errors[0]?.message || 'Invalid tweet ID',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    await twitterService.removeBookmark(tenantId, req.params.id);

    const response: ApiResponse<{ removed: boolean }> = {
      success: true,
      data: { removed: true },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to remove bookmark', { tweetId: req.params.id, error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'REMOVE_BOOKMARK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to remove bookmark',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

export default router;
