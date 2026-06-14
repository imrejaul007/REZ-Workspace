import { Router, Response } from 'express';
import { z } from 'zod';
import { postService } from '../services';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { createChildLogger } from '../utils/logger';

const logger = createChildLogger('PostRoutes');
const router = Router();

const createPostSchema = z.object({
  content: z.string().min(1).max(5000),
  mediaUrls: z.array(z.string().url()).optional(),
  platform: z.enum(['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok']),
  metadata: z.object({
    hashtags: z.array(z.string()).optional(),
    mentions: z.array(z.string()).optional(),
    location: z.string().optional(),
    link: z.string().url().optional()
  }).optional()
});

const updatePostSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  metadata: z.object({
    hashtags: z.array(z.string()).optional(),
    mentions: z.array(z.string()).optional(),
    location: z.string().optional(),
    link: z.string().url().optional()
  }).optional()
});

// Create a new post
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = createPostSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      return;
    }

    const post = await postService.create({
      userId: req.userId!,
      ...validation.data
    });

    res.status(201).json(post);
  } catch (error) {
    logger.error('Error creating post', { error });
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Get post by ID
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const post = await postService.findById(req.params.id);

    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    res.json(post);
  } catch (error) {
    logger.error('Error fetching post', { error });
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Get all posts for user
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, limit, skip } = req.query;
    const posts = await postService.findByUser(req.userId!, {
      status: status as string,
      limit: limit ? parseInt(limit as string) : 50,
      skip: skip ? parseInt(skip as string) : 0
    });

    res.json(posts);
  } catch (error) {
    logger.error('Error fetching posts', { error });
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Update a post
router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = updatePostSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      return;
    }

    const post = await postService.update(req.params.id, validation.data);

    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    res.json(post);
  } catch (error) {
    logger.error('Error updating post', { error });
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete a post
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await postService.delete(req.params.id);

    if (!deleted) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting post', { error });
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Get upcoming posts
router.get('/upcoming/list', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const posts = await postService.getUpcomingPosts(req.userId!, limit);
    res.json(posts);
  } catch (error) {
    logger.error('Error fetching upcoming posts', { error });
    res.status(500).json({ error: 'Failed to fetch upcoming posts' });
  }
});

export default router;