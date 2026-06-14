import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import redditService from '../services/reddit.service';
import logger from '../utils/logger';
import { ApiResponse } from '../types';

const router = Router();

const extractTenantId = (req: Request): string | null => {
  return req.headers['x-tenant-id'] as string || null;
};

// GET /users/me - Get current user
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

    const user = await redditService.getCurrentUser(tenantId);

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
        code: 'GET_USER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get user',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// GET /users/me/karma - Get user karma breakdown
router.get('/me/karma', async (req: Request, res: Response) => {
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

    const karma = await redditService.getUserKarma(tenantId);

    const response: ApiResponse<typeof karma> = {
      success: true,
      data: karma,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get karma', { error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'KARMA_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get karma',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// GET /users/:username - Get user by username
router.get('/:username', async (req: Request, res: Response) => {
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

    const { username } = req.params;
    const user = await redditService.getUser(tenantId, username);

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
    logger.error('Failed to get user', { username: req.params.username, error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'GET_USER_ERROR',
        message: error instanceof Error ? error.message : 'User not found',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(error instanceof Error && error.message === 'User not found' ? 404 : 500).json(response);
  }
});

export default router;
