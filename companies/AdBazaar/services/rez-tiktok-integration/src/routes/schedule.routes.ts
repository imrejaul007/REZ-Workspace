import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ZodError } from 'zod';
import tiktokService from '../services/tiktok.service';
import logger from '../utils/logger';
import { ApiResponse, SchedulePostRequestSchema, ScheduledPost } from '../types';

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
// Schedule Routes
// ==========================================

/**
 * POST /schedule
 * Schedule a post for future publishing
 *
 * Body: SchedulePostRequest
 * - title: string (required)
 * - videoUrl: string URL (required)
 * - description: string (optional)
 * - scheduled_time: number - Unix timestamp in milliseconds (required)
 * - privacy_level: 'SELF_ONLY' | 'MUTUAL_FOLLOW_FRIENDS' | 'FRIENDS' | 'PUBLIC'
 * - allow_comment: boolean
 * - allow_duet: boolean
 * - allow_stitch: boolean
 */
router.post('/', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const tenantId = extractTenantId(req);

  if (!tenantId) {
    return res.status(400).json(
      createErrorResponse('MISSING_TENANT_ID', 'X-Tenant-ID header is required', requestId)
    );
  }

  try {
    // Validate request body
    const validatedData = SchedulePostRequestSchema.parse(req.body);

    // Check if TikTok is connected
    if (!tiktokService.isConnected(tenantId)) {
      return res.status(401).json(
        createErrorResponse(
          'NOT_CONNECTED',
          'TikTok account not connected. Please authenticate first.',
          requestId
        )
      );
    }

    // Validate scheduled time is in the future
    const scheduledAt = new Date(validatedData.scheduled_time);
    if (scheduledAt.getTime() <= Date.now()) {
      return res.status(400).json(
        createErrorResponse(
          'INVALID_SCHEDULED_TIME',
          'Scheduled time must be in the future',
          requestId
        )
      );
    }

    const scheduledPost = tiktokService.schedulePost(tenantId, {
      video_url: validatedData.videoUrl,
      title: validatedData.title,
      description: validatedData.description,
      scheduled_time: validatedData.scheduled_time,
      privacy_level: validatedData.privacy_level,
      allow_comment: validatedData.allow_comment,
      allow_duet: validatedData.allow_duet,
      allow_stitch: validatedData.allow_stitch,
    });

    logger.info('Post scheduled', {
      scheduleId: scheduledPost.id,
      scheduledAt: scheduledPost.scheduledAt.toISOString(),
      tenantId,
      requestId,
    });

    res.status(201).json(createSuccessResponse(scheduledPost, requestId));
  } catch (error) {
    if (error instanceof ZodError) {
      logger.warn('Invalid schedule request', {
        errors: error.errors,
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

    logger.error('Failed to schedule post', { error, tenantId, requestId });

    const errorMessage = error instanceof Error ? error.message : 'Failed to schedule post';
    res.status(500).json(
      createErrorResponse('SCHEDULE_ERROR', errorMessage, requestId)
    );
  }
});

/**
 * GET /schedule
 * Get all scheduled posts for the tenant
 *
 * Query params:
 * - status: 'scheduled' | 'posted' | 'failed' | 'cancelled' (optional filter)
 */
router.get('/', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const tenantId = extractTenantId(req);

  if (!tenantId) {
    return res.status(400).json(
      createErrorResponse('MISSING_TENANT_ID', 'X-Tenant-ID header is required', requestId)
    );
  }

  try {
    const statusFilter = req.query.status as ScheduledPost['status'] | undefined;
    let scheduledPosts = tiktokService.getScheduledPosts(tenantId);

    // Apply status filter if provided
    if (statusFilter) {
      scheduledPosts = scheduledPosts.filter(post => post.status === statusFilter);
    }

    logger.info('Scheduled posts retrieved', {
      count: scheduledPosts.length,
      tenantId,
      requestId,
    });

    res.json(createSuccessResponse({
      posts: scheduledPosts,
      count: scheduledPosts.length,
    }, requestId));
  } catch (error) {
    logger.error('Failed to get scheduled posts', { error, tenantId, requestId });
    res.status(500).json(
      createErrorResponse('GET_SCHEDULED_ERROR', 'Failed to get scheduled posts', requestId)
    );
  }
});

/**
 * GET /schedule/:id
 * Get a specific scheduled post
 *
 * Params:
 * - id: string (schedule ID)
 */
router.get('/:id', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const tenantId = extractTenantId(req);

  if (!tenantId) {
    return res.status(400).json(
      createErrorResponse('MISSING_TENANT_ID', 'X-Tenant-ID header is required', requestId)
    );
  }

  const { id } = req.params;

  if (!id) {
    return res.status(400).json(
      createErrorResponse('MISSING_SCHEDULE_ID', 'Schedule ID is required', requestId)
    );
  }

  try {
    const scheduledPost = tiktokService.getScheduledPost(tenantId, id);

    if (!scheduledPost) {
      return res.status(404).json(
        createErrorResponse('NOT_FOUND', 'Scheduled post not found', requestId)
      );
    }

    res.json(createSuccessResponse(scheduledPost, requestId));
  } catch (error) {
    logger.error('Failed to get scheduled post', {
      scheduleId: id,
      error,
      tenantId,
      requestId,
    });
    res.status(500).json(
      createErrorResponse('GET_SCHEDULE_ERROR', 'Failed to get scheduled post', requestId)
    );
  }
});

/**
 * DELETE /schedule/:id
 * Cancel a scheduled post
 *
 * Params:
 * - id: string (schedule ID)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const tenantId = extractTenantId(req);

  if (!tenantId) {
    return res.status(400).json(
      createErrorResponse('MISSING_TENANT_ID', 'X-Tenant-ID header is required', requestId)
    );
  }

  const { id } = req.params;

  if (!id) {
    return res.status(400).json(
      createErrorResponse('MISSING_SCHEDULE_ID', 'Schedule ID is required', requestId)
    );
  }

  try {
    const cancelled = tiktokService.cancelScheduledPost(tenantId, id);

    if (!cancelled) {
      return res.status(404).json(
        createErrorResponse('NOT_FOUND', 'Scheduled post not found', requestId)
      );
    }

    logger.info('Scheduled post cancelled', { scheduleId: id, tenantId, requestId });

    res.json(createSuccessResponse({ cancelled: true, scheduleId: id }, requestId));
  } catch (error) {
    logger.error('Failed to cancel scheduled post', {
      scheduleId: id,
      error,
      tenantId,
      requestId,
    });
    res.status(500).json(
      createErrorResponse('CANCEL_ERROR', 'Failed to cancel scheduled post', requestId)
    );
  }
});

export default router;
