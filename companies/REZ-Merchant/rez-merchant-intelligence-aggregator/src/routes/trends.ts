/**
 * Trends Routes
 * Public routes for trend data (anonymized)
 */

import { Router, Request, Response } from 'express';
import { logger } from '../config/logger';

const router = Router();

/**
 * GET /api/v1/trends/demand/:locality
 * Get demand trends for a locality
 */
router.get('/demand/:locality', async (req: Request, res: Response) => {
  try {
    const trendsService = req.app.get('trendsService');
    const { locality } = req.params;
    const { industry = 'restaurant', period = '30d' } = req.query;

    const trends = await trendsService.getDemandTrends(
      locality,
      industry as string,
      period as '7d' | '30d' | '90d'
    );

    res.json({ success: true, data: trends });
  } catch (error) {
    logger.error('Trends error', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/trends/patterns
 * Get repeat visit patterns
 */
router.get('/patterns', async (req: Request, res: Response) => {
  try {
    const trendsService = req.app.get('trendsService');
    const { locality, industry = 'restaurant' } = req.query;

    const patterns = await trendsService.getRepeatVisitPatterns(
      locality as string,
      industry as string
    );

    res.json({ success: true, data: patterns });
  } catch (error) {
    logger.error('Patterns error', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/trends/seasonal
 * Get seasonal trends
 */
router.get('/seasonal', async (req: Request, res: Response) => {
  try {
    const trendsService = req.app.get('trendsService');
    const { city, industry = 'restaurant' } = req.query;

    if (!city) {
      res.status(400).json({ success: false, message: 'city is required' });
      return;
    }

    const seasonal = await trendsService.getSeasonalTrends(
      city as string,
      industry as string
    );

    res.json({ success: true, data: seasonal });
  } catch (error) {
    logger.error('Seasonal trends error', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/trends/categories
 * Get trending categories
 */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const trendsService = req.app.get('trendsService');
    const { locality, city, industry = 'restaurant', limit = '5' } = req.query;

    if (!locality || !city) {
      res.status(400).json({
        success: false,
        message: 'locality and city are required'
      });
      return;
    }

    const categories = await trendsService.getTrendingCategories(
      locality as string,
      city as string,
      industry as string,
      parseInt(limit as string)
    );

    res.json({ success: true, data: categories });
  } catch (error) {
    logger.error('Categories error', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/trends/competitors
 * Get competitor trends
 */
router.get('/competitors', async (req: Request, res: Response) => {
  try {
    const trendsService = req.app.get('trendsService');
    const { locality, industry = 'restaurant' } = req.query;

    if (!locality) {
      res.status(400).json({ success: false, message: 'locality is required' });
      return;
    }

    const competitors = await trendsService.getCompetitorTrends(
      locality as string,
      industry as string
    );

    res.json({ success: true, data: competitors });
  } catch (error) {
    logger.error('Competitors error', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
