/**
 * Go4Food API - Restaurants Route
 * Search and filter restaurants from multiple sources
 */

import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { foodAggregator } from '../services/foodAggregator.js';

export const restaurantsRouter = Router();

// Query schema
const searchSchema = z.object({
  query: z.string().optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
  cuisines: z.string().optional(), // comma-separated
  priceRange: z.enum(['low', 'medium', 'high']).optional(),
  minRating: z.string().optional(),
  isPureVeg: z.string().optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
});

/**
 * GET /api/restaurants/search
 * Search restaurants across all platforms
 */
restaurantsRouter.get('/search', asyncHandler(async (req, res) => {
  const params = searchSchema.parse(req.query);

  const options = {
    query: params.query,
    cuisines: params.cuisines?.split(',').filter(Boolean),
    priceRange: params.priceRange,
    minRating: params.minRating ? parseFloat(params.minRating) : undefined,
    isPureVeg: params.isPureVeg === 'true',
    lat: params.lat ? parseFloat(params.lat) : undefined,
    lng: params.lng ? parseFloat(params.lng) : undefined,
    page: parseInt(params.page, 10),
    limit: parseInt(params.limit, 10),
  };

  logger.info('Restaurant search', { options });

  const result = await foodAggregator.searchRestaurants(options);

  res.json({
    success: true,
    data: result,
  });
}));

/**
 * GET /api/restaurants/:id
 * Get restaurant details
 */
restaurantsRouter.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { source } = req.query;

  logger.info('Get restaurant', { id, source });

  const restaurant = await foodAggregator.getRestaurant(id, source as string);

  if (!restaurant) {
    res.status(404).json({
      success: false,
      error: 'Restaurant not found',
    });
    return;
  }

  res.json({
    success: true,
    data: restaurant,
  });
}));

/**
 * GET /api/restaurants/:id/menu
 * Get restaurant menu
 */
restaurantsRouter.get('/:id/menu', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { source } = req.query;

  logger.info('Get restaurant menu', { id, source });

  const menu = await foodAggregator.getMenu(id, source as string);

  res.json({
    success: true,
    data: menu,
  });
}));

/**
 * GET /api/restaurants/cuisines
 * Get all available cuisines
 */
restaurantsRouter.get('/cuisines/list', asyncHandler(async (req, res) => {
  const cuisines = await foodAggregator.getCuisines();

  res.json({
    success: true,
    data: cuisines,
  });
}));
