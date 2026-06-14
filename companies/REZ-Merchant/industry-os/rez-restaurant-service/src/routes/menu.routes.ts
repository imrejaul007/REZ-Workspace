/**
 * Menu Routes
 *
 * Endpoints for menu management
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { rateLimiters } from '../middleware/rateLimiter';
import { menuService } from '../services/MenuService';
import { logger } from '../config/logger';

const log = (msg: string, meta?) => logger.info(`[menu-routes] ${msg}`, meta);
const router = Router();

// ─── Validation Schemas ────────────────────────────────────────────────────────

const menuItemSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().positive(),
  priceUnit: z.enum(['INR', 'USD']).default('INR'),
  images: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  spices: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  preparationTime: z.number().positive().optional(),
  calories: z.number().positive().optional(),
  customization: z.object({
    required: z.boolean().default(false),
    options: z.array(z.object({
      name: z.string(),
      priceModifier: z.number(),
    })),
  }).optional(),
});

const categorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().default(true),
});

const createMenuSchema = z.object({
  restaurantId: z.string(),
  branchId: z.string().optional(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  categories: z.array(categorySchema).optional(),
});

const updateMenuSchema = createMenuSchema.partial().omit({ restaurantId: true });

// ─── Public Routes ────────────────────────────────────────────────────────────

/**
 * Get menu for restaurant
 * GET /api/menus/restaurant/:restaurantId
 */
router.get('/restaurant/:restaurantId', rateLimiters.menu, async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const { branchId } = req.query;

    const menu = await menuService.getMenuByRestaurant(
      restaurantId,
      branchId as string | undefined
    );

    if (!menu) {
      res.status(404).json({ success: false, message: 'Menu not found' });
      return;
    }

    res.json({ success: true, data: menu });
  } catch (error) {
    log('Get menu error:', error);
    res.status(500).json({ success: false, message: 'Failed to get menu' });
  }
});

/**
 * Get available items from menu
 * GET /api/menus/:menuId/available
 */
router.get('/:menuId/available', async (req: Request, res: Response) => {
  try {
    const items = await menuService.getAvailableItems(req.params.menuId);

    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    log('Get available items error:', error);
    res.status(500).json({ success: false, message: 'Failed to get items' });
  }
});

// ─── Protected Routes ───────────────────────────────────────────────────────────

/**
 * Create menu
 * POST /api/menus
 */
router.post('/', authenticateToken, requireRoles('admin', 'restaurant_owner', 'staff'), async (req: Request, res: Response) => {
  try {
    const input = createMenuSchema.parse(req.body);

    const menu = await menuService.createMenu(input as unknown);

    res.status(201).json({
      success: true,
      data: menu,
      message: 'Menu created successfully',
    });
  } catch (error) {
    log('Create menu error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to create menu' });
  }
});

/**
 * Get menu by ID
 * GET /api/menus/:menuId
 */
router.get('/:menuId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const menu = await menuService.getMenu(req.params.menuId);

    if (!menu) {
      res.status(404).json({ success: false, message: 'Menu not found' });
      return;
    }

    res.json({ success: true, data: menu });
  } catch (error) {
    log('Get menu error:', error);
    res.status(500).json({ success: false, message: 'Failed to get menu' });
  }
});

/**
 * Update menu
 * PUT /api/menus/:menuId
 */
router.put('/:menuId', authenticateToken, requireRoles('admin', 'restaurant_owner', 'staff'), async (req: Request, res: Response) => {
  try {
    const input = updateMenuSchema.parse(req.body);

    const menu = await menuService.updateMenu(req.params.menuId, input);

    if (!menu) {
      res.status(404).json({ success: false, message: 'Menu not found' });
      return;
    }

    res.json({
      success: true,
      data: menu,
      message: 'Menu updated successfully',
    });
  } catch (error) {
    log('Update menu error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to update menu' });
  }
});

/**
 * Delete menu
 * DELETE /api/menus/:menuId
 */
router.delete('/:menuId', authenticateToken, requireRoles('admin', 'restaurant_owner'), async (req: Request, res: Response) => {
  try {
    const deleted = await menuService.deleteMenu(req.params.menuId);

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Menu not found' });
      return;
    }

    res.json({ success: true, message: 'Menu deleted successfully' });
  } catch (error) {
    log('Delete menu error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete menu' });
  }
});

// ─── Category Routes ───────────────────────────────────────────────────────────

/**
 * Add category to menu
 * POST /api/menus/:menuId/categories
 */
router.post('/:menuId/categories', authenticateToken, requireRoles('admin', 'restaurant_owner', 'staff'), async (req: Request, res: Response) => {
  try {
    const category = categorySchema.parse(req.body);

    const menu = await menuService.addCategory(req.params.menuId, category);

    if (!menu) {
      res.status(404).json({ success: false, message: 'Menu not found' });
      return;
    }

    res.status(201).json({
      success: true,
      data: menu,
      message: 'Category added successfully',
    });
  } catch (error) {
    log('Add category error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to add category' });
  }
});

/**
 * Update category
 * PUT /api/menus/:menuId/categories/:categoryId
 */
router.put('/:menuId/categories/:categoryId', authenticateToken, requireRoles('admin', 'restaurant_owner', 'staff'), async (req: Request, res: Response) => {
  try {
    const menu = await menuService.updateCategory(
      req.params.menuId,
      req.params.categoryId,
      req.body
    );

    if (!menu) {
      res.status(404).json({ success: false, message: 'Menu or category not found' });
      return;
    }

    res.json({
      success: true,
      data: menu,
      message: 'Category updated successfully',
    });
  } catch (error) {
    log('Update category error:', error);
    res.status(500).json({ success: false, message: 'Failed to update category' });
  }
});

/**
 * Remove category
 * DELETE /api/menus/:menuId/categories/:categoryId
 */
router.delete('/:menuId/categories/:categoryId', authenticateToken, requireRoles('admin', 'restaurant_owner', 'staff'), async (req: Request, res: Response) => {
  try {
    const menu = await menuService.removeCategory(
      req.params.menuId,
      req.params.categoryId
    );

    if (!menu) {
      res.status(404).json({ success: false, message: 'Menu or category not found' });
      return;
    }

    res.json({ success: true, message: 'Category removed successfully' });
  } catch (error) {
    log('Remove category error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove category' });
  }
});

// ─── Item Routes ───────────────────────────────────────────────────────────────

/**
 * Add item to category
 * POST /api/menus/:menuId/categories/:categoryId/items
 */
router.post('/:menuId/categories/:categoryId/items', authenticateToken, requireRoles('admin', 'restaurant_owner', 'staff'), async (req: Request, res: Response) => {
  try {
    const item = menuItemSchema.parse(req.body);

    const menu = await menuService.addItem(
      req.params.menuId,
      req.params.categoryId,
      item
    );

    if (!menu) {
      res.status(404).json({ success: false, message: 'Menu or category not found' });
      return;
    }

    res.status(201).json({
      success: true,
      data: menu,
      message: 'Item added successfully',
    });
  } catch (error) {
    log('Add item error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to add item' });
  }
});

/**
 * Update item
 * PUT /api/menus/:menuId/categories/:categoryId/items/:itemId
 */
router.put('/:menuId/categories/:categoryId/items/:itemId', authenticateToken, requireRoles('admin', 'restaurant_owner', 'staff'), async (req: Request, res: Response) => {
  try {
    const menu = await menuService.updateItem(
      req.params.menuId,
      req.params.categoryId,
      req.params.itemId,
      req.body
    );

    if (!menu) {
      res.status(404).json({ success: false, message: 'Menu, category, or item not found' });
      return;
    }

    res.json({
      success: true,
      data: menu,
      message: 'Item updated successfully',
    });
  } catch (error) {
    log('Update item error:', error);
    res.status(500).json({ success: false, message: 'Failed to update item' });
  }
});

/**
 * Remove item
 * DELETE /api/menus/:menuId/categories/:categoryId/items/:itemId
 */
router.delete('/:menuId/categories/:categoryId/items/:itemId', authenticateToken, requireRoles('admin', 'restaurant_owner', 'staff'), async (req: Request, res: Response) => {
  try {
    const menu = await menuService.removeItem(
      req.params.menuId,
      req.params.categoryId,
      req.params.itemId
    );

    if (!menu) {
      res.status(404).json({ success: false, message: 'Menu, category, or item not found' });
      return;
    }

    res.json({ success: true, message: 'Item removed successfully' });
  } catch (error) {
    log('Remove item error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove item' });
  }
});

/**
 * Toggle item availability
 * PATCH /api/menus/:menuId/categories/:categoryId/items/:itemId/availability
 */
router.patch('/:menuId/categories/:categoryId/items/:itemId/availability', authenticateToken, requireRoles('admin', 'restaurant_owner', 'staff'), async (req: Request, res: Response) => {
  try {
    const menu = await menuService.toggleItemAvailability(
      req.params.menuId,
      req.params.categoryId,
      req.params.itemId
    );

    if (!menu) {
      res.status(404).json({ success: false, message: 'Menu, category, or item not found' });
      return;
    }

    res.json({
      success: true,
      data: menu,
      message: 'Item availability toggled',
    });
  } catch (error) {
    log('Toggle item availability error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle availability' });
  }
});

export default router;
