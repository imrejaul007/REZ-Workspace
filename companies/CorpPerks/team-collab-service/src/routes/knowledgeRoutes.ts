import { Router, Response } from 'express';
import { knowledgeService } from '../services/knowledgeService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// ============= ARTICLES =============

/**
 * POST /api/knowledge/articles
 * Create a new knowledge article
 */
router.post(
  '/articles',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId, title, content, summary, categoryId, tags, isPublished, attachments } = req.body;
    const user = req.user!;

    const article = await knowledgeService.createArticle({
      companyId,
      authorId: user.userId,
      authorName: user.name,
      title,
      content,
      summary,
      categoryId,
      tags,
      isPublished,
      attachments,
    });

    res.status(201).json({ success: true, data: article });
  })
);

/**
 * GET /api/knowledge/articles
 * Get articles with filters
 */
router.get(
  '/articles',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId, categoryId, tags, authorId, isPublished, search, page, limit } = req.query;

    if (!companyId) {
      res.status(400).json({ success: false, error: 'companyId is required' });
      return;
    }

    const result = await knowledgeService.getArticles(companyId as string, {
      categoryId: categoryId as string,
      tags: tags ? (tags as string).split(',') : undefined,
      authorId: authorId as string,
      isPublished: isPublished !== 'false',
      search: search as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: result.articles,
      pagination: { total: result.total, page: Number(page) || 1, limit: Number(limit) || 20 },
    });
  })
);

/**
 * GET /api/knowledge/articles/featured
 * Get featured articles
 */
router.get(
  '/articles/featured',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId, limit } = req.query;

    if (!companyId) {
      res.status(400).json({ success: false, error: 'companyId is required' });
      return;
    }

    const articles = await knowledgeService.getFeaturedArticles(
      companyId as string,
      limit ? parseInt(limit as string) : 10
    );

    res.json({ success: true, data: articles });
  })
);

/**
 * GET /api/knowledge/articles/:id
 * Get article by ID
 */
router.get(
  '/articles/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const article = await knowledgeService.getArticleById(req.params.id);

    // Track view
    await knowledgeService.trackView(req.params.id);

    res.json({ success: true, data: article });
  })
);

/**
 * PATCH /api/knowledge/articles/:id
 * Update article
 */
router.patch(
  '/articles/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const article = await knowledgeService.updateArticle(req.params.id, req.body);

    res.json({ success: true, data: article });
  })
);

/**
 * DELETE /api/knowledge/articles/:id
 * Delete article
 */
router.delete(
  '/articles/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await knowledgeService.deleteArticle(req.params.id);

    res.json({ success: true, message: 'Article deleted' });
  })
);

// ============= CATEGORIES =============

/**
 * POST /api/knowledge/categories
 * Create a new category
 */
router.post(
  '/categories',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const category = await knowledgeService.createCategory(req.body);

    res.status(201).json({ success: true, data: category });
  })
);

/**
 * GET /api/knowledge/categories
 * Get all categories
 */
router.get(
  '/categories',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId } = req.query;

    if (!companyId) {
      res.status(400).json({ success: false, error: 'companyId is required' });
      return;
    }

    const categories = await knowledgeService.getCategories(companyId as string);

    res.json({ success: true, data: categories });
  })
);

/**
 * GET /api/knowledge/categories/:id
 * Get category by ID
 */
router.get(
  '/categories/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const category = await knowledgeService.getCategoryById(req.params.id);

    res.json({ success: true, data: category });
  })
);

/**
 * PATCH /api/knowledge/categories/:id
 * Update category
 */
router.patch(
  '/categories/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const category = await knowledgeService.updateCategory(req.params.id, req.body);

    res.json({ success: true, data: category });
  })
);

/**
 * DELETE /api/knowledge/categories/:id
 * Delete category
 */
router.delete(
  '/categories/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await knowledgeService.deleteCategory(req.params.id);

    res.json({ success: true, message: 'Category deleted' });
  })
);

/**
 * GET /api/knowledge/categories/:id/articles
 * Get articles by category
 */
router.get(
  '/categories/:id/articles',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId, page, limit } = req.query;

    if (!companyId) {
      res.status(400).json({ success: false, error: 'companyId is required' });
      return;
    }

    const result = await knowledgeService.getArticles(companyId as string, {
      categoryId: req.params.id,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: result.articles,
      pagination: { total: result.total, page: Number(page) || 1, limit: Number(limit) || 20 },
    });
  })
);

/**
 * GET /api/knowledge/categories/stats
 * Get category statistics
 */
router.get(
  '/categories/stats',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId } = req.query;

    if (!companyId) {
      res.status(400).json({ success: false, error: 'companyId is required' });
      return;
    }

    const stats = await knowledgeService.getCategoryStats(companyId as string);

    res.json({ success: true, data: stats });
  })
);

export default router;
