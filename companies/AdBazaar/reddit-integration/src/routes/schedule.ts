import { Router, Response } from 'express';
import { schedulerService } from '../services/scheduler';
import {
  asyncHandler,
  AuthenticatedRequest,
  schedulePostSchema,
  scheduleQuerySchema,
  idParamSchema,
} from '../middleware';
import { logger } from '../config/logger';
import { scheduledPostsCount } from '../config/metrics';

const router = Router();

/**
 * POST /api/schedule
 * Schedule a new post
 */
router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = schedulePostSchema.parse(req.body);

    if (!req.accountId) {
      res.status(401).json({
        success: false,
        error: 'Account ID required',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    try {
      const scheduledPost = await schedulerService.schedulePost({
        ...data,
        scheduledFor: new Date(data.scheduledFor),
        accountId: req.accountId,
      });

      res.status(201).json({
        success: true,
        data: {
          scheduledPost,
        },
      });
    } catch (error) {
      logger.error('Failed to schedule post', { error });
      throw error;
    }
  })
);

/**
 * GET /api/schedule
 * List scheduled posts
 */
router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.accountId) {
      res.status(401).json({
        success: false,
        error: 'Account ID required',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    const { limit = 25, skip = 0, status } = scheduleQuerySchema.parse(req.query);

    try {
      const posts = await schedulerService.getScheduledPosts(req.accountId, {
        limit,
        skip,
        status,
      });

      const total = await schedulerService.getScheduledPosts(req.accountId, {
        limit: 10000,
        skip: 0,
        status,
      });

      res.json({
        success: true,
        data: {
          scheduledPosts: posts,
          pagination: {
            total: total.length,
            limit,
            skip,
            hasMore: skip + posts.length < total.length,
          },
        },
      });
    } catch (error) {
      logger.error('Failed to get scheduled posts', { error });
      throw error;
    }
  })
);

/**
 * GET /api/schedule/:id
 * Get single scheduled post
 */
router.get(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = idParamSchema.parse(req.params);

    // Import model here to avoid circular dependency
    const { ScheduledPost } = await import('../models');

    const scheduledPost = await ScheduledPost.findById(id).populate(
      'accountId',
      'username'
    );

    if (!scheduledPost) {
      res.status(404).json({
        success: false,
        error: 'Scheduled post not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        scheduledPost,
      },
    });
  })
);

/**
 * DELETE /api/schedule/:id
 * Cancel a scheduled post
 */
router.delete(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = idParamSchema.parse(req.params);

    if (!req.accountId) {
      res.status(401).json({
        success: false,
        error: 'Account ID required',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    try {
      await schedulerService.cancelScheduledPost(id, req.accountId);

      res.json({
        success: true,
        data: {
          message: 'Scheduled post cancelled',
          postId: id,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to cancel scheduled post',
        code: 'CANCEL_FAILED',
      });
    }
  })
);

/**
 * POST /api/schedule/:id/retry
 * Retry a failed scheduled post
 */
router.post(
  '/:id/retry',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = idParamSchema.parse(req.params);

    // Import model here to avoid circular dependency
    const { ScheduledPost } = await import('../models');

    const scheduledPost = await ScheduledPost.findById(id);

    if (!scheduledPost) {
      res.status(404).json({
        success: false,
        error: 'Scheduled post not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    if (scheduledPost.status !== 'failed') {
      res.status(400).json({
        success: false,
        error: 'Only failed posts can be retried',
        code: 'INVALID_STATUS',
      });
      return;
    }

    if (!scheduledPost.canRetry) {
      res.status(400).json({
        success: false,
        error: 'Max retries exceeded',
        code: 'MAX_RETRIES',
      });
      return;
    }

    // Reset status and update scheduled time
    scheduledPost.status = 'pending';
    scheduledPost.scheduledFor = new Date();
    scheduledPost.errorMessage = undefined;
    await scheduledPost.save();

    // Update metric
    const pendingCount = await ScheduledPost.countDocuments({ status: 'pending' });
    scheduledPostsCount.set(pendingCount);

    logger.info('Scheduled post retry initiated', { postId: id });

    res.json({
      success: true,
      data: {
        message: 'Post scheduled for retry',
        postId: id,
      },
    });
  })
);

/**
 * GET /api/schedule/stats
 * Get scheduler statistics
 */
router.get(
  '/stats',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Import model here to avoid circular dependency
    const { ScheduledPost } = await import('../models');

    const [pending, published, failed, cancelled] = await Promise.all([
      ScheduledPost.countDocuments({ status: 'pending' }),
      ScheduledPost.countDocuments({ status: 'published' }),
      ScheduledPost.countDocuments({ status: 'failed' }),
      ScheduledPost.countDocuments({ status: 'cancelled' }),
    ]);

    // Get next scheduled post
    const nextPost = await ScheduledPost.findOne({
      status: 'pending',
      scheduledFor: { $gt: new Date() },
    }).sort({ scheduledFor: 1 });

    res.json({
      success: true,
      data: {
        stats: {
          pending,
          published,
          failed,
          cancelled,
          total: pending + published + failed + cancelled,
        },
        nextScheduledPost: nextPost
          ? {
              id: nextPost._id,
              scheduledFor: nextPost.scheduledFor,
              subreddit: nextPost.subreddit,
              title: nextPost.title,
            }
          : null,
      },
    });
  })
);

export default router;