import { Router, Request, Response, NextFunction } from 'express';
import { taxonomyService } from '../services/taxonomyService';
import { authMiddleware, validateBody, createTaxonomySchema, createTagSchema, createCategorySchema } from '../middleware/auth';
import { logger } from 'utils/logger.js';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

router.post('/', validateBody(createTaxonomySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taxonomy = await taxonomyService.createTaxonomy(req.body);
    res.status(201).json({ success: true, data: taxonomy });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = req.query.type as string;
    const taxonomy = await taxonomyService.findAllTaxonomy(type);
    res.json({ success: true, data: taxonomy });
  } catch (error) {
    next(error);
  }
});

router.get('/tree', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = req.query.type as string;
    const tree = await taxonomyService.getTaxonomyTree(type);
    res.json({ success: true, data: tree });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taxonomy = await taxonomyService.findTaxonomyById(req.params.id);
    if (!taxonomy) return res.status(404).json({ success: false, error: 'Taxonomy not found' });
    res.json({ success: true, data: taxonomy });
  } catch (error) {
    next(error);
  }
});

// Tag routes
router.post('/tags', validateBody(createTagSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tag = await taxonomyService.createTag(req.body);
    res.status(201).json({ success: true, data: tag });
  } catch (error) {
    next(error);
  }
});

router.get('/tags/list', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = req.query.type as string;
    const tags = await taxonomyService.findAllTags(type);
    res.json({ success: true, data: tags });
  } catch (error) {
    next(error);
  }
});

// Category routes
router.post('/categories', validateBody(createCategorySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await taxonomyService.createCategory(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
});

router.get('/categories/list', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parentId = req.query.parentId as string;
    const categories = await taxonomyService.findAllCategories(parentId);
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
});

export const taxonomyRoutes = router;