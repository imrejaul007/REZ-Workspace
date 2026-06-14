/**
 * Benchmark Routes
 * Public routes for benchmark data (anonymized)
 */

import { Router, Request, Response } from 'express';
import { logger } from '../config/logger';

const router = Router();

/**
 * GET /api/v1/benchmark/industry/:industry
 * Get industry-wide benchmarks
 */
router.get('/industry/:industry', async (req: Request, res: Response) => {
  try {
    const benchmarkService = req.app.get('benchmarkService');
    const { industry } = req.params;

    const benchmarks = await benchmarkService.getIndustryBenchmarks(industry);

    if (!benchmarks) {
      res.status(404).json({
        success: false,
        message: 'Not enough data for this industry'
      });
      return;
    }

    res.json({ success: true, data: benchmarks });
  } catch (error) {
    logger.error('Benchmark error', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/benchmark/locality
 * Get benchmarks for a locality
 */
router.get('/locality', async (req: Request, res: Response) => {
  try {
    const aggregationService = req.app.get('aggregationService');
    const { locality, industry, category } = req.query;

    if (!locality || !industry) {
      res.status(400).json({
        success: false,
        message: 'locality and industry are required'
      });
      return;
    }

    const metrics = await aggregationService.getLocalityMetrics(
      locality as string,
      industry as string,
      category as string
    );

    if (!metrics) {
      res.status(404).json({
        success: false,
        message: 'No data for this locality'
      });
      return;
    }

    res.json({ success: true, data: metrics });
  } catch (error) {
    logger.error('Benchmark error', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/benchmark/top-performers
 * Get top performing localities
 */
router.get('/top-performers', async (req: Request, res: Response) => {
  try {
    const benchmarkService = req.app.get('benchmarkService');
    const { industry, locality, limit = '10' } = req.query;

    if (!industry || !locality) {
      res.status(400).json({
        success: false,
        message: 'industry and locality are required'
      });
      return;
    }

    const top = await benchmarkService.getTopPerformers(
      industry as string,
      locality as string,
      'revenue',
      parseInt(limit as string)
    );

    res.json({ success: true, data: top });
  } catch (error) {
    logger.error('Top performers error', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
