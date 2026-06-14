import { Router, Response } from 'express';
import { RedditPost } from '../models';
import { redditApi } from '../services/redditApi';
import { asyncHandler, AuthenticatedRequest, createPostSchema, updatePostSchema, postQuerySchema, idParamSchema } from '../middleware';
import { logger } from '../config/logger';
import { postsCreated } from '../config/metrics';

const router = Router();

/**
 * POST /api/posts
 * Create a new post
 */
router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { subreddit, title, content, url, mediaUrls, nsfw, spoiler, flair } =
      createPostSchema.parse(req.body);

    if (!req.accountId) {
      res.status(401).json({
        success: false,
        error: 'Account ID required',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    // Create local post record
    const post = new RedditPost({
      subreddit,
      title,
      content: content || '',
      url: url || undefined,
      mediaUrls: mediaUrls || [],
      nsfw: nsfw || false,
      spoiler: spoiler || false,
      flair: flair || undefined,
      accountId: req.accountId,
    });

    try {
      // Post to Reddit
      const redditResponse = await redditApi.createPost(req.accountId, subreddit, {
        title,
        content,
        url,
        nsfw,
        spoiler,
        flair,
      });

      // Update local record with Reddit data
      post.redditPostId = redditResponse.id;
      post.postedAt = new Date(redditResponse.created_utc * 1000);
      post.metrics = {
        score: redditResponse.score,
        upvotes: redditResponse.ups,
        downvotes: redditResponse.downs,
        comments: redditResponse.num_comments,
        awards: redditResponse.total_awards_received,
      };
      post.archived = redditResponse.archived;
      post.locked = redditResponse.locked;
      post.edited = Boolean(redditResponse.edited);

      await post.save();

      // Update metrics
      postsCreated.inc();

      logger.info('Post created on Reddit', {
        postId: post._id,
        redditPostId: post.redditPostId,
        subreddit,
      });

      res.status(201).json({
        success: true,
        data: {
          post,
        },
      });
    } catch (error: any) {
      // Save post as failed if Reddit posting fails
      post.redditPostId = `failed_${Date.now()}`;
      await post.save();

      logger.error('Failed to create Reddit post', { error, subreddit, title });
      throw error;
    }
  })
);

/**
 * GET /api/posts
 * List posts
 */
router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { limit = 25, skip = 0, subreddit, sort } = postQuerySchema.parse(req.query);

    const query: any = {};
    if (subreddit) {
      query.subreddit = subreddit.toLowerCase();
    }

    // Only show published posts by default
    query.postedAt = { $ne: null };

    const sortOptions: any = {};
    switch (sort) {
      case 'top':
        sortOptions['metrics.score'] = -1;
        break;
      case 'hot':
        sortOptions['metrics.score'] = -1;
        sortOptions.createdAt = -1;
        break;
      case 'new':
      default:
        sortOptions.postedAt = -1;
    }

    const [posts, total] = await Promise.all([
      RedditPost.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('accountId', 'username'),
      RedditPost.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          total,
          limit,
          skip,
          hasMore: skip + posts.length < total,
        },
      },
    });
  })
);

/**
 * GET /api/posts/:id
 * Get single post
 */
router.get(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = idParamSchema.parse(req.params);

    const post = await RedditPost.findById(id).populate('accountId', 'username');

    if (!post) {
      res.status(404).json({
        success: false,
        error: 'Post not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    // Optionally refresh metrics from Reddit
    if (post.redditPostId && post.postedAt) {
      try {
        const redditData = await redditApi.getPost(post.redditPostId, req.accountId);

        post.metrics = {
          score: redditData.score,
          upvotes: redditData.ups,
          downvotes: redditData.downs,
          comments: redditData.num_comments,
          awards: redditData.total_awards_received,
        };
        post.archived = redditData.archived;
        post.locked = redditData.locked;
        post.edited = Boolean(redditData.edited);

        await post.save();
      } catch (error) {
        logger.warn('Failed to refresh post metrics', { id });
      }
    }

    res.json({
      success: true,
      data: {
        post,
      },
    });
  })
);

/**
 * PATCH /api/posts/:id
 * Update post
 */
router.patch(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = idParamSchema.parse(req.params);
    const updates = updatePostSchema.parse(req.body);

    const post = await RedditPost.findById(id);

    if (!post) {
      res.status(404).json({
        success: false,
        error: 'Post not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    if (!post.redditPostId) {
      res.status(400).json({
        success: false,
        error: 'Cannot update unsent post',
        code: 'NOT_PUBLISHED',
      });
      return;
    }

    // Update on Reddit if we have an account
    if (req.accountId && (updates.title || updates.content !== undefined)) {
      try {
        await redditApi.updatePost(post.redditPostId, req.accountId, {
          title: updates.title,
          content: updates.content,
        });
      } catch (error) {
        logger.error('Failed to update Reddit post', { error, id });
        throw error;
      }
    }

    // Update local record
    if (updates.title) post.title = updates.title;
    if (updates.content !== undefined) post.content = updates.content;
    if (updates.nsfw !== undefined) post.nsfw = updates.nsfw;
    if (updates.spoiler !== undefined) post.spoiler = updates.spoiler;
    if (updates.flair !== undefined) post.flair = updates.flair;
    post.edited = true;

    await post.save();

    logger.info('Post updated', { postId: post._id });

    res.json({
      success: true,
      data: {
        post,
      },
    });
  })
);

/**
 * DELETE /api/posts/:id
 * Delete post
 */
router.delete(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = idParamSchema.parse(req.params);

    const post = await RedditPost.findById(id);

    if (!post) {
      res.status(404).json({
        success: false,
        error: 'Post not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    // Delete from Reddit if published
    if (post.redditPostId && req.accountId) {
      try {
        await redditApi.deletePost(post.redditPostId, req.accountId);
      } catch (error) {
        logger.error('Failed to delete Reddit post', { error, id });
        // Continue with local deletion
      }
    }

    await RedditPost.findByIdAndDelete(id);

    logger.info('Post deleted', { postId: id });

    res.json({
      success: true,
      data: {
        message: 'Post deleted successfully',
        postId: id,
      },
    });
  })
);

/**
 * POST /api/posts/:id/save
 * Save post to Reddit account
 */
router.post(
  '/:id/save',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = idParamSchema.parse(req.params);

    if (!req.accountId) {
      res.status(401).json({
        success: false,
        error: 'Account required',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    const post = await RedditPost.findById(id);

    if (!post || !post.redditPostId) {
      res.status(404).json({
        success: false,
        error: 'Post not found or not published',
        code: 'NOT_FOUND',
      });
      return;
    }

    try {
      await redditApi.savePost(req.accountId, post.redditPostId);

      res.json({
        success: true,
        data: {
          message: 'Post saved to Reddit',
        },
      });
    } catch (error) {
      logger.error('Failed to save post', { error, id });
      res.status(500).json({
        success: false,
        error: 'Failed to save post',
        code: 'SAVE_ERROR',
      });
    }
  })
);

export default router;