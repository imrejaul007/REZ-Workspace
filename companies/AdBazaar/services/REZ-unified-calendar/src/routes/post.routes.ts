import { Router, Request, Response } from 'express';
import { calendarService } from '../services/calendar.service';
import { platformConnectorService } from '../services/platform-connector.service';
import { PlatformPostSchema, Platform } from '../types';
import { ZodError } from 'zod';
import { apiLogger as logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/posts
 * Get all posts with pagination and filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const filters = {
      platforms: req.query.platforms
        ? (req.query.platforms as string).split(',') as Platform[]
        : undefined,
      statuses: req.query.statuses
        ? (req.query.statuses as string).split(',') as string[]
        : undefined,
      dateRange: req.query.start && req.query.end
        ? {
            start: new Date(req.query.start as string),
            end: new Date(req.query.end as string),
          }
        : undefined,
      searchQuery: req.query.search as string | undefined,
      userId: req.query.userId as string | undefined,
    };

    const result = await calendarService.getAllPosts(page, limit, filters);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error('Failed to get posts', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get posts',
      timestamp: new Date(),
    });
  }
});

/**
 * GET /api/posts/:id
 * Get a single post by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await calendarService.getPost(id);

    if (!result.success) {
      res.status(404).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    logger.error('Failed to get post', { postId: req.params.id, error });
    res.status(500).json({
      success: false,
      error: 'Failed to get post',
      timestamp: new Date(),
    });
  }
});

/**
 * POST /api/posts
 * Create a new post
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = PlatformPostSchema.parse(req.body);

    const result = await calendarService.addOrUpdatePost(validatedData);

    res.status(201).json({
      success: true,
      data: result,
      timestamp: new Date(),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
        timestamp: new Date(),
      });
      return;
    }
    logger.error('Failed to create post', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to create post',
      timestamp: new Date(),
    });
  }
});

/**
 * PUT /api/posts/:id
 * Update a post
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existingPost = await calendarService.getPost(id);

    if (!existingPost.success || !existingPost.data) {
      res.status(404).json({
        success: false,
        error: 'Post not found',
        timestamp: new Date(),
      });
      return;
    }

    const updatedData = {
      ...existingPost.data,
      ...req.body,
      updatedAt: new Date(),
    };

    const result = await calendarService.addOrUpdatePost(updatedData);

    res.json({
      success: true,
      data: result,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to update post', { postId: req.params.id, error });
    res.status(500).json({
      success: false,
      error: 'Failed to update post',
      timestamp: new Date(),
    });
  }
});

/**
 * DELETE /api/posts/:id
 * Delete a post
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await calendarService.deletePost(id);

    if (!result.success) {
      res.status(404).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    logger.error('Failed to delete post', { postId: req.params.id, error });
    res.status(500).json({
      success: false,
      error: 'Failed to delete post',
      timestamp: new Date(),
    });
  }
});

/**
 * POST /api/posts/:id/publish
 * Publish a post immediately (one-click publish)
 */
router.post('/:id/publish', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    logger.info('One-click publish requested', { postId: id });

    const result = await calendarService.publishPost(id);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json({
      success: true,
      data: result.data,
      message: `Post published successfully on ${result.data?.platform}`,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to publish post', { postId: req.params.id, error });
    res.status(500).json({
      success: false,
      error: 'Failed to publish post',
      timestamp: new Date(),
    });
  }
});

/**
 * GET /api/posts/:id/preview
 * Get platform-specific preview for a post
 */
router.get('/:id/preview', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const platform = req.query.platform as Platform;

    const post = await calendarService.getPost(id);
    if (!post.success || !post.data) {
      res.status(404).json({
        success: false,
        error: 'Post not found',
        timestamp: new Date(),
      });
      return;
    }

    const targetPlatform = platform || post.data.platform;
    const preview = await platformConnectorService.getPreview(targetPlatform, {
      content: post.data.content,
    });

    res.json({
      success: true,
      data: {
        postId: id,
        platform: targetPlatform,
        preview: preview.data,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to get preview', { postId: req.params.id, error });
    res.status(500).json({
      success: false,
      error: 'Failed to get preview',
      timestamp: new Date(),
    });
  }
});

/**
 * POST /api/posts/:id/duplicate
 * Duplicate a post (create a copy)
 */
router.post('/:id/duplicate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { scheduledTime, platform } = req.body;

    const originalPost = await calendarService.getPost(id);
    if (!originalPost.success || !originalPost.data) {
      res.status(404).json({
        success: false,
        error: 'Original post not found',
        timestamp: new Date(),
      });
      return;
    }

    const duplicatedPost = {
      ...originalPost.data,
      id: crypto.randomUUID(),
      platform: platform || originalPost.data.platform,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : new Date(),
      status: 'draft' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await calendarService.addOrUpdatePost(duplicatedPost);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Post duplicated successfully',
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to duplicate post', { postId: req.params.id, error });
    res.status(500).json({
      success: false,
      error: 'Failed to duplicate post',
      timestamp: new Date(),
    });
  }
});

/**
 * PATCH /api/posts/:id/status
 * Update post status
 */
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['draft', 'scheduled', 'published', 'failed', 'pending_review'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Invalid status',
        validStatuses,
        timestamp: new Date(),
      });
      return;
    }

    const result = await calendarService.performBulkOperation({
      ids: [id],
      action: 'change_status',
      newValues: { status },
    });

    if (result.failedItems.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Failed to update status',
        details: result.failedItems,
        timestamp: new Date(),
      });
      return;
    }

    const updatedPost = await calendarService.getPost(id);
    res.json({
      success: true,
      data: updatedPost.data,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to update post status', { postId: req.params.id, error });
    res.status(500).json({
      success: false,
      error: 'Failed to update post status',
      timestamp: new Date(),
    });
  }
});

export default router;
