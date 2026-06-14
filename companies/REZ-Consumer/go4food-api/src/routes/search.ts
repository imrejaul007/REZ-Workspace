/**
 * Go4Food API - Search Route
 * Smart search with AI recommendations
 */

import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { foodAggregator } from '../services/foodAggregator.js';

export const searchRouter = Router();

// Query schema
const searchSchema = z.object({
  q: z.string().min(1),
  lat: z.string().optional(),
  lng: z.string().optional(),
  cuisines: z.string().optional(),
  priceRange: z.enum(['low', 'medium', 'high']).optional(),
  sortBy: z.enum(['relevance', 'rating', 'price', 'deliveryTime']).optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
});

/**
 * GET /api/search
 * Smart food search
 */
searchRouter.get('/', asyncHandler(async (req, res) => {
  const params = searchSchema.parse(req.query);

  const options = {
    query: params.q,
    cuisines: params.cuisines?.split(',').filter(Boolean),
    priceRange: params.priceRange,
    sortBy: params.sortBy,
    lat: params.lat ? parseFloat(params.lat) : undefined,
    lng: params.lng ? parseFloat(params.lng) : undefined,
    page: parseInt(params.page, 10),
    limit: parseInt(params.limit, 10),
  };

  logger.info('Smart search', options);

  const results = await foodAggregator.smartSearch(options);

  res.json({
    success: true,
    data: results,
  });
}));

/**
 * GET /api/search/suggestions
 * Get search suggestions
 */
searchRouter.get('/suggestions', asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || typeof q !== 'string') {
    res.status(400).json({
      success: false,
      error: 'q parameter is required',
    });
    return;
  }

  const suggestions = await foodAggregator.getSuggestions(q);

  res.json({
    success: true,
    data: suggestions,
  });
}));

/**
 * GET /api/search/trending
 * Get trending searches
 */
searchRouter.get('/trending', asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;

  const trending = await foodAggregator.getTrending(
    lat ? parseFloat(lat as string) : undefined,
    lng ? parseFloat(lng as string) : undefined
  );

  res.json({
    success: true,
    data: trending,
  });
}));
