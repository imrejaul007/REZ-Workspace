import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import redditService from '../services/reddit.service';
import logger from '../utils/logger';
import { ApiResponse } from '../types';

const router = Router();

const extractTenantId = (req: Request): string | null => {
  return req.headers['x-tenant-id'] as string || null;
};

// GET /subreddits - Get subscribed subreddits
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

    const subreddits = await redditService.getSubscribedSubreddits(tenantId);

    const response: ApiResponse<typeof subreddits> = {
      success: true,
      data: subreddits,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get subreddits', { error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'GET_SUBREDDITS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get subreddits',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// GET /subreddits/search - Search subreddits
router.get('/search', async (req: Request, res: Response) => {
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

    const { q } = req.query;

    if (!q) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_QUERY',
          message: 'q (search query) is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    const subreddits = await redditService.searchSubreddits(tenantId, q as string);

    const response: ApiResponse<typeof subreddits> = {
      success: true,
      data: subreddits,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to search subreddits', { error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to search subreddits',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// GET /subreddits/:name - Get subreddit info
router.get('/:name', async (req: Request, res: Response) => {
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

    const { name } = req.params;
    const subreddit = await redditService.getSubreddit(tenantId, name);

    const response: ApiResponse<typeof subreddit> = {
      success: true,
      data: subreddit,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get subreddit', { name: req.params.name, error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'GET_SUBREDDIT_ERROR',
        message: error instanceof Error ? error.message : 'Subreddit not found',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(error instanceof Error && error.message === 'Subreddit not found' ? 404 : 500).json(response);
  }
});

// POST /subreddits/:name/subscribe - Subscribe to subreddit
router.post('/:name/subscribe', async (req: Request, res: Response) => {
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

    const { name } = req.params;
    await redditService.subscribe(tenantId, name, 'sub');

    const response: ApiResponse<{ subscribed: boolean }> = {
      success: true,
      data: { subscribed: true },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to subscribe', { name: req.params.name, error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'SUBSCRIBE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to subscribe',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// DELETE /subreddits/:name/subscribe - Unsubscribe from subreddit
router.delete('/:name/subscribe', async (req: Request, res: Response) => {
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

    const { name } = req.params;
    await redditService.subscribe(tenantId, name, 'unsub');

    const response: ApiResponse<{ subscribed: boolean }> = {
      success: true,
      data: { subscribed: false },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to unsubscribe', { name: req.params.name, error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'UNSUBSCRIBE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to unsubscribe',
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
