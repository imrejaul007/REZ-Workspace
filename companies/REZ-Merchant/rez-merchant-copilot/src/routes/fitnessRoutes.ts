/**
 * Fitness Copilot Routes
 */

import { Router, Request, Response } from 'express';
import { fitnessHealthScorer } from '../services/fitnessHealthScorer';

const router = Router();

router.get('/:merchantId/profile', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const score = await fitnessHealthScorer.calculateHealthScore(merchantId);
    const metrics = await fitnessHealthScorer.getMetrics(merchantId);
    res.json({ success: true, data: { merchantId, score, metrics } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get fitness profile' });
  }
});

router.get('/:merchantId/health-score', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const score = await fitnessHealthScorer.calculateHealthScore(merchantId);
    res.json({ success: true, data: score });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get health score' });
  }
});

router.get('/:merchantId/metrics', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const metrics = await fitnessHealthScorer.getMetrics(merchantId);
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get metrics' });
  }
});

router.get('/:merchantId/recommendations', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const score = await fitnessHealthScorer.calculateHealthScore(merchantId);
    res.json({ success: true, data: { recommendations: score.recommendations } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get recommendations' });
  }
});

export default router;
