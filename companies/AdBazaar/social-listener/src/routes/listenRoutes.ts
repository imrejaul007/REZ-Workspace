import { Router, Response } from 'express';
import { z } from 'zod';
import { keywordService, mentionService } from '../services';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { createChildLogger } from 'utils/logger.js';

const logger = createChildLogger('ListenRoutes');
const router = Router();

const createKeywordSchema = z.object({
  keyword: z.string().min(1).max(200),
  type: z.enum(['track', 'search', 'hashtag', 'mention']).optional(),
  platforms: z.array(z.enum(['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok', 'all'])).optional(),
  filters: z.object({
    languages: z.array(z.string()).optional(),
    locations: z.array(z.string()).optional(),
    sentiment: z.enum(['positive', 'negative', 'neutral']).optional(),
    minFollowers: z.number().optional()
  }).optional(),
  alertEnabled: z.boolean().optional(),
  alertThreshold: z.number().optional()
});

// Add keywords to monitor
router.post('/keywords', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = createKeywordSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      return;
    }

    const keyword = await keywordService.create({
      userId: req.userId!,
      ...validation.data
    });

    res.status(201).json(keyword);
  } catch (error) {
    logger.error('Error creating keyword', { error });
    res.status(500).json({ error: 'Failed to create keyword' });
  }
});

// Get mentions for a keyword
router.get('/:keyword', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { keyword } = req.params;
    const { limit, skip, sentiment, platform } = req.query;

    const mentions = await mentionService.findByKeyword(keyword, req.userId!, {
      limit: limit ? parseInt(limit as string) : 50,
      skip: skip ? parseInt(skip as string) : 0,
      sentiment: sentiment as string,
      platform: platform as string
    });

    res.json(mentions);
  } catch (error) {
    logger.error('Error fetching mentions', { error });
    res.status(500).json({ error: 'Failed to fetch mentions' });
  }
});

// Get all mentions
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { keywordId, platform, sentiment, startDate, endDate, limit, skip } = req.query;

    const mentions = await mentionService.findMentions(req.userId!, {
      keywordId: keywordId as string,
      platform: platform as string,
      sentiment: sentiment as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : 50,
      skip: skip ? parseInt(skip as string) : 0
    });

    res.json(mentions);
  } catch (error) {
    logger.error('Error fetching mentions', { error });
    res.status(500).json({ error: 'Failed to fetch mentions' });
  }
});

// Get all keywords
router.get('/keywords/list', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { isActive, type } = req.query;
    const keywords = await keywordService.findByUser(req.userId!, {
      isActive: isActive !== 'false',
      type: type as string
    });

    res.json(keywords);
  } catch (error) {
    logger.error('Error fetching keywords', { error });
    res.status(500).json({ error: 'Failed to fetch keywords' });
  }
});

// Update keyword
router.put('/keywords/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const keyword = await keywordService.update(req.params.id, req.body);

    if (!keyword) {
      res.status(404).json({ error: 'Keyword not found' });
      return;
    }

    res.json(keyword);
  } catch (error) {
    logger.error('Error updating keyword', { error });
    res.status(500).json({ error: 'Failed to update keyword' });
  }
});

// Delete keyword
router.delete('/keywords/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await keywordService.delete(req.params.id);

    if (!deleted) {
      res.status(404).json({ error: 'Keyword not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting keyword', { error });
    res.status(500).json({ error: 'Failed to delete keyword' });
  }
});

// Get keyword stats
router.get('/keywords/stats', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await keywordService.getKeywordStats(req.userId!);
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching keyword stats', { error });
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;