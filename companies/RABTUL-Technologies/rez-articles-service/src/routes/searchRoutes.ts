import { Router, Request, Response } from 'express';

const router = Router();

// GET /articles/search?q=query - Search articles
router.get('/', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.json({ articles: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
    }

    // Search will be handled by articleRoutes with text index
    // This route is a fallback
    res.json({
      message: 'Use /articles endpoint with q parameter',
      articles: [],
    });
  } catch (error) {
    logger.error('Error searching articles:', error);
    res.status(500).json({ error: 'Failed to search articles' });
  }
});

export default router;
