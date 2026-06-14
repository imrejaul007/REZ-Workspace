import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import twitterService from '../services/twitter.service';
import logger from '../utils/logger';
import { ApiResponse } from '../types';
import {
  userIdParamsSchema,
  followUserSchema,
} from '../utils/validation';
import { ZodError } from 'zod';

const router = Router();

// Middleware to extract tenant ID
const extractTenantId = (req: Request): string | null => {
  return req.headers['x-tenant-id'] as string || null;
};

// GET /users/me - Get current authenticated user
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
        code: 'GET_USER_ERROR',
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

// GET /users/:id - Get user by ID
router.get('/:id', async (req: Request, res: Response) => {
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
      userIdParamsSchema.parse({ id: req.params.id });
    } catch (e) {
      const zodError = e as ZodError;
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: zodError.errors[0]?.message || 'Invalid user ID',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    const user = await twitterService.getUserById(tenantId, req.params.id);

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
    logger.error('Failed to get user', { userId: req.params.id, error });
    const errorMessage = error instanceof Error ? error.message : 'Failed to get user';

    if (errorMessage === 'User not found') {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: errorMessage,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'GET_USER_ERROR',
        message: errorMessage,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// GET /users/:id/followers - Get user's followers
router.get('/:id/followers', async (req: Request, res: Response) => {
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

    const result = await twitterService.getFollowers(tenantId, req.params.id, {
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
    logger.error('Failed to get followers', { userId: req.params.id, error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'GET_FOLLOWERS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get followers',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// GET /users/:id/following - Get users that this user follows
router.get('/:id/following', async (req: Request, res: Response) => {
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

    const result = await twitterService.getFollowing(tenantId, req.params.id, {
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
    logger.error('Failed to get following', { userId: req.params.id, error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'GET_FOLLOWING_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get following users',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// POST /users/:id/follow - Follow a user
router.post('/:id/follow', async (req: Request, res: Response) => {
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

    // Validate body
    try {
      followUserSchema.parse({ targetUserId: req.params.id });
    } catch (e) {
      const zodError = e as ZodError;
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: zodError.errors[0]?.message || 'Invalid request',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    await twitterService.followUser(tenantId, req.params.id);

    const response: ApiResponse<{ following: boolean }> = {
      success: true,
      data: { following: true },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to follow user', { targetUserId: req.params.id, error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'FOLLOW_ERROR',
        message: error instanceof Error ? error.message : 'Failed to follow user',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// DELETE /users/:id/follow - Unfollow a user
router.delete('/:id/follow', async (req: Request, res: Response) => {
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

    try {
      followUserSchema.parse({ targetUserId: req.params.id });
    } catch (e) {
      const zodError = e as ZodError;
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: zodError.errors[0]?.message || 'Invalid request',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    await twitterService.unfollowUser(tenantId, req.params.id);

    const response: ApiResponse<{ following: boolean }> = {
      success: true,
      data: { following: false },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to unfollow user', { targetUserId: req.params.id, error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'UNFOLLOW_ERROR',
        message: error instanceof Error ? error.message : 'Failed to unfollow user',
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
