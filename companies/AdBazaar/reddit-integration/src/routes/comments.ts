import { Router, Response } from 'express';
import { RedditComment } from '../models';
import { redditApi } from '../services/redditApi';
import {
  asyncHandler,
  AuthenticatedRequest,
  createCommentSchema,
  commentQuerySchema,
  idParamSchema,
  voteSchema,
} from '../middleware';
import { logger } from '../config/logger';
import { commentsPosted } from '../config/metrics';

const router = Router();

/**
 * POST /api/comments
 * Post a comment
 */
router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { postId, parentId, content } = createCommentSchema.parse(req.body);

    if (!req.accountId) {
      res.status(401).json({
        success: false,
        error: 'Account ID required',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    // Determine parent ID for Reddit
    const redditParentId = parentId || `t3_${postId}`;

    const comment = new RedditComment({
      postId,
      parentId: parentId || postId,
      content,
      accountId: req.accountId,
    });

    try {
      // Post to Reddit
      const redditResponse = await redditApi.createComment(
        req.accountId,
        redditParentId,
        content
      );

      // Update local record with Reddit data
      comment.redditCommentId = redditResponse.id;
      comment.postedAt = new Date(redditResponse.created_utc * 1000);
      comment.metrics = {
        score: redditResponse.score,
        upvotes: redditResponse.ups,
        downvotes: redditResponse.downs,
        awards: redditResponse.total_awards_received,
      };
      comment.depth = redditResponse.depth;
      comment.edited = Boolean(redditResponse.edited);

      await comment.save();

      // Update metrics
      commentsPosted.inc();

      logger.info('Comment posted to Reddit', {
        commentId: comment._id,
        redditCommentId: comment.redditCommentId,
        postId,
      });

      res.status(201).json({
        success: true,
        data: {
          comment,
        },
      });
    } catch (error: any) {
      // Save comment as failed if Reddit posting fails
      comment.redditCommentId = `failed_${Date.now()}`;
      await comment.save();

      logger.error('Failed to post Reddit comment', { error, postId });
      throw error;
    }
  })
);

/**
 * GET /api/comments
 * Get comments
 */
router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { limit = 25, skip = 0, sort } = commentQuerySchema.parse(req.query);
    const { postId, parentId } = req.query;

    const query: any = {};
    if (postId) query.postId = postId;
    if (parentId) query.parentId = parentId;

    // Only show published comments by default
    query.postedAt = { $ne: null };

    const sortOptions: any = {};
    switch (sort) {
      case 'top':
        sortOptions['metrics.score'] = -1;
        break;
      case 'controversial':
        sortOptions['metrics.upvotes'] = 1;
        sortOptions['metrics.downvotes'] = -1;
        break;
      case 'new':
      default:
        sortOptions.postedAt = -1;
    }

    const [comments, total] = await Promise.all([
      RedditComment.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('accountId', 'username'),
      RedditComment.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          total,
          limit,
          skip,
          hasMore: skip + comments.length < total,
        },
      },
    });
  })
);

/**
 * GET /api/comments/:id
 * Get single comment
 */
router.get(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = idParamSchema.parse(req.params);

    const comment = await RedditComment.findById(id).populate(
      'accountId',
      'username'
    );

    if (!comment) {
      res.status(404).json({
        success: false,
        error: 'Comment not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        comment,
      },
    });
  })
);

/**
 * DELETE /api/comments/:id
 * Delete comment
 */
router.delete(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = idParamSchema.parse(req.params);

    const comment = await RedditComment.findById(id);

    if (!comment) {
      res.status(404).json({
        success: false,
        error: 'Comment not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    // Delete from Reddit if published
    if (comment.redditCommentId && req.accountId) {
      try {
        await redditApi.deleteComment(comment.redditCommentId, req.accountId);
      } catch (error) {
        logger.error('Failed to delete Reddit comment', { error, id });
        // Continue with local deletion
      }
    }

    await RedditComment.findByIdAndDelete(id);

    logger.info('Comment deleted', { commentId: id });

    res.json({
      success: true,
      data: {
        message: 'Comment deleted successfully',
        commentId: id,
      },
    });
  })
);

/**
 * POST /api/vote
 * Vote on post or comment
 */
router.post(
  '/vote',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { targetId, direction } = voteSchema.parse(req.body);

    if (!req.accountId) {
      res.status(401).json({
        success: false,
        error: 'Account ID required',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    // Map direction to Reddit vote value
    let voteDirection: -1 | 0 | 1;
    switch (direction) {
      case 'up':
        voteDirection = 1;
        break;
      case 'down':
        voteDirection = -1;
        break;
      case 'none':
      default:
        voteDirection = 0;
    }

    try {
      await redditApi.vote(req.accountId, targetId, voteDirection);

      logger.info('Vote cast', { targetId, direction: voteDirection });

      res.json({
        success: true,
        data: {
          message: 'Vote cast successfully',
          targetId,
          direction,
        },
      });
    } catch (error) {
      logger.error('Failed to cast vote', { error, targetId, direction });
      res.status(500).json({
        success: false,
        error: 'Failed to cast vote',
        code: 'VOTE_ERROR',
      });
    }
  })
);

/**
 * GET /api/comments/post/:postId
 * Get comments for a specific post from Reddit
 */
router.get(
  '/post/:postId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { postId } = req.params;
    const { limit = 100 } = req.query;

    try {
      const comments = await redditApi.getComments(postId, req.accountId, Number(limit));

      res.json({
        success: true,
        data: {
          postId,
          comments,
          count: comments.length,
        },
      });
    } catch (error) {
      logger.error('Failed to fetch Reddit comments', { error, postId });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch comments',
        code: 'FETCH_ERROR',
      });
    }
  })
);

export default router;