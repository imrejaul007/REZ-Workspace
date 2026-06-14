import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Category } from '../models/Category';
import { logger } from '../utils/logger';
import { redisClient } from '../config/redis';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  parentId: z.string().uuid().optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});

const updateCategorySchema = createCategorySchema.partial().omit({ parentId: true });

// Helper to generate slug
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

/**
 * GET /api/categories
 * Get all categories (tree structure or flat list)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { tree, active } = req.query;
    const treeMode = tree === 'true';
    const activeOnly = active !== 'false';

    const cacheKey = `categories:${treeMode ? 'tree' : 'flat'}:${activeOnly}`;

    // Try cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached) });
      return;
    }

    let result;
    if (treeMode) {
      result = await Category.getCategoryTree(activeOnly);
    } else {
      const query = activeOnly ? { isActive: true } : {};
      result = await Category.find(query).sort({ sortOrder: 1, name: 1 });
      result = result.map(c => c.toJSON());
    }

    // Cache for 1 hour
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(result));

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/categories/:id
 * Get category by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const category = await Category.findOne({ id: req.params.id });

    if (!category) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    // Get children
    const children = await Category.find({ parentId: category.id }).sort({ sortOrder: 1 });

    res.json({
      success: true,
      data: {
        ...category.toJSON(),
        children: children.map(c => c.toJSON()),
      },
    });
  } catch (error) {
    logger.error('Error fetching category:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/categories/slug/:slug
 * Get category by slug
 */
router.get('/slug/:slug', async (req: Request, res: Response) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });

    if (!category) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    res.json({ success: true, data: category.toJSON() });
  } catch (error) {
    logger.error('Error fetching category by slug:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/categories
 * Create a new category
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validated = createCategorySchema.parse(req.body);

    // Generate slug if not provided
    if (!validated.slug) {
      validated.slug = generateSlug(validated.name);
    }

    // Check for duplicate slug
    const existing = await Category.findOne({ slug: validated.slug });
    if (existing) {
      res.status(400).json({ success: false, error: 'Category with this slug already exists' });
      return;
    }

    // Validate parent exists if provided
    if (validated.parentId) {
      const parent = await Category.findOne({ id: validated.parentId });
      if (!parent) {
        res.status(400).json({ success: false, error: 'Parent category not found' });
        return;
      }
    }

    const category = new Category({
      ...validated,
      id: uuidv4(),
    });
    await category.save();

    // Invalidate cache
    await invalidateCategoryCache();

    res.status(201).json({ success: true, data: category.toJSON() });
  } catch (error) {
    logger.error('Error creating category:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * PUT /api/categories/:id
 * Update a category
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const validated = updateCategorySchema.parse(req.body);

    const category = await Category.findOne({ id: req.params.id });
    if (!category) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    // Update slug if name changed
    if (validated.name && !validated.slug) {
      validated.slug = generateSlug(validated.name);
    }

    // Check for duplicate slug
    if (validated.slug) {
      const existing = await Category.findOne({ slug: validated.slug, id: { $ne: req.params.id } });
      if (existing) {
        res.status(400).json({ success: false, error: 'Category with this slug already exists' });
        return;
      }
    }

    Object.assign(category, validated);
    await category.save();

    // Invalidate cache
    await invalidateCategoryCache();

    res.json({ success: true, data: category.toJSON() });
  } catch (error) {
    logger.error('Error updating category:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * DELETE /api/categories/:id
 * Delete a category (soft delete)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const category = await Category.findOne({ id: req.params.id });
    if (!category) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    // Check for children
    const children = await Category.find({ parentId: req.params.id });
    if (children.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete category with children. Delete or reassign children first.',
      });
      return;
    }

    category.isActive = false;
    await category.save();

    // Invalidate cache
    await invalidateCategoryCache();

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    logger.error('Error deleting category:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/categories/:id/descendants
 * Get all descendants of a category
 */
router.get('/:id/descendants', async (req: Request, res: Response) => {
  try {
    const descendants = await Category.getDescendants(req.params.id);
    res.json({ success: true, data: descendants });
  } catch (error) {
    logger.error('Error fetching descendants:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /api/categories/:id/reorder
 * Reorder categories under a parent
 */
router.put('/:id/reorder', async (req: Request, res: Response) => {
  try {
    const { sortOrder } = z.object({ sortOrder: z.number().int() }).parse(req.body);

    const category = await Category.findOne({ id: req.params.id });
    if (!category) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    category.sortOrder = sortOrder;
    await category.save();

    // Invalidate cache
    await invalidateCategoryCache();

    res.json({ success: true, data: category.toJSON() });
  } catch (error) {
    logger.error('Error reordering category:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

// Helper function to invalidate category cache
async function invalidateCategoryCache(): Promise<void> {
  try {
    const keys = await redisClient.keys('categories:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    logger.warn('Category cache invalidation failed:', error);
  }
}

export default router;
