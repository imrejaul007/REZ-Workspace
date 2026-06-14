/**
 * ADBAZAR Knowledge Base Service
 * Port: 4975
 *
 * Features:
 * - Article management
 * - Categories and tags
 * - Search functionality
 * - Content rating
 * - Version history
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';

// Types
interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary?: string;
  category: string;
  tags: string[];
  authorId: string;
  authorName?: string;
  status: 'draft' | 'published' | 'archived';
  visibility: 'public' | 'internal' | 'restricted';
  views: number;
  helpful: number;
  notHelpful: number;
  rating: number;
  relatedArticles: string[];
  attachments: string[];
  metadata: Record<string, string>;
  version: number;
  versions: ArticleVersion[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  archivedAt?: Date;
}

interface ArticleVersion {
  id: string;
  version: number;
  title: string;
  content: string;
  modifiedBy: string;
  modifiedAt: Date;
  changeNote?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId?: string;
  icon?: string;
  color?: string;
  order: number;
  articleCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  usageCount: number;
  createdAt: Date;
}

interface Comment {
  id: string;
  articleId: string;
  userId: string;
  userName?: string;
  content: string;
  upvotes: number;
  downvotes: number;
  isOfficial: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const app = express();
const PORT = parseInt(process.env.PORT || '4975', 10);

// In-memory stores
const articles = new Map<string, Article>();
const categories = new Map<string, Category>();
const tags = new Map<string, Tag>();
const comments = new Map<string, Comment>();

// Initialize default categories
const defaultCategories: Category[] = [
  { id: 'getting-started', name: 'Getting Started', slug: 'getting-started', description: 'Basic guides and tutorials', order: 1, articleCount: 0, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'account', name: 'Account & Billing', slug: 'account-billing', description: 'Account management and billing topics', order: 2, articleCount: 0, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'technical', name: 'Technical Support', slug: 'technical-support', description: 'Technical issues and troubleshooting', order: 3, articleCount: 0, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'features', name: 'Features & How-To', slug: 'features-how-to', description: 'Feature guides and how-to articles', order: 4, articleCount: 0, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'policies', name: 'Policies & Terms', slug: 'policies-terms', description: 'Company policies and terms of service', order: 5, articleCount: 0, isActive: true, createdAt: new Date(), updatedAt: new Date() },
];

defaultCategories.forEach(cat => categories.set(cat.id, cat));

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));

app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] || uuidv4();
  (req as any).requestId = requestId;
  res.setHeader('X-Request-Id', requestId as string);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'knowledge-base',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// ARTICLES
// ============================================

/**
 * POST /articles
 * Create article
 */
app.post('/articles', (req: Request, res: Response) => {
  try {
    const { title, content, summary, category, tags, visibility, metadata } = req.body;

    if (!title || !content) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'title and content are required' } });
      return;
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const article: Article = {
      id: uuidv4(),
      title,
      slug,
      content,
      summary: summary || content.substring(0, 200) + '...',
      category: category || 'general',
      tags: tags || [],
      authorId: req.headers['x-user-id'] as string || 'system',
      status: 'draft',
      visibility: visibility || 'public',
      views: 0,
      helpful: 0,
      notHelpful: 0,
      rating: 0,
      relatedArticles: [],
      attachments: [],
      metadata: metadata || {},
      version: 1,
      versions: [{
        id: uuidv4(),
        version: 1,
        title,
        content,
        modifiedBy: req.headers['x-user-id'] as string || 'system',
        modifiedAt: new Date(),
        changeNote: 'Initial version',
      }],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    articles.set(article.id, article);

    // Update category count
    const cat = categories.get(article.category);
    if (cat) cat.articleCount++;

    // Update tag counts
    for (const tagName of article.tags) {
      const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      let tag = Array.from(tags.values()).find(t => t.slug === tagSlug);
      if (tag) {
        tag.usageCount++;
      } else {
        tags.set(uuidv4(), {
          id: uuidv4(),
          name: tagName,
          slug: tagSlug,
          usageCount: 1,
          createdAt: new Date(),
        });
      }
    }

    res.json({ success: true, data: article });
  } catch (error) {
    logger.error('Create article error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create article' } });
  }
});

/**
 * GET /articles
 * List articles
 */
app.get('/articles', (req: Request, res: Response) => {
  const { status, category, tags, visibility, search, limit = 50, offset = 0 } = req.query;

  let list = Array.from(articles.values());

  if (status) list = list.filter(a => a.status === status);
  if (category) list = list.filter(a => a.category === category);
  if (visibility) list = list.filter(a => a.visibility === visibility);
  if (tags) {
    const tagList = (tags as string).split(',');
    list = list.filter(a => tagList.some(t => a.tags.includes(t)));
  }
  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      a.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  list.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  const total = list.length;
  list = list.slice(Number(offset), Number(offset) + Number(limit));

  res.json({ success: true, data: { articles: list, total, limit: Number(limit), offset: Number(offset) } });
});

/**
 * GET /articles/:id
 * Get article by ID
 */
app.get('/articles/:id', (req: Request, res: Response) => {
  const article = articles.get(req.params.id);

  if (!article) {
    // Try by slug
    const found = Array.from(articles.values()).find(a => a.slug === req.params.id);
    if (found) {
      found.views++;
      res.json({ success: true, data: found });
      return;
    }

    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Article not found' } });
    return;
  }

  article.views++;
  res.json({ success: true, data: article });
});

/**
 * PATCH /articles/:id
 * Update article
 */
app.patch('/articles/:id', (req: Request, res: Response) => {
  const article = articles.get(req.params.id);

  if (!article) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Article not found' } });
    return;
  }

  const { title, content, summary, category, tags, visibility, status, metadata, changeNote } = req.body;
  const modifiedBy = req.headers['x-user-id'] as string || 'system';

  if (title || content) {
    article.version++;
    article.versions.push({
      id: uuidv4(),
      version: article.version,
      title: title || article.title,
      content: content || article.content,
      modifiedBy,
      modifiedAt: new Date(),
      changeNote: changeNote || 'Updated article',
    });
  }

  if (title) { article.title = title; article.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-'); }
  if (content !== undefined) article.content = content;
  if (summary !== undefined) article.summary = summary;
  if (category !== undefined) {
    const oldCat = categories.get(article.category);
    if (oldCat) oldCat.articleCount--;
    article.category = category;
    const newCat = categories.get(category);
    if (newCat) newCat.articleCount++;
  }
  if (tags !== undefined) article.tags = tags;
  if (visibility !== undefined) article.visibility = visibility;
  if (status !== undefined) {
    if (status === 'published' && article.status !== 'published') {
      article.publishedAt = new Date();
    }
    if (status === 'archived' && article.status !== 'archived') {
      article.archivedAt = new Date();
    }
    article.status = status;
  }
  if (metadata) article.metadata = { ...article.metadata, ...metadata };
  article.updatedAt = new Date();

  res.json({ success: true, data: article });
});

/**
 * DELETE /articles/:id
 * Delete article
 */
app.delete('/articles/:id', (req: Request, res: Response) => {
  const article = articles.get(req.params.id);

  if (article) {
    const cat = categories.get(article.category);
    if (cat) cat.articleCount--;
    articles.delete(req.params.id);
  }

  res.json({ success: true, data: { deleted: true } });
});

/**
 * POST /articles/:id/publish
 * Publish article
 */
app.post('/articles/:id/publish', (req: Request, res: Response) => {
  const article = articles.get(req.params.id);

  if (!article) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Article not found' } });
    return;
  }

  article.status = 'published';
  article.publishedAt = new Date();
  article.updatedAt = new Date();

  res.json({ success: true, data: article });
});

/**
 * POST /articles/:id/archive
 * Archive article
 */
app.post('/articles/:id/archive', (req: Request, res: Response) => {
  const article = articles.get(req.params.id);

  if (!article) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Article not found' });
    return;
  }

  article.status = 'archived';
  article.archivedAt = new Date();
  article.updatedAt = new Date();

  res.json({ success: true, data: article });
});

/**
 * POST /articles/:id/rate
 * Rate article
 */
app.post('/articles/:id/rate', (req: Request, res: Response) => {
  const article = articles.get(req.params.id);

  if (!article) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Article not found' } });
    return;
  }

  const { helpful } = req.body;

  if (helpful) {
    article.helpful++;
  } else {
    article.notHelpful++;
  }

  // Calculate rating
  const total = article.helpful + article.notHelpful;
  article.rating = total > 0 ? Math.round((article.helpful / total) * 100) : 0;
  article.updatedAt = new Date();

  res.json({ success: true, data: { helpful: article.helpful, notHelpful: article.notHelpful, rating: article.rating } });
});

/**
 * GET /articles/:id/versions
 * Get article version history
 */
app.get('/articles/:id/versions', (req: Request, res: Response) => {
  const article = articles.get(req.params.id);

  if (!article) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Article not found' } });
    return;
  }

  res.json({ success: true, data: { versions: article.versions, currentVersion: article.version } });
});

/**
 * POST /articles/:id/related
 * Link related articles
 */
app.post('/articles/:id/related', (req: Request, res: Response) => {
  const article = articles.get(req.params.id);

  if (!article) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Article not found' } });
    return;
  }

  const { relatedIds } = req.body;

  if (!relatedIds || !Array.isArray(relatedIds)) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'relatedIds array is required' } });
    return;
  }

  article.relatedArticles = [...new Set([...article.relatedArticles, ...relatedIds])];
  article.updatedAt = new Date();

  res.json({ success: true, data: article });
});

// ============================================
// CATEGORIES
// ============================================

/**
 * POST /categories
 * Create category
 */
app.post('/categories', (req: Request, res: Response) => {
  const { name, description, parentId, icon, color, order } = req.body;

  if (!name) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'name is required' } });
    return;
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const category: Category = {
    id: uuidv4(),
    name,
    slug,
    description: description || '',
    parentId,
    icon,
    color,
    order: order || categories.size + 1,
    articleCount: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  categories.set(category.id, category);

  res.json({ success: true, data: category });
});

/**
 * GET /categories
 * List categories
 */
app.get('/categories', (req: Request, res: Response) => {
  const { isActive } = req.query;

  let list = Array.from(categories.values());

  if (isActive !== undefined) list = list.filter(c => c.isActive === (isActive === 'true'));

  list.sort((a, b) => a.order - b.order);

  res.json({ success: true, data: { categories: list, total: list.length } });
});

/**
 * GET /categories/:id
 * Get category by ID
 */
app.get('/categories/:id', (req: Request, res: Response) => {
  const category = categories.get(req.params.id);

  if (!category) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } });
    return;
  }

  // Get articles in this category
  const categoryArticles = Array.from(articles.values()).filter(a => a.category === category.id);

  res.json({ success: true, data: { ...category, articles: categoryArticles } });
});

/**
 * PATCH /categories/:id
 * Update category
 */
app.patch('/categories/:id', (req: Request, res: Response) => {
  const category = categories.get(req.params.id);

  if (!category) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } });
    return;
  }

  const { name, description, parentId, icon, color, order, isActive } = req.body;

  if (name) { category.name = name; category.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-'); }
  if (description !== undefined) category.description = description;
  if (parentId !== undefined) category.parentId = parentId;
  if (icon !== undefined) category.icon = icon;
  if (color !== undefined) category.color = color;
  if (order !== undefined) category.order = order;
  if (isActive !== undefined) category.isActive = isActive;
  category.updatedAt = new Date();

  res.json({ success: true, data: category });
});

// ============================================
// TAGS
// ============================================

/**
 * GET /tags
 * List tags
 */
app.get('/tags', (req: Request, res: Response) => {
  const { search, limit = 50 } = req.query;

  let list = Array.from(tags.values());

  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter(t => t.name.toLowerCase().includes(q));
  }

  list.sort((a, b) => b.usageCount - a.usageCount);
  list = list.slice(0, Number(limit));

  res.json({ success: true, data: { tags: list, total: list.length } });
});

/**
 * GET /tags/:slug/articles
 * Get articles by tag
 */
app.get('/tags/:slug/articles', (req: Request, res: Response) => {
  const tag = Array.from(tags.values()).find(t => t.slug === req.params.slug);

  if (!tag) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Tag not found' } });
    return;
  }

  const tagArticles = Array.from(articles.values()).filter(a => a.tags.includes(tag.name));

  res.json({ success: true, data: { tag, articles: tagArticles, total: tagArticles.length } });
});

// ============================================
// COMMENTS
// ============================================

/**
 * POST /articles/:id/comments
 * Add comment to article
 */
app.post('/articles/:id/comments', (req: Request, res: Response) => {
  const article = articles.get(req.params.id);

  if (!article) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Article not found' } });
    return;
  }

  const { content, isOfficial } = req.body;

  if (!content) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'content is required' } });
    return;
  }

  const comment: Comment = {
    id: uuidv4(),
    articleId: article.id,
    userId: req.headers['x-user-id'] as string || 'anonymous',
    content,
    upvotes: 0,
    downvotes: 0,
    isOfficial: isOfficial || false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  comments.set(comment.id, comment);

  res.json({ success: true, data: comment });
});

/**
 * GET /articles/:id/comments
 * Get article comments
 */
app.get('/articles/:id/comments', (req: Request, res: Response) => {
  const list = Array.from(comments.values()).filter(c => c.articleId === req.params.id);

  list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  res.json({ success: true, data: { comments: list, total: list.length } });
});

/**
 * POST /comments/:id/vote
 * Vote on comment
 */
app.post('/comments/:id/vote', (req: Request, res: Response) => {
  const comment = comments.get(req.params.id);

  if (!comment) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Comment not found' } });
    return;
  }

  const { upvotes, downvotes } = req.body;

  if (upvotes !== undefined) comment.upvotes = upvotes;
  if (downvotes !== undefined) comment.downvotes = downvotes;

  res.json({ success: true, data: comment });
});

// ============================================
// SEARCH
// ============================================

/**
 * GET /search
 * Search articles
 */
app.get('/search', (req: Request, res: Response) => {
  const { q, category, tags, status, limit = 20 } = req.query;

  if (!q) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'q (query) is required' } });
    return;
  }

  const query = (q as string).toLowerCase();
  let results = Array.from(articles.values()).filter(a =>
    a.title.toLowerCase().includes(query) ||
    a.content.toLowerCase().includes(query) ||
    a.summary?.toLowerCase().includes(query) ||
    a.tags.some(t => t.toLowerCase().includes(query))
  );

  if (category) results = results.filter(a => a.category === category);
  if (tags) {
    const tagList = (tags as string).split(',');
    results = results.filter(a => tagList.some(t => a.tags.includes(t)));
  }
  if (status) results = results.filter(a => a.status === status);

  // Sort by relevance (views + rating)
  results.sort((a, b) => {
    const scoreA = a.views + (a.rating * 10);
    const scoreB = b.views + (b.rating * 10);
    return scoreB - scoreA;
  });

  results = results.slice(0, Number(limit));

  res.json({
    success: true,
    data: {
      results,
      total: results.length,
      query: q,
      suggestions: [],
    },
  });
});

/**
 * GET /search/suggest
 * Get search suggestions
 */
app.get('/search/suggest', (req: Request, res: Response) => {
  const { q } = req.query;

  if (!q || (q as string).length < 2) {
    res.json({ success: true, data: { suggestions: [] } });
    return;
  }

  const query = (q as string).toLowerCase();

  // Get suggestions from article titles
  const titleSuggestions = Array.from(articles.values())
    .filter(a => a.title.toLowerCase().includes(query))
    .slice(0, 5)
    .map(a => a.title);

  // Get suggestions from tags
  const tagSuggestions = Array.from(tags.values())
    .filter(t => t.name.toLowerCase().includes(query))
    .slice(0, 5)
    .map(t => t.name);

  res.json({
    success: true,
    data: {
      suggestions: [...new Set([...titleSuggestions, ...tagSuggestions])].slice(0, 10),
    },
  });
});

// ============================================
// POPULAR & RELATED
// ============================================

/**
 * GET /popular
 * Get popular articles
 */
app.get('/popular', (req: Request, res: Response) => {
  const { limit = 10, period } = req.query;

  const list = Array.from(articles.values())
    .filter(a => a.status === 'published')
    .sort((a, b) => b.views - a.views)
    .slice(0, Number(limit));

  res.json({ success: true, data: { articles: list, total: list.length } });
});

/**
 * GET /related/:id
 * Get related articles
 */
app.get('/related/:id', (req: Request, res: Response) => {
  const article = articles.get(req.params.id);

  if (!article) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Article not found' } });
    return;
  }

  // Get related from same category
  const sameCategory = Array.from(articles.values())
    .filter(a => a.id !== article.id && a.category === article.category && a.status === 'published')
    .slice(0, 5);

  // Get related from linked articles
  const linked = article.relatedArticles
    .map(id => articles.get(id))
    .filter(a => a && a.status === 'published');

  const related = [...new Set([...linked, ...sameCategory])].slice(0, 10);

  res.json({ success: true, data: { articles: related, total: related.length } });
});

// ============================================
// STATISTICS
// ============================================

/**
 * GET /stats
 * Get knowledge base statistics
 */
app.get('/stats', (req: Request, res: Response) => {
  const publishedArticles = Array.from(articles.values()).filter(a => a.status === 'published');

  res.json({
    success: true,
    data: {
      articles: {
        total: articles.size,
        published: publishedArticles.length,
        draft: Array.from(articles.values()).filter(a => a.status === 'draft').length,
        archived: Array.from(articles.values()).filter(a => a.status === 'archived').length,
      },
      categories: {
        total: categories.size,
        active: Array.from(categories.values()).filter(c => c.isActive).length,
      },
      tags: {
        total: tags.size,
      },
      comments: {
        total: comments.size,
      },
      engagement: {
        totalViews: Array.from(articles.values()).reduce((sum, a) => sum + a.views, 0),
        avgRating: publishedArticles.length > 0
          ? Math.round(publishedArticles.reduce((sum, a) => sum + a.rating, 0) / publishedArticles.length)
          : 0,
        totalHelpful: Array.from(articles.values()).reduce((sum, a) => sum + a.helpful, 0),
      },
    },
  });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', { error: err instanceof Error ? err.message : String(err) });
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
  });
});

// Startup
app.listen(PORT, () => {
  logger.info(`
╔══════════════════════════════════════════════════════════════════╗
║                   ADBAZAR Knowledge Base Service                 ║
╠══════════════════════════════════════════════════════════════════╣
║  Status:      RUNNING                                          ║
║  Port:        ${PORT}                                                  ║
║  Version:     1.0.0                                           ║
╠════════���═════════════════════════════════════════════════════════╣
║  Endpoints:                                                 ║
║  POST /articles           - Create article                    ║
║  GET  /articles           - List articles                     ║
║  GET  /articles/:id       - Get article                       ║
║  PATCH /articles/:id     - Update article                   ║
║  POST /articles/:id/rate  - Rate article                     ║
║  GET  /categories        - List categories                   ║
║  GET  /search            - Search articles                   ║
║  GET  /popular           - Popular articles                  ║
║  GET  /stats             - Statistics                        ║
╚══════════════════════════════════════════════════════════════════╝
  `);
});

export default app;