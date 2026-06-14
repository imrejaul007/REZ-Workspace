import { Router, Response } from 'express';
import { sentimentService } from '../services';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { createChildLogger } from 'utils/logger.js';

const logger = createChildLogger('SentimentRoutes');
const router = Router();

// Get sentiment trends
router.get('/trends', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { keywordId, startDate, endDate } = req.query;

    const trends = await sentimentService.getSentimentTrends(req.userId!, {
      keywordId: keywordId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });

    res.json(trends);
  } catch (error) {
    logger.error('Error fetching sentiment trends', { error });
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// Get sentiment summary
router.get('/summary', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { keywordId } = req.query;
    const summary = await sentimentService.getSentimentSummary(
      req.userId!,
      keywordId as string | undefined
    );
    res.json(summary);
  } catch (error) {
    logger.error('Error fetching sentiment summary', { error });
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// Analyze text
router.post('/analyze', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { content, keywordId, mentionId, platform } = req.body;

    if (!content) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }

    const analysis = await sentimentService.analyzeAndRecord({
      userId: req.userId!,
      keywordId,
      mentionId,
      platform: platform || 'all',
      content
    });

    res.json(analysis);
  } catch (error) {
    logger.error('Error analyzing sentiment', { error });
    res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
});

export default router;