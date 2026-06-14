import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import redditService from '../services/reddit.service';
import logger from '../utils/logger';
import { ApiResponse, CreateCommentRequest } from '../types';

const router = Router();

const extractTenantId = (req: Request): string | null => {
  return req.headers['x-tenant-id'] as string || null;
};

// POST /comments - Create a comment
router.post('/', async (req: Request, res: Response) => {
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

    const commentData: CreateCommentRequest = req.body;

    if (!commentData.subreddit) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_SUBREDDIT',
          message: 'subreddit is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    if (!commentData.parent) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_PARENT',
          message: 'parent (post or comment ID) is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    if (!commentData.text) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_TEXT',
          message: 'text is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    const comment = await redditService.createComment(tenantId, commentData);

    const response: ApiResponse<typeof comment> = {
      success: true,
      data: comment,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Failed to create comment', { error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'CREATE_COMMENT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create comment',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// DELETE /comments/:id - Delete comment
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

    const { id } = req.params;
    await redditService.deleteComment(tenantId, id);

    const response: ApiResponse<{ deleted: boolean }> = {
      success: true,
      data: { deleted: true },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to delete comment', { commentId: req.params.id, error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'DELETE_COMMENT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete comment',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// POST /comments/:id/vote - Vote on comment
router.post('/:id/vote', async (req: Request, res: Response) => {
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
    const { direction } = req.body;

    if (direction === undefined || ![1, 0, -1].includes(direction)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_DIRECTION',
          message: 'direction must be 1, 0, or -1',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    await redditService.vote(tenantId, `t1_${id}`, direction);

    const response: ApiResponse<{ voted: boolean }> = {
      success: true,
      data: { voted: true },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to vote on comment', { commentId: req.params.id, error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VOTE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to vote',
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
