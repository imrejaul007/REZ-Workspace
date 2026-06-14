import { Router, Response } from 'express';
import { z } from 'zod';
import { mentionService, sentimentService } from '../services';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { createChildLogger } from 'utils/logger.js';

const logger = createChildLogger('MentionRoutes');
const router = Router();

const createMentionSchema = z.object({
  keywordId: z.string(),
  platform: z.enum(['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok']),
  externalId: z.string(),
  author: z.object({
    id: z.string(),
    username: z.string(),
    displayName: z.string().optional(),
    followers: z.number().optional(),
    verified: z.boolean().optional()
  }),
  content: z.string(),
  url: z.string().url(),
  mediaUrls: z.array(z.string().url()).optional(),
  publishedAt: z.string().datetime(),
  engagement: z.object({
    likes: z.number().optional(),
    comments: z.number().optional(),
    shares: z.number().optional(),
    reach: z.number().optional()
  }).optional(),
  location: z.object({
    country: z.string().optional(),
    city: z.string().optional()
  }).optional(),
  language: z.string().optional()
});

// Get mention stats
router.get('/stats', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { keywordId } = req.query;
    const stats = await mentionService.getMentionStats(
      req.userId!,
      keywordId as string | undefined
    );
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching mention stats', { error });
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get recent mentions
router.get('/recent', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const mentions = await mentionService.getRecentMentions(req.userId!, limit);
    res.json(mentions);
  } catch (error) {
    logger.error('Error fetching recent mentions', { error });
    res.status(500).json({ error: 'Failed to fetch recent mentions' });
  }
});

// Create mention (for testing/manual entry)
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = createMentionSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      return;
    }

    const mention = await mentionService.create({
      userId: req.userId!,
      ...validation.data,
      publishedAt: new Date(validation.data.publishedAt)
    });

    // Perform sentiment analysis
    const sentiment = await sentimentService.analyzeAndRecord({
      userId: req.userId!,
      keywordId: mention.keywordId.toString(),
      mentionId: mention._id.toString(),
      platform: mention.platform,
      content: mention.content
    });

    res.status(201).json({ mention, sentiment });
  } catch (error) {
    logger.error('Error creating mention', { error });
    res.status(500).json({ error: 'Failed to create mention' });
  }
});

// Mark mention as processed
router.put('/:id/process', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const mention = await mentionService.markAsProcessed(req.params.id);

    if (!mention) {
      res.status(404).json({ error: 'Mention not found' });
      return;
    }

    res.json(mention);
  } catch (error) {
    logger.error('Error marking mention as processed', { error });
    res.status(500).json({ error: 'Failed to update mention' });
  }
});

export default router;