import { Router, Request, Response } from 'express';
import { Article, IArticle } from '../models/article';

const router = Router();

// GET /articles - List articles
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      featured,
      status = 'published',
    } = req.query;

    const filter: Record<string, unknown> = { status };
    if (category) filter.category = category;
    if (featured !== undefined) filter.featured = featured === 'true';

    const articles = await Article.find(filter)
      .sort({ publishedAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .select('-content');

    const total = await Article.countDocuments(filter);

    res.json({
      articles,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// GET /articles/featured - Featured articles
router.get('/featured', async (_req: Request, res: Response) => {
  try {
    const articles = await Article.find({ featured: true, status: 'published' })
      .sort({ publishedAt: -1 })
      .limit(10)
      .select('-content');

    res.json({ articles });
  } catch (error) {
    logger.error('Error fetching featured articles:', error);
    res.status(500).json({ error: 'Failed to fetch featured articles' });
  }
});

// GET /articles/trending - Trending articles (most views)
router.get('/trending', async (_req: Request, res: Response) => {
  try {
    const articles = await Article.find({ status: 'published' })
      .sort({ views: -1 })
      .limit(20)
      .select('-content');

    res.json({ articles });
  } catch (error) {
    logger.error('Error fetching trending articles:', error);
    res.status(500).json({ error: 'Failed to fetch trending articles' });
  }
});

// GET /articles/:slug - Get article by slug
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const article = await Article.findOne({
      slug: req.params.slug,
      status: 'published',
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Increment views
    article.views += 1;
    await article.save();

    res.json({ article });
  } catch (error) {
    logger.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

// GET /articles/search - Search articles
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const articles = await Article.find({
      status: 'published',
      $text: { $search: String(q) },
    })
      .sort({ score: { $meta: 'textScore' } })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .select('-content');

    const total = await Article.countDocuments({
      status: 'published',
      $text: { $search: String(q) },
    });

    res.json({
      articles,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Error searching articles:', error);
    res.status(500).json({ error: 'Failed to search articles' });
  }
});

// POST /articles - Create article (internal)
router.post('/', async (req: Request, res: Response) => {
  try {
    const article = new Article(req.body);
    await article.save();
    res.status(201).json({ article });
  } catch (error) {
    logger.error('Error creating article:', error);
    res.status(500).json({ error: 'Failed to create article' });
  }
});

// GET /articles/recommendations - Personalized recommendations
router.get('/recommendations', async (req: Request, res: Response) => {
  try {
    const { userId, limit = 10 } = req.query;

    // Simple recommendation: return trending + featured + random
    const [trending, featured, recent] = await Promise.all([
      Article.find({ status: 'published' }).sort({ views: -1 }).limit(5).select('-content'),
      Article.find({ status: 'published', featured: true }).limit(5).select('-content'),
      Article.find({ status: 'published' }).sort({ publishedAt: -1 }).limit(5).select('-content'),
    ]);

    // Combine and deduplicate
    const seen = new Set();
    const recommendations = [...trending, ...featured, ...recent]
      .filter(article => {
        if (seen.has(String(article._id))) return false;
        seen.add(String(article._id));
        return true;
      })
      .slice(0, Number(limit));

    res.json({ articles: recommendations });
  } catch (error) {
    logger.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

export default router;
