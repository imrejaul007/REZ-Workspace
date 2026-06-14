/**
 * Churn Routes - API endpoints
 */

import { Router, Request, Response } from 'express';
import { churnPredictionService } from '../services/churnPredictionService';
import { alertService } from '../services/alertService';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/churn/:customerId - Get churn risk for a customer
router.get('/:customerId', async (req: Request, res: Response) => {
  try {
    const churnRisk = await churnPredictionService.getRisk(req.params.customerId);

    if (!churnRisk) {
      res.status(404).json({
        success: false,
        error: 'Churn risk data not found for customer',
        customerId: req.params.customerId,
      });
      return;
    }

    res.json({ success: true, data: churnRisk });
  } catch (error) {
    logger.error('Error getting churn risk', { error, params: req.params });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/churn/:customerId/score - Calculate churn risk
router.post('/:customerId/score', async (req: Request, res: Response) => {
  try {
    const { features } = req.body;
    const churnRisk = await churnPredictionService.calculateRisk(req.params.customerId, features);

    res.json({ success: true, data: churnRisk });
  } catch (error) {
    logger.error('Error calculating churn risk', { error, params: req.params });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/churn/dashboard - Get dashboard data
router.get('/', async (_req: Request, res: Response) => {
  try {
    const dashboard = await churnPredictionService.getDashboard();
    res.json({ success: true, data: dashboard });
  } catch (error) {
    logger.error('Error getting dashboard', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/churn/alerts - Get alerts
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const filters = {
      customerId: req.query.customerId as string,
      severity: req.query.severity as string,
      acknowledged: req.query.acknowledged === 'true' ? true : req.query.acknowledged === 'false' ? false : undefined,
      resolved: req.query.resolved === 'true' ? true : req.query.resolved === 'false' ? false : undefined,
    };

    const alerts = await alertService.getAlerts(filters);
    res.json({ success: true, data: { count: alerts.length, alerts } });
  } catch (error) {
    logger.error('Error getting alerts', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/churn/alerts/:alertId/acknowledge - Acknowledge alert
router.post('/alerts/:alertId/acknowledge', async (req: Request, res: Response) => {
  try {
    const { acknowledgedBy } = req.body;
    if (!acknowledgedBy) {
      res.status(400).json({ success: false, error: 'acknowledgedBy is required' });
      return;
    }

    const alert = await alertService.acknowledgeAlert(req.params.alertId, acknowledgedBy);
    if (!alert) {
      res.status(404).json({ success: false, error: 'Alert not found' });
      return;
    }

    res.json({ success: true, data: alert });
  } catch (error) {
    logger.error('Error acknowledging alert', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/churn/alerts/:alertId/resolve - Resolve alert
router.post('/alerts/:alertId/resolve', async (req: Request, res: Response) => {
  try {
    const { resolvedBy, interventionTaken } = req.body;
    if (!resolvedBy || !interventionTaken) {
      res.status(400).json({ success: false, error: 'resolvedBy and interventionTaken are required' });
      return;
    }

    const alert = await alertService.resolveAlert(req.params.alertId, resolvedBy, interventionTaken);
    if (!alert) {
      res.status(404).json({ success: false, error: 'Alert not found' });
      return;
    }

    res.json({ success: true, data: alert });
  } catch (error) {
    logger.error('Error resolving alert', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/churn/analytics - Get analytics
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const analytics = await alertService.getAnalytics(days);
    res.json({ success: true, data: analytics });
  } catch (error) {
    logger.error('Error getting analytics', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/churn/high-risk - Get high risk customers
router.get('/high-risk', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const customers = await churnPredictionService.getHighRiskCustomers(limit);
    res.json({ success: true, data: { count: customers.length, customers } });
  } catch (error) {
    logger.error('Error getting high risk customers', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;