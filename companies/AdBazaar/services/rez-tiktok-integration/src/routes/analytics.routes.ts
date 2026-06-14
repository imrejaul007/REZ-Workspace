import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import tiktokService from '../services/tiktok.service';
import logger from '../utils/logger';
import { ApiResponse } from '../types';

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
// Analytics Routes
// ==========================================

/**
 * GET /analytics/video/:id
 * Get analytics for a specific video
 *
 * Params:
 * - id: string (video ID, required)
 *
 * Note: Video analytics require the 'insights.video' scope.
 * Basic stats (play count, likes, etc.) are available with 'user.info.basic'.
 */
router.get('/video/:id', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const tenantId = extractTenantId(req);

  if (!tenantId) {
    return res.status(400).json(
      createErrorResponse('MISSING_TENANT_ID', 'X-Tenant-ID header is required', requestId)
    );
  }

  const { id: videoId } = req.params;

  if (!videoId) {
    return res.status(400).json(
      createErrorResponse('MISSING_VIDEO_ID', 'Video ID is required', requestId)
    );
  }

  try {
    // Check connection status first
    if (!tiktokService.isConnected(tenantId)) {
      return res.status(401).json(
        createErrorResponse(
          'NOT_CONNECTED',
          'TikTok account not connected. Please authenticate first.',
          requestId
        )
      );
    }

    const analytics = await tiktokService.getVideoAnalytics(tenantId, videoId);

    logger.info('Video analytics retrieved', {
      videoId,
      views: analytics.views,
      tenantId,
      requestId,
    });

    res.json(createSuccessResponse(analytics, requestId));
  } catch (error) {
    logger.error('Failed to get video analytics', {
      videoId,
      error,
      tenantId,
      requestId,
    });

    const errorMessage = error instanceof Error ? error.message : 'Failed to get video analytics';

    // Provide more specific error messages based on common issues
    if (errorMessage.includes('scope') || errorMessage.includes('permission')) {
      return res.status(403).json(
        createErrorResponse(
          'SCOPE_INSUFFICIENT',
          'Insufficient permissions. Please ensure you granted the analytics scope during OAuth.',
          requestId,
          {
            requiredScopes: ['stats.basic', 'insights.video'],
            hint: 'Re-authenticate with TikTok and grant analytics permissions',
          }
        )
      );
    }

    res.status(500).json(
      createErrorResponse('ANALYTICS_ERROR', errorMessage, requestId)
    );
  }
});

/**
 * GET /analytics/profile
 * Get profile analytics
 *
 * Returns follower stats, engagement metrics, and profile performance data.
 * Requires 'user.info.stats' scope for full data.
 */
router.get('/profile', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const tenantId = extractTenantId(req);

  if (!tenantId) {
    return res.status(400).json(
      createErrorResponse('MISSING_TENANT_ID', 'X-Tenant-ID header is required', requestId)
    );
  }

  try {
    // Check connection status first
    if (!tiktokService.isConnected(tenantId)) {
      return res.status(401).json(
        createErrorResponse(
          'NOT_CONNECTED',
          'TikTok account not connected. Please authenticate first.',
          requestId
        )
      );
    }

    const analytics = await tiktokService.getProfileAnalytics(tenantId);

    logger.info('Profile analytics retrieved', {
      followers: analytics.followers,
      tenantId,
      requestId,
    });

    res.json(createSuccessResponse(analytics, requestId));
  } catch (error) {
    logger.error('Failed to get profile analytics', { error, tenantId, requestId });

    const errorMessage = error instanceof Error ? error.message : 'Failed to get profile analytics';

    // Provide more specific error messages
    if (errorMessage.includes('scope') || errorMessage.includes('permission')) {
      return res.status(403).json(
        createErrorResponse(
          'SCOPE_INSUFFICIENT',
          'Insufficient permissions. Please ensure you granted the stats scope during OAuth.',
          requestId,
          {
            requiredScopes: ['user.info.stats'],
            hint: 'Re-authenticate with TikTok and grant stats permissions',
          }
        )
      );
    }

    res.status(500).json(
      createErrorResponse('PROFILE_ANALYTICS_ERROR', errorMessage, requestId)
    );
  }
});

/**
 * GET /analytics/overview
 * Get combined analytics overview
 *
 * Returns both profile and recent video performance summary.
 */
router.get('/overview', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const tenantId = extractTenantId(req);

  if (!tenantId) {
    return res.status(400).json(
      createErrorResponse('MISSING_TENANT_ID', 'X-Tenant-ID header is required', requestId)
    );
  }

  try {
    // Check connection status first
    if (!tiktokService.isConnected(tenantId)) {
      return res.status(401).json(
        createErrorResponse(
          'NOT_CONNECTED',
          'TikTok account not connected. Please authenticate first.',
          requestId
        )
      );
    }

    // Get profile analytics
    const profileAnalytics = await tiktokService.getProfileAnalytics(tenantId);

    // Get recent videos (last 10)
    const { videos } = await tiktokService.getUserVideos(tenantId, { maxCount: 10 });

    // Calculate aggregate video stats
    const videoStats = videos.reduce(
      (acc, video) => ({
        totalViews: acc.totalViews + (video.statistics?.play_count || 0),
        totalLikes: acc.totalLikes + (video.statistics?.digg_count || 0),
        totalComments: acc.totalComments + (video.statistics?.comment_count || 0),
        totalShares: acc.totalShares + (video.statistics?.share_count || 0),
      }),
      { totalViews: 0, totalLikes: 0, totalComments: 0, totalShares: 0 }
    );

    const overview = {
      profile: profileAnalytics,
      recentVideos: {
        count: videos.length,
        aggregateStats: videoStats,
      },
      generatedAt: new Date().toISOString(),
    };

    logger.info('Analytics overview retrieved', { tenantId, requestId });

    res.json(createSuccessResponse(overview, requestId));
  } catch (error) {
    logger.error('Failed to get analytics overview', { error, tenantId, requestId });
    res.status(500).json(
      createErrorResponse(
        'OVERVIEW_ERROR',
        'Failed to get analytics overview',
        requestId
      )
    );
  }
});

export default router;
