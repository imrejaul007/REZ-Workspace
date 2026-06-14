/**
 * Go4Food API - Menu Route
 * Get menu items with filtering
 */

import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { foodAggregator } from '../services/foodAggregator.js';

export const menuRouter = Router();

// Query schema
const menuSchema = z.object({
  restaurantId: z.string(),
  source: z.string().optional(),
  category: z.string().optional(),
  isVeg: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('50'),
});

/**
 * GET /api/menu
 * Get menu items with filters
 */
menuRouter.get('/', asyncHandler(async (req, res) => {
  const params = menuSchema.parse(req.query);

  const options = {
    restaurantId: params.restaurantId,
    source: params.source,
    category: params.category,
    isVeg: params.isVeg === 'true',
    minPrice: params.minPrice ? parseFloat(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? parseFloat(params.maxPrice) : undefined,
    search: params.search,
    page: parseInt(params.page, 10),
    limit: parseInt(params.limit, 10),
  };

  logger.info('Get menu', options);

  const menu = await foodAggregator.getMenuItems(options);

  res.json({
    success: true,
    data: menu,
  });
}));

/**
 * GET /api/menu/categories
 * Get all categories for a restaurant
 */
menuRouter.get('/categories', asyncHandler(async (req, res) => {
  const { restaurantId, source } = req.query;

  if (!restaurantId) {
    res.status(400).json({
      success: false,
      error: 'restaurantId is required',
    });
    return;
  }

  const categories = await foodAggregator.getCategories(
    restaurantId as string,
    source as string | undefined
  );

  res.json({
    success: true,
    data: categories,
  });
}));
