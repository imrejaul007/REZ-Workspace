import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import twitterService from '../services/twitter.service';
import logger from '../utils/logger';
import { ApiResponse } from '../types';

const router = Router();

// Middleware to extract tenant ID
const extractTenantId = (req: Request): string | null => {
  return req.headers['x-tenant-id'] as string || null;
};

// GET /search/tweets - Search tweets
router.get('/tweets', async (req: Request, res: Response) => {
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

    const { q, maxResults, startTime, endTime, paginationToken } = req.query;

    if (!q) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_QUERY',
          message: 'Search query (q) is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    const result = await twitterService.searchTweets(tenantId, q as string, {
      maxResults: maxResults ? parseInt(maxResults as string, 10) : undefined,
      startTime: startTime as string | undefined,
      endTime: endTime as string | undefined,
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
    logger.error('Failed to search tweets', { error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to search tweets',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// GET /search/users - Search users
router.get('/users', async (req: Request, res: Response) => {
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

    const { id } = req.query;

    if (!id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_USER_ID',
          message: 'User ID is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    const user = await twitterService.getUserById(tenantId, id as string);

    const response: ApiResponse<typeof user> = {
      success: true,
      data: user,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get user', { userId: req.query.id, error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'USER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get user',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(error instanceof Error && error.message === 'User not found' ? 404 : 500).json(response);
  }
});

// GET /search/me - Get current user
router.get('/me', async (req: Request, res: Response) => {
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

    const user = await twitterService.getCurrentUser(tenantId);

    const response: ApiResponse<typeof user> = {
      success: true,
      data: user,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get current user', { error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'USER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get current user',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// GET /search/users/:id/tweets - Get user's tweets
router.get('/users/:id/tweets', async (req: Request, res: Response) => {
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

    const { id } = req.params;
    const { maxResults, startTime, endTime, paginationToken } = req.query;

    const result = await twitterService.getUserTweets(tenantId, id, {
      maxResults: maxResults ? parseInt(maxResults as string, 10) : undefined,
      startTime: startTime as string | undefined,
      endTime: endTime as string | undefined,
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
    logger.error('Failed to get user tweets', { userId: req.params.id, error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'USER_TWEETS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get user tweets',
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
