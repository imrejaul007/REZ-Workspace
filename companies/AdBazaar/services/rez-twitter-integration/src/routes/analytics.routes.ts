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

// GET /analytics/tweet/:id - Get analytics for a specific tweet
router.get('/tweet/:id', async (req: Request, res: Response) => {
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
    const analytics = await twitterService.getTweetAnalytics(tenantId, id);

    const response: ApiResponse<typeof analytics> = {
      success: true,
      data: analytics,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get tweet analytics', { tweetId: req.params.id, error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'ANALYTICS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get tweet analytics',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// POST /analytics/tweets/batch - Get analytics for multiple tweets
router.post('/tweets/batch', async (req: Request, res: Response) => {
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

    const { tweetIds } = req.body;

    if (!tweetIds || !Array.isArray(tweetIds) || tweetIds.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'tweetIds array is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    const analytics = await twitterService.getMultipleTweetsAnalytics(tenantId, tweetIds);

    const response: ApiResponse<typeof analytics> = {
      success: true,
      data: analytics,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get batch analytics', { error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'BATCH_ANALYTICS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get batch analytics',
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
