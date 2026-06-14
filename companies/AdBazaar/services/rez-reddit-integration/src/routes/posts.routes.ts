import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import redditService from '../services/reddit.service';
import logger from '../utils/logger';
import { ApiResponse, CreatePostRequest } from '../types';

const router = Router();

const extractTenantId = (req: Request): string | null => {
  return req.headers['x-tenant-id'] as string || null;
};

// POST /posts - Create a post
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

    const postData: CreatePostRequest = req.body;

    if (!postData.subreddit) {
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

    if (!postData.title) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_TITLE',
          message: 'title is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    if (!postData.text && !postData.url) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_CONTENT',
          message: 'Either text or url is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    const post = await redditService.createPost(tenantId, postData);

    const response: ApiResponse<typeof post> = {
      success: true,
      data: post,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Failed to create post', { error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'CREATE_POST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create post',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// GET /posts/:id - Get post by ID
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

    const { id } = req.params;
    const { subreddit } = req.query;

    const post = await redditService.getPost(tenantId, id, subreddit as string | undefined);

    const response: ApiResponse<typeof post> = {
      success: true,
      data: post,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get post', { postId: req.params.id, error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'GET_POST_ERROR',
        message: error instanceof Error ? error.message : 'Post not found',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(error instanceof Error && error.message === 'Post not found' ? 404 : 500).json(response);
  }
});

// PATCH /posts/:id - Edit post
router.patch('/:id', async (req: Request, res: Response) => {
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
    const { text } = req.body;

    if (!text) {
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

    const post = await redditService.editPost(tenantId, id, text);

    const response: ApiResponse<typeof post> = {
      success: true,
      data: post,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to edit post', { postId: req.params.id, error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'EDIT_POST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to edit post',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// DELETE /posts/:id - Delete post
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
    await redditService.deletePost(tenantId, id);

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
    logger.error('Failed to delete post', { postId: req.params.id, error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'DELETE_POST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete post',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// GET /posts/:id/comments - Get comments for a post
router.get('/:id/comments', async (req: Request, res: Response) => {
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
    const { subreddit, limit, depth } = req.query;

    const comments = await redditService.getPostComments(tenantId, id, subreddit as string | undefined, {
      limit: limit ? parseInt(limit as string, 10) : undefined,
      depth: depth ? parseInt(depth as string, 10) : undefined,
    });

    const response: ApiResponse<typeof comments> = {
      success: true,
      data: comments,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get comments', { postId: req.params.id, error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'GET_COMMENTS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get comments',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// POST /posts/:id/vote - Vote on post
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
    const { direction } = req.body; // 1 = upvote, 0 = neutral, -1 = downvote

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

    await redditService.vote(tenantId, `t3_${id}`, direction);

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
    logger.error('Failed to vote', { postId: req.params.id, error });
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

// POST /posts/:id/save - Save post
router.post('/:id/save', async (req: Request, res: Response) => {
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
    const { category } = req.body;

    await redditService.save(tenantId, `t3_${id}`, category);

    const response: ApiResponse<{ saved: boolean }> = {
      success: true,
      data: { saved: true },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to save post', { postId: req.params.id, error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'SAVE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to save post',
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
