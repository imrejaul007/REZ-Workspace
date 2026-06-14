import { Router, Request, Response, NextFunction } from 'express';
import { menuService } from '../services/menuService';
import { recommendationService } from '../services/recommendation';
import {
  CreateMenuRequest,
  UpdateMenuRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateItemRequest,
  UpdateItemRequest,
  ToggleAvailabilityRequest,
  RecommendationRequest,
  AnalyticsQuery,
} from '../types';
import { ZodError } from 'zod';

const router = Router();

// Error handling middleware
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.errors,
      },
    });
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: err.message || 'Internal server error',
    },
  });
};

// ==================== MENU ROUTES ====================

// Create a new menu
router.post('/menus', asyncHandler(async (req: Request, res: Response) => {
  const data: CreateMenuRequest = req.body;

  if (!data.restaurantId || !data.name) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_FIELDS',
        message: 'restaurantId and name are required',
      },
    });
  }

  const menu = await menuService.createMenu(data);

  res.status(201).json({
    success: true,
    data: menu,
  });
}));

// Get all menus
router.get('/menus', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = req.query.restaurantId as string | undefined;
  const menus = await menuService.getAllMenus(restaurantId);

  res.json({
    success: true,
    data: menus,
    meta: {
      total: menus.length,
    },
  });
}));

// Get menu by ID
router.get('/menus/:id', asyncHandler(async (req: Request, res: Response) => {
  const menu = await menuService.getMenu(req.params.id);

  if (!menu) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Menu not found',
      },
    });
  }

  res.json({
    success: true,
    data: menu,
  });
}));

// Get menu by restaurant ID
router.get('/restaurants/:restaurantId/menu', asyncHandler(async (req: Request, res: Response) => {
  const menu = await menuService.getMenuByRestaurant(req.params.restaurantId);

  if (!menu) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Menu not found for this restaurant',
      },
    });
  }

  res.json({
    success: true,
    data: menu,
  });
}));

// Update menu
router.patch('/menus/:id', asyncHandler(async (req: Request, res: Response) => {
  const data: UpdateMenuRequest = req.body;
  const menu = await menuService.updateMenu(req.params.id, data);

  if (!menu) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Menu not found',
      },
    });
  }

  res.json({
    success: true,
    data: menu,
  });
}));

// Delete menu
router.delete('/menus/:id', asyncHandler(async (req: Request, res: Response) => {
  const deleted = await menuService.deleteMenu(req.params.id);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Menu not found',
      },
    });
  }

  res.status(204).send();
}));

// Publish menu
router.post('/menus/:id/publish', asyncHandler(async (req: Request, res: Response) => {
  const menu = await menuService.publishMenu(req.params.id);

  if (!menu) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Menu not found',
      },
    });
  }

  res.json({
    success: true,
    data: menu,
  });
}));

// Duplicate menu
router.post('/menus/:id/duplicate', asyncHandler(async (req: Request, res: Response) => {
  const { newName } = req.body;

  if (!newName) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_FIELD',
        message: 'newName is required',
      },
    });
  }

  const menu = await menuService.duplicateMenu(req.params.id, newName);

  if (!menu) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Menu not found',
      },
    });
  }

  res.status(201).json({
    success: true,
    data: menu,
  });
}));

// Get menu statistics
router.get('/menus/:id/statistics', asyncHandler(async (req: Request, res: Response) => {
  const stats = await menuService.getMenuStatistics(req.params.id);

  res.json({
    success: true,
    data: stats,
  });
}));

// ==================== CATEGORY ROUTES ====================

// Create category
router.post('/menus/:menuId/categories', asyncHandler(async (req: Request, res: Response) => {
  const data: CreateCategoryRequest = {
    ...req.body,
    menuId: req.params.menuId,
  };

  const category = await menuService.createCategory(data);

  if (!category) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Menu not found',
      },
    });
  }

  res.status(201).json({
    success: true,
    data: category,
  });
}));

// Get categories for a menu
router.get('/menus/:menuId/categories', asyncHandler(async (req: Request, res: Response) => {
  const categories = await menuService.getCategoriesByMenu(req.params.menuId);

  res.json({
    success: true,
    data: categories,
    meta: {
      total: categories.length,
    },
  });
}));

// Get category by ID
router.get('/categories/:id', asyncHandler(async (req: Request, res: Response) => {
  const category = await menuService.getCategory(req.params.id);

  if (!category) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Category not found',
      },
    });
  }

  res.json({
    success: true,
    data: category,
  });
}));

// Update category
router.patch('/categories/:id', asyncHandler(async (req: Request, res: Response) => {
  const data: UpdateCategoryRequest = req.body;
  const category = await menuService.updateCategory(req.params.id, data);

  if (!category) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Category not found',
      },
    });
  }

  res.json({
    success: true,
    data: category,
  });
}));

// Delete category
router.delete('/menus/:menuId/categories/:categoryId', asyncHandler(async (req: Request, res: Response) => {
  const deleted = await menuService.deleteCategory(req.params.menuId, req.params.categoryId);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Category not found',
      },
    });
  }

  res.status(204).send();
}));

// Reorder categories
router.post('/menus/:menuId/categories/reorder', asyncHandler(async (req: Request, res: Response) => {
  const { categoryIds } = req.body;

  if (!Array.isArray(categoryIds)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'categoryIds must be an array',
      },
    });
  }

  const categories = await menuService.reorderCategories(req.params.menuId, categoryIds);

  res.json({
    success: true,
    data: categories,
  });
}));

// ==================== ITEM ROUTES ====================

// Create item
router.post('/menus/:menuId/items', asyncHandler(async (req: Request, res: Response) => {
  const data: CreateItemRequest = {
    ...req.body,
    menuId: req.params.menuId,
  };

  if (!data.categoryId || !data.name || data.price === undefined) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_FIELDS',
        message: 'categoryId, name, and price are required',
      },
    });
  }

  const item = await menuService.createItem(data);

  if (!item) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Menu or category not found',
      },
    });
  }

  res.status(201).json({
    success: true,
    data: item,
  });
}));

// Get items for a menu
router.get('/menus/:menuId/items', asyncHandler(async (req: Request, res: Response) => {
  const categoryId = req.query.categoryId as string | undefined;

  let items;
  if (categoryId) {
    items = await menuService.getItemsByCategory(categoryId);
  } else {
    items = await menuService.getItemsByMenu(req.params.menuId);
  }

  res.json({
    success: true,
    data: items,
    meta: {
      total: items.length,
    },
  });
}));

// Search items
router.get('/menus/:menuId/search', asyncHandler(async (req: Request, res: Response) => {
  const query = req.query.q as string;

  if (!query) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_QUERY',
        message: 'Search query (q) is required',
      },
    });
  }

  const items = await menuService.searchItems(req.params.menuId, query);

  res.json({
    success: true,
    data: items,
    meta: {
      total: items.length,
      query,
    },
  });
}));

// Get item by ID
router.get('/items/:id', asyncHandler(async (req: Request, res: Response) => {
  const item = await menuService.getItem(req.params.id);

  if (!item) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Item not found',
      },
    });
  }

  res.json({
    success: true,
    data: item,
  });
}));

// Update item
router.patch('/items/:id', asyncHandler(async (req: Request, res: Response) => {
  const data: UpdateItemRequest = req.body;
  const item = await menuService.updateItem(req.params.id, data);

  if (!item) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Item not found',
      },
    });
  }

  res.json({
    success: true,
    data: item,
  });
}));

// Delete item
router.delete('/menus/:menuId/items/:itemId', asyncHandler(async (req: Request, res: Response) => {
  const deleted = await menuService.deleteItem(req.params.menuId, req.params.itemId);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Item not found',
      },
    });
  }

  res.status(204).send();
}));

// ==================== VARIANT ROUTES ====================

// Add variant to item
router.post('/items/:itemId/variants', asyncHandler(async (req: Request, res: Response) => {
  const variant = await menuService.addVariant(req.params.itemId, req.body);

  if (!variant) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Item not found',
      },
    });
  }

  res.status(201).json({
    success: true,
    data: variant,
  });
}));

// Update variant
router.patch('/items/:itemId/variants/:variantId', asyncHandler(async (req: Request, res: Response) => {
  const variant = await menuService.updateVariant(req.params.itemId, req.params.variantId, req.body);

  if (!variant) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Variant not found',
      },
    });
  }

  res.json({
    success: true,
    data: variant,
  });
}));

// Delete variant
router.delete('/items/:itemId/variants/:variantId', asyncHandler(async (req: Request, res: Response) => {
  const deleted = await menuService.deleteVariant(req.params.itemId, req.params.variantId);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Variant not found',
      },
    });
  }

  res.status(204).send();
}));

// ==================== MODIFIER ROUTES ====================

// Add modifier to item
router.post('/items/:itemId/modifiers', asyncHandler(async (req: Request, res: Response) => {
  const modifier = await menuService.addModifier(req.params.itemId, req.body);

  if (!modifier) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Item not found',
      },
    });
  }

  res.status(201).json({
    success: true,
    data: modifier,
  });
}));

// Update modifier
router.patch('/items/:itemId/modifiers/:modifierId', asyncHandler(async (req: Request, res: Response) => {
  const modifier = await menuService.updateModifier(req.params.itemId, req.params.modifierId, req.body);

  if (!modifier) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Modifier not found',
      },
    });
  }

  res.json({
    success: true,
    data: modifier,
  });
}));

// Delete modifier
router.delete('/items/:itemId/modifiers/:modifierId', asyncHandler(async (req: Request, res: Response) => {
  const deleted = await menuService.deleteModifier(req.params.itemId, req.params.modifierId);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Modifier not found',
      },
    });
  }

  res.status(204).send();
}));

// ==================== AVAILABILITY ROUTES ====================

// Toggle availability
router.post('/availability', asyncHandler(async (req: Request, res: Response) => {
  const data: ToggleAvailabilityRequest = req.body;

  if (!data.type || !data.id || data.available === undefined) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_FIELDS',
        message: 'type, id, and available are required',
      },
    });
  }

  const success = await menuService.toggleAvailability(data);

  res.json({
    success,
    data: { available: data.available },
  });
}));

// Bulk toggle availability
router.post('/availability/bulk', asyncHandler(async (req: Request, res: Response) => {
  const { ids, available, type } = req.body;

  if (!Array.isArray(ids) || !type) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'ids (array) and type are required',
      },
    });
  }

  const updated = await menuService.bulkToggleAvailability(ids, available ?? true, type);

  res.json({
    success: true,
    data: { updatedCount: updated },
  });
}));

// ==================== ANALYTICS ROUTES ====================

// Get analytics
router.get('/menus/:menuId/analytics', asyncHandler(async (req: Request, res: Response) => {
  const query: AnalyticsQuery = {
    menuId: req.params.menuId,
    periodStart: req.query.periodStart as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    periodEnd: req.query.periodEnd as string || new Date().toISOString(),
    categoryId: req.query.categoryId as string | undefined,
  };

  const analytics = await menuService.getAnalytics(query);

  res.json({
    success: true,
    data: analytics,
    meta: {
      total: analytics.length,
      periodStart: query.periodStart,
      periodEnd: query.periodEnd,
    },
  });
}));

// Get top items
router.get('/menus/:menuId/analytics/top', asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const topItems = await menuService.getTopItems(req.params.menuId, limit);

  res.json({
    success: true,
    data: topItems,
    meta: {
      total: topItems.length,
    },
  });
}));

// Get low performing items
router.get('/menus/:menuId/analytics/low', asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const lowItems = await menuService.getLowPerformingItems(req.params.menuId, limit);

  res.json({
    success: true,
    data: lowItems,
    meta: {
      total: lowItems.length,
    },
  });
}));

// Record item view
router.post('/items/:id/view', asyncHandler(async (req: Request, res: Response) => {
  await menuService.recordItemView(req.params.id);

  res.json({
    success: true,
  });
}));

// Record item order
router.post('/items/:id/order', asyncHandler(async (req: Request, res: Response) => {
  const { price } = req.body;

  if (price === undefined) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_FIELD',
        message: 'price is required',
      },
    });
  }

  await menuService.recordItemOrder(req.params.id, price);

  res.json({
    success: true,
  });
}));

// ==================== RECOMMENDATION ROUTES ====================

// Get recommendations
router.post('/recommendations', asyncHandler(async (req: Request, res: Response) => {
  const request: RecommendationRequest = req.body;

  if (!request.menuId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_FIELD',
        message: 'menuId is required',
      },
    });
  }

  const recommendations = await recommendationService.getRecommendations(request);

  res.json({
    success: true,
    data: recommendations,
    meta: {
      total: recommendations.length,
    },
  });
}));

// Get recommendations for item (complementary items)
router.get('/items/:id/complementary', asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 3;
  const recommendations = await recommendationService.getComplementaryItems(req.params.id, limit);

  res.json({
    success: true,
    data: recommendations,
    meta: {
      total: recommendations.length,
    },
  });
}));

// Get bundle recommendations
router.post('/menus/:menuId/bundles', asyncHandler(async (req: Request, res: Response) => {
  const { targetPrice, itemCount } = req.body;

  if (!targetPrice) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_FIELD',
        message: 'targetPrice is required',
      },
    });
  }

  const bundle = await recommendationService.getBundleRecommendations(
    req.params.menuId,
    targetPrice,
    itemCount || 3
  );

  res.json({
    success: true,
    data: bundle,
  });
}));

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'rez-menu-service',
    },
  });
});

export default router;
