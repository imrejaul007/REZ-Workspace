/**
 * Heatmap Routes
 * Public routes for heatmap data (anonymized)
 */

import { Router, Request, Response } from 'express';
import { logger } from '../config/logger';

const router = Router();

/**
 * GET /api/v1/heatmap/demand/:city
 * Get demand heatmap for a city
 */
router.get('/demand/:city', async (req: Request, res: Response) => {
  try {
    const heatmapService = req.app.get('heatmapService');
    const { city } = req.params;
    const { industry = 'restaurant', period = 'monthly' } = req.query;

    const heatmap = await heatmapService.getDemandHeatmap(
      city,
      industry as string,
      period as 'daily' | 'weekly' | 'monthly'
    );

    res.json({ success: true, data: heatmap });
  } catch (error) {
    logger.error('Heatmap error', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/heatmap/neighborhood
 * Analyze a specific neighborhood
 */
router.get('/neighborhood', async (req: Request, res: Response) => {
  try {
    const heatmapService = req.app.get('heatmapService');
    const { locality, industry = 'restaurant' } = req.query;

    if (!locality) {
      res.status(400).json({
        success: false,
        message: 'locality is required'
      });
      return;
    }

    const analysis = await heatmapService.analyzeNeighborhood(
      locality as string,
      industry as string
    );

    res.json({ success: true, data: analysis });
  } catch (error) {
    logger.error('Neighborhood analysis error', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/heatmap/trending
 * Get trending localities
 */
router.get('/trending', async (req: Request, res: Response) => {
  try {
    const heatmapService = req.app.get('heatmapService');
    const { city, industry = 'restaurant', limit = '10' } = req.query;

    if (!city) {
      res.status(400).json({
        success: false,
        message: 'city is required'
      });
      return;
    }

    const trending = await heatmapService.getTrendingLocalities(
      city as string,
      industry as string,
      parseInt(limit as string)
    );

    res.json({ success: true, data: trending });
  } catch (error) {
    logger.error('Trending error', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/heatmap/opportunities
 * Get opportunity areas (underserved markets)
 */
router.get('/opportunities', async (req: Request, res: Response) => {
  try {
    const heatmapService = req.app.get('heatmapService');
    const { city, industry = 'restaurant', limit = '10' } = req.query;

    if (!city) {
      res.status(400).json({
        success: false,
        message: 'city is required'
      });
      return;
    }

    const opportunities = await heatmapService.getOpportunityAreas(
      city as string,
      industry as string,
      parseInt(limit as string)
    );

    res.json({ success: true, data: opportunities });
  } catch (error) {
    logger.error('Opportunities error', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
