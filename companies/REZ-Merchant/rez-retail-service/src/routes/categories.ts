import { Router, Request, Response, NextFunction } from 'express';
import { Category } from '../models';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/categories - List all categories
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { level, parentId, isActive } = req.query;

    const query: any = {};
    if (level !== undefined) query.level = parseInt(level as string, 10);
    if (parentId !== undefined) query.parentId = parentId === 'null' ? null : parentId;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const categories = await Category.find(query).sort({ name: 1 });

    res.json({
      success: true,
      data: categories,
      count: categories.length,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/categories/:id - Get single category
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404).json({
        success: false,
        error: 'Category not found',
      });
      return;
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/categories/:id/subcategories - Get subcategories
router.get('/:id/subcategories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subcategories = await Category.find({ parentId: req.params.id, isActive: true })
      .sort({ name: 1 });

    res.json({
      success: true,
      data: subcategories,
      count: subcategories.length,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/categories - Create category
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let level = 0;
    if (req.body.parentId) {
      const parent = await Category.findById(req.body.parentId);
      if (parent) {
        level = parent.level + 1;
      }
    }

    const category = new Category({
      ...req.body,
      level,
    });
    await category.save();

    logger.info('Category created', { categoryId: category._id, name: category.name });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/categories/:id - Update category
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!category) {
      res.status(404).json({
        success: false,
        error: 'Category not found',
      });
      return;
    }

    logger.info('Category updated', { categoryId: category._id });

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/categories/:id - Deactivate category
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!category) {
      res.status(404).json({
        success: false,
        error: 'Category not found',
      });
      return;
    }

    logger.info('Category deactivated', { categoryId: category._id });

    res.json({
      success: true,
      message: 'Category deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;