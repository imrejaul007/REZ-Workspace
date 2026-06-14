import { Router, Request, Response } from 'express';
import { commentService } from '../services/CommentService.js';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

const router = Router();

// GET /api/comments - Get comments
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const videoId = req.query.videoId as string;
  const youtubeChannelId = req.query.youtubeChannelId as string;
  const status = req.query.status as 'pending' | 'approved' | 'rejected' | 'flagged';

  const result = await commentService.getComments({
    page,
    limit,
    videoId,
    youtubeChannelId,
    status,
  });

  res.json({
    success: true,
    data: result.comments,
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
    },
  });
}));

// GET /api/comments/stats - Get comment statistics
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const youtubeChannelId = req.query.youtubeChannelId as string;

  if (!youtubeChannelId) {
    throw createError('YouTube channel ID is required', 400, 'MISSING_CHANNEL_ID');
  }

  const stats = await commentService.getCommentStats(youtubeChannelId);

  res.json({
    success: true,
    data: stats,
  });
}));

// POST /api/comments/moderate - Moderate a comment
router.post('/moderate', asyncHandler(async (req: Request, res: Response) => {
  const { commentId, action, note } = req.body;

  if (!commentId) {
    throw createError('Comment ID is required', 400, 'MISSING_COMMENT_ID');
  }

  if (!action || !['approve', 'reject', 'flag'].includes(action)) {
    throw createError('Valid action is required (approve, reject, flag)', 400, 'INVALID_ACTION');
  }

  const comment = await commentService.moderateComment(commentId, action, note);

  logger.info('Comment moderated via API', { commentId, action });

  res.json({
    success: true,
    data: comment,
  });
}));

// POST /api/comments/moderate/batch - Moderate multiple comments
router.post('/moderate/batch', asyncHandler(async (req: Request, res: Response) => {
  const { commentIds, action, note } = req.body;

  if (!commentIds || !Array.isArray(commentIds) || commentIds.length === 0) {
    throw createError('Array of comment IDs is required', 400, 'MISSING_COMMENT_IDS');
  }

  if (!action || !['approve', 'reject', 'flag'].includes(action)) {
    throw createError('Valid action is required (approve, reject, flag)', 400, 'INVALID_ACTION');
  }

  const result = await commentService.moderateBatch(commentIds, action, note);

  logger.info('Batch moderation completed via API', {
    total: commentIds.length,
    succeeded: result.succeeded.length,
    failed: result.failed.length,
  });

  res.json({
    success: true,
    data: result,
  });
}));

// POST /api/comments/sync/:videoId - Sync comments from YouTube
router.post('/sync/:videoId', asyncHandler(async (req: Request, res: Response) => {
  const syncedCount = await commentService.syncCommentsFromYouTube(req.params.videoId);

  logger.info('Comments synced from YouTube', {
    videoId: req.params.videoId,
    syncedCount,
  });

  res.json({
    success: true,
    data: {
      syncedCount,
    },
  });
}));

export default router;