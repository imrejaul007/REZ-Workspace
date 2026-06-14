/**
 * Healthcare Copilot Routes
 */

import { Router, Request, Response } from 'express';
import { healthcareHealthScorer } from '../services/healthcareHealthScorer';

const router = Router();

router.get('/:merchantId/profile', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const score = await healthcareHealthScorer.calculateHealthScore(merchantId);
    const metrics = await healthcareHealthScorer.getMetrics(merchantId);
    res.json({ success: true, data: { merchantId, score, metrics } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get healthcare profile' });
  }
});

router.get('/:merchantId/health-score', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const score = await healthcareHealthScorer.calculateHealthScore(merchantId);
    res.json({ success: true, data: score });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get health score' });
  }
});

router.get('/:merchantId/metrics', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const metrics = await healthcareHealthScorer.getMetrics(merchantId);
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get metrics' });
  }
});

router.get('/:merchantId/insights', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const score = await healthcareHealthScorer.calculateHealthScore(merchantId);
    const insights = [];
    if (score.breakdown.appointmentHealth < 70) {
      insights.push({ type: 'warning', message: 'Appointment completion rate could be improved' });
    }
    res.json({ success: true, data: { score, insights } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get insights' });
  }
});

export default router;
