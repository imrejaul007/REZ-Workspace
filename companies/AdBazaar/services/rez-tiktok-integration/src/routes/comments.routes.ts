import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ZodError } from 'zod';
import tiktokService from '../services/tiktok.service';
import logger from '../utils/logger';
import { ApiResponse, CommentRequestSchema, PaginationQuerySchema } from '../types';

const router = Router();

// Helper to extract tenant ID
const extractTenantId = (req: Request): string | null => {
  return req.headers['x-tenant-id'] as string || null;
};

// Helper to create error response
const createErrorResponse = (
  code: string,
  message: string,
  requestId: string,
  details?: unknown
): ApiResponse => ({
  success: false,
  error: { code, message, details },
  meta: {
    timestamp: new Date().toISOString(),
    requestId,
  },
});

// Helper to create success response
const createSuccessResponse = <T>(
  data: T,
  requestId: string
): ApiResponse<T> => ({
  success: true,
  data,
  meta: {
    timestamp: new Date().toISOString(),
    requestId,
  },
});

// ==========================================
// Comment Routes
// ==========================================

/**
 * GET /comments/:videoId
 * Get comments for a video
 *
 * Params:
 * - videoId: string (required)
 *
 * Query params:
 * - maxCount: number (1-100, default 20)
 * - cursor: string (pagination cursor)
 */
router.get('/:videoId', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const tenantId = extractTenantId(req);

  if (!tenantId) {
    return res.status(400).json(
      createErrorResponse('MISSING_TENANT_ID', 'X-Tenant-ID header is required', requestId)
    );
  }

  const { videoId } = req.params;

  if (!videoId) {
    return res.status(400).json(
      createErrorResponse('MISSING_VIDEO_ID', 'Video ID is required', requestId)
    );
  }

  try {
    // Validate query params
    const validatedQuery = PaginationQuerySchema.parse(req.query);

    const result = await tiktokService.getComments(tenantId, videoId, {
      maxCount: validatedQuery.maxCount,
      cursor: validatedQuery.cursor,
    });

    res.json(createSuccessResponse(result, requestId));
  } catch (error) {
    if (error instanceof ZodError) {
      logger.warn('Invalid query params', {
        errors: error.errors,
        videoId,
        tenantId,
        requestId,
      });
      return res.status(400).json(
        createErrorResponse(
          'VALIDATION_ERROR',
          'Invalid query parameters',
          requestId,
          error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message,
          }))
        )
      );
    }

    logger.error('Failed to get comments', { videoId, error, tenantId, requestId });
    res.status(500).json(
      createErrorResponse('GET_COMMENTS_ERROR', 'Failed to get comments', requestId)
    );
  }
});

/**
 * POST /comments/:videoId
 * Post a comment on a video
 *
 * Params:
 * - videoId: string (required)
 *
 * Body:
 * - text: string (required, max 2200 chars)
 */
router.post('/:videoId', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const tenantId = extractTenantId(req);

  if (!tenantId) {
    return res.status(400).json(
      createErrorResponse('MISSING_TENANT_ID', 'X-Tenant-ID header is required', requestId)
    );
  }

  const { videoId } = req.params;

  if (!videoId) {
    return res.status(400).json(
      createErrorResponse('MISSING_VIDEO_ID', 'Video ID is required', requestId)
    );
  }

  try {
    // Validate request body
    const validatedData = CommentRequestSchema.parse(req.body);

    const comment = await tiktokService.postComment(tenantId, videoId, validatedData.text);

    logger.info('Comment posted', { videoId, commentId: comment.id, tenantId, requestId });

    res.status(201).json(createSuccessResponse(comment, requestId));
  } catch (error) {
    if (error instanceof ZodError) {
      logger.warn('Invalid comment request', {
        errors: error.errors,
        videoId,
        tenantId,
        requestId,
      });
      return res.status(400).json(
        createErrorResponse(
          'VALIDATION_ERROR',
          'Invalid request data',
          requestId,
          error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message,
          }))
        )
      );
    }

    logger.error('Failed to post comment', { videoId, error, tenantId, requestId });
    res.status(500).json(
      createErrorResponse('POST_COMMENT_ERROR', 'Failed to post comment', requestId)
    );
  }
});

/**
 * POST /comments/:videoId/:commentId/reply
 * Reply to a comment
 *
 * Params:
 * - videoId: string (required)
 * - commentId: string (required)
 *
 * Body:
 * - text: string (required, max 2200 chars)
 */
router.post('/:videoId/:commentId/reply', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const tenantId = extractTenantId(req);

  if (!tenantId) {
    return res.status(400).json(
      createErrorResponse('MISSING_TENANT_ID', 'X-Tenant-ID header is required', requestId)
    );
  }

  const { videoId, commentId } = req.params;

  if (!videoId || !commentId) {
    return res.status(400).json(
      createErrorResponse(
        'MISSING_PARAMS',
        'Video ID and Comment ID are required',
        requestId
      )
    );
  }

  try {
    // Validate request body
    const validatedData = CommentRequestSchema.parse(req.body);

    const comment = await tiktokService.replyToComment(
      tenantId,
      videoId,
      commentId,
      validatedData.text
    );

    logger.info('Comment reply posted', {
      videoId,
      commentId: comment.id,
      parentCommentId: commentId,
      tenantId,
      requestId,
    });

    res.status(201).json(createSuccessResponse(comment, requestId));
  } catch (error) {
    if (error instanceof ZodError) {
      logger.warn('Invalid reply request', {
        errors: error.errors,
        videoId,
        commentId,
        tenantId,
        requestId,
      });
      return res.status(400).json(
        createErrorResponse(
          'VALIDATION_ERROR',
          'Invalid request data',
          requestId,
          error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message,
          }))
        )
      );
    }

    logger.error('Failed to reply to comment', {
      videoId,
      commentId,
      error,
      tenantId,
      requestId,
    });
    res.status(500).json(
      createErrorResponse('REPLY_COMMENT_ERROR', 'Failed to reply to comment', requestId)
    );
  }
});

/**
 * POST /comments/:commentId/like
 * Like a comment
 *
 * Params:
 * - commentId: string (required)
 */
router.post('/:commentId/like', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const tenantId = extractTenantId(req);

  if (!tenantId) {
    return res.status(400).json(
      createErrorResponse('MISSING_TENANT_ID', 'X-Tenant-ID header is required', requestId)
    );
  }

  const { commentId } = req.params;

  if (!commentId) {
    return res.status(400).json(
      createErrorResponse('MISSING_COMMENT_ID', 'Comment ID is required', requestId)
    );
  }

  try {
    await tiktokService.likeComment(tenantId, commentId);

    logger.info('Comment liked', { commentId, tenantId, requestId });

    res.json(createSuccessResponse({ liked: true, commentId }, requestId));
  } catch (error) {
    logger.error('Failed to like comment', { commentId, error, tenantId, requestId });
    res.status(500).json(
      createErrorResponse('LIKE_COMMENT_ERROR', 'Failed to like comment', requestId)
    );
  }
});

export default router;
