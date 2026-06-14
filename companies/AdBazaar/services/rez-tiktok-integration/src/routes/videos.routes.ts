import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ZodError } from 'zod';
import tiktokService from '../services/tiktok.service';
import logger from '../utils/logger';
import {
  ApiResponse,
  VideoPostRequestSchema,
  PaginationQuerySchema,
} from '../types';

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
// Video Routes
// ==========================================

/**
 * POST /videos
 * Post a new video to TikTok
 *
 * Body: VideoPostRequest
 * - title: string (required)
 * - video_url: string URL (optional, for URL-based upload)
 * - video_data: base64 string (optional, for direct upload)
 * - description: string (optional)
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

  // Validate request body
  try {
    const validatedData = VideoPostRequestSchema.parse(req.body);

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

    let video;
    if (validatedData.video_url) {
      // Post from URL (pull upload)
      video = await tiktokService.postVideo(tenantId, validatedData);
    } else {
      // Upload from base64 data
      const videoBuffer = Buffer.from(validatedData.video_data!, 'base64');
      video = await tiktokService.uploadVideo(
        tenantId,
        videoBuffer,
        'video.mp4',
        validatedData
      );
    }

    logger.info('Video posted successfully', {
      videoId: video.id,
      tenantId,
      requestId,
    });

    res.status(201).json(createSuccessResponse(video, requestId));
  } catch (error) {
    if (error instanceof ZodError) {
      logger.warn('Invalid video post request', {
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

    logger.error('Failed to post video', { error, tenantId, requestId });

    // Handle TikTok API errors
    const errorMessage = error instanceof Error ? error.message : 'Failed to post video';
    res.status(500).json(
      createErrorResponse('POST_VIDEO_ERROR', errorMessage, requestId)
    );
  }
});

/**
 * GET /videos
 * Get user's videos from TikTok
 *
 * Query params:
 * - maxCount: number (1-100, default 20)
 * - cursor: string (pagination cursor)
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
    // Validate query params
    const validatedQuery = PaginationQuerySchema.parse(req.query);

    const result = await tiktokService.getUserVideos(tenantId, {
      maxCount: validatedQuery.maxCount,
      cursor: validatedQuery.cursor,
    });

    res.json(createSuccessResponse(result, requestId));
  } catch (error) {
    if (error instanceof ZodError) {
      logger.warn('Invalid query params', {
        errors: error.errors,
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

    logger.error('Failed to get videos', { error, tenantId, requestId });
    res.status(500).json(
      createErrorResponse('GET_VIDEOS_ERROR', 'Failed to get videos', requestId)
    );
  }
});

/**
 * GET /videos/:id
 * Get a specific video by ID
 *
 * Params:
 * - id: string (video ID)
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
      createErrorResponse('MISSING_VIDEO_ID', 'Video ID is required', requestId)
    );
  }

  try {
    const video = await tiktokService.getVideo(tenantId, id);

    res.json(createSuccessResponse(video, requestId));
  } catch (error) {
    logger.error('Failed to get video', { videoId: id, error, tenantId, requestId });

    const errorMessage = error instanceof Error ? error.message : 'Video not found';
    const statusCode = errorMessage.includes('not found') ? 404 : 500;

    res.status(statusCode).json(
      createErrorResponse('GET_VIDEO_ERROR', errorMessage, requestId)
    );
  }
});

/**
 * DELETE /videos/:id
 * Delete a video
 *
 * Params:
 * - id: string (video ID)
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
      createErrorResponse('MISSING_VIDEO_ID', 'Video ID is required', requestId)
    );
  }

  try {
    await tiktokService.deleteVideo(tenantId, id);

    logger.info('Video deleted', { videoId: id, tenantId, requestId });

    res.json(createSuccessResponse({ deleted: true, videoId: id }, requestId));
  } catch (error) {
    logger.error('Failed to delete video', { videoId: id, error, tenantId, requestId });

    const errorMessage = error instanceof Error ? error.message : 'Failed to delete video';
    res.status(500).json(
      createErrorResponse('DELETE_VIDEO_ERROR', errorMessage, requestId)
    );
  }
});

export default router;
