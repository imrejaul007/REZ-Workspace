/**
 * Go4Food API - Compare Route
 * Compare prices across platforms
 */

import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { foodAggregator } from '../services/foodAggregator.js';

export const compareRouter = Router();

// Query schema
const compareSchema = z.object({
  itemName: z.string().min(1),
  lat: z.string().optional(),
  lng: z.string().optional(),
});

/**
 * GET /api/compare/price
 * Compare price of a specific item across platforms
 */
compareRouter.get('/price', asyncHandler(async (req, res) => {
  const params = compareSchema.parse(req.query);

  logger.info('Price comparison', { itemName: params.itemName });

  const comparison = await foodAggregator.comparePrice(
    params.itemName,
    params.lat ? parseFloat(params.lat) : undefined,
    params.lng ? parseFloat(params.lng) : undefined
  );

  res.json({
    success: true,
    data: comparison,
  });
}));

/**
 * GET /api/compare/best-deals
 * Find best deals for a food item
 */
compareRouter.get('/best-deals', asyncHandler(async (req, res) => {
  const { query, cuisines, lat, lng } = req.query;

  if (!query || typeof query !== 'string') {
    res.status(400).json({
      success: false,
      error: 'query parameter is required',
    });
    return;
  }

  logger.info('Best deals search', { query, cuisines, lat, lng });

  const deals = await foodAggregator.findBestDeals(
    query,
    cuisines ? (cuisines as string).split(',') : undefined,
    lat ? parseFloat(lat as string) : undefined,
    lng ? parseFloat(lng as string) : undefined
  );

  res.json({
    success: true,
    data: deals,
  });
}));

/**
 * GET /api/compare/menu
 * Compare full menu across platforms
 */
compareRouter.get('/menu', asyncHandler(async (req, res) => {
  const { restaurantName, lat, lng } = req.query;

  if (!restaurantName || typeof restaurantName !== 'string') {
    res.status(400).json({
      success: false,
      error: 'restaurantName parameter is required',
    });
    return;
  }

  logger.info('Menu comparison', { restaurantName });

  const comparison = await foodAggregator.compareMenu(
    restaurantName,
    lat ? parseFloat(lat as string) : undefined,
    lng ? parseFloat(lng as string) : undefined
  );

  res.json({
    success: true,
    data: comparison,
  });
}));
