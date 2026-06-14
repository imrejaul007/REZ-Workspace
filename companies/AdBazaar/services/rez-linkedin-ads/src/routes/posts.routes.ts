import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import linkedInService from '../services/linkedin.service';
import logger from '../utils/logger';
import { validateBody, requireTenantId } from '../middleware/validation.middleware';
import { PostRequestSchema } from '../validators/linkedin.schemas';
import { PostRequest, ApiResponse } from '../types';

const router = Router();

// Apply tenant ID requirement to all routes
router.use(requireTenantId());

/**
 * POST /posts - Create a post on personal profile
 */
router.post(
  '/',
  validateBody(PostRequestSchema),
  async (req: Request, res: Response) => {
    const requestId = uuidv4();
    const tenantId = req.headers['x-tenant-id'] as string;

    try {
      // Check if rate limited
      if (linkedInService.isRateLimited(tenantId)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please try again later.',
            details: {
              retryAfter: linkedInService.getRateLimitReset(tenantId),
            },
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        };
        return res.status(429).json(response);
      }

      const postData: PostRequest = req.body;
      const post = await linkedInService.createPost(tenantId, postData);

      logger.info('Post created successfully', { postId: post.id, tenantId, requestId });

      const response: ApiResponse<typeof post> = {
        success: true,
        data: post,
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Failed to create post', {
        error: error instanceof Error ? error.message : String(error),
        tenantId,
        requestId,
      });

      const response: ApiResponse = {
        success: false,
        error: {
          code: 'CREATE_POST_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create post',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      };

      // Map error to appropriate status code
      const statusCode = error instanceof Error
        ? error.message.includes('unauthorized') ? 401
        : error.message.includes('rate limit') ? 429
        : 500
        : 500;

      res.status(statusCode).json(response);
    }
  }
);

/**
 * POST /posts/organization/:organizationId - Create post on organization page
 */
router.post(
  '/organization/:organizationId',
  validateBody(PostRequestSchema),
  async (req: Request, res: Response) => {
    const requestId = uuidv4();
    const tenantId = req.headers['x-tenant-id'] as string;

    try {
      const { organizationId } = req.params;
      const postData: PostRequest = req.body;

      // Validate organization ID format
      if (!organizationId || !/^\d+$/.test(organizationId)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'INVALID_ORG_ID',
            message: 'Invalid organization ID format',
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        };
        return res.status(400).json(response);
      }

      const post = await linkedInService.createOrganizationPost(tenantId, organizationId, postData);

      logger.info('Organization post created successfully', {
        postId: post.id,
        organizationId,
        tenantId,
        requestId,
      });

      const response: ApiResponse<typeof post> = {
        success: true,
        data: post,
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Failed to create organization post', {
        error: error instanceof Error ? error.message : String(error),
        tenantId,
        requestId,
      });

      const response: ApiResponse = {
        success: false,
        error: {
          code: 'CREATE_ORG_POST_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create organization post',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      };

      res.status(500).json(response);
    }
  }
);

/**
 * POST /posts/image - Upload an image for posts
 */
router.post('/image', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const tenantId = req.headers['x-tenant-id'] as string;

  try {
    const { imageData, organizationId } = req.body;

    if (!imageData) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_IMAGE',
          message: 'Image data is required (base64 encoded)',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      };
      return res.status(400).json(response);
    }

    // Decode base64 image data
    const imageBuffer = Buffer.from(imageData, 'base64');

    // Validate image size (max 5MB)
    if (imageBuffer.length > 5 * 1024 * 1024) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'IMAGE_TOO_LARGE',
          message: 'Image size must be less than 5MB',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      };
      return res.status(400).json(response);
    }

    let assetUrn: string;

    if (organizationId) {
      assetUrn = await linkedInService.uploadOrganizationImage(tenantId, organizationId, imageBuffer);
    } else {
      assetUrn = await linkedInService.uploadImage(tenantId, imageBuffer, 'post-image');
    }

    logger.info('Image uploaded successfully', { assetUrn, tenantId, requestId });

    const response: ApiResponse<{ assetUrn: string }> = {
      success: true,
      data: { assetUrn },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Failed to upload image', {
      error: error instanceof Error ? error.message : String(error),
      tenantId,
      requestId,
    });

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'UPLOAD_IMAGE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to upload image',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    res.status(500).json(response);
  }
});

/**
 * GET /posts/:id - Get post by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const tenantId = req.headers['x-tenant-id'] as string;

  try {
    const { id } = req.params;

    const post = await linkedInService.getPost(tenantId, id);

    const response: ApiResponse<typeof post> = {
      success: true,
      data: post,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get post', {
      postId: req.params.id,
      error: error instanceof Error ? error.message : String(error),
      tenantId,
      requestId,
    });

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'GET_POST_ERROR',
        message: error instanceof Error ? error.message : 'Post not found',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json(response);
  }
});

/**
 * DELETE /posts/:id - Delete post
 */
router.delete('/:id', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const tenantId = req.headers['x-tenant-id'] as string;

  try {
    const { id } = req.params;
    await linkedInService.deletePost(tenantId, id);

    logger.info('Post deleted successfully', { postId: id, tenantId, requestId });

    const response: ApiResponse<{ deleted: boolean }> = {
      success: true,
      data: { deleted: true },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to delete post', {
      postId: req.params.id,
      error: error instanceof Error ? error.message : String(error),
      tenantId,
      requestId,
    });

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'DELETE_POST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete post',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    res.status(500).json(response);
  }
});

export default router;
