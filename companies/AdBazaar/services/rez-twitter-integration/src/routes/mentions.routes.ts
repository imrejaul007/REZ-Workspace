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

// GET /mentions - Get mentions
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

    const { maxResults, startTime, endTime, paginationToken } = req.query;

    const result = await twitterService.getMentions(tenantId, {
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
    logger.error('Failed to get mentions', { error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'GET_MENTIONS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get mentions',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// GET /mentions/replies/:tweetId - Get replies to a tweet
router.get('/replies/:tweetId', async (req: Request, res: Response) => {
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

    const { tweetId } = req.params;
    const replies = await twitterService.getReplies(tenantId, tweetId);

    const response: ApiResponse<typeof replies> = {
      success: true,
      data: replies,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get replies', { tweetId: req.params.tweetId, error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'GET_REPLIES_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get replies',
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
