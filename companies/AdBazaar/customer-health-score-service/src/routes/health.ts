/**
 * Health Routes - API endpoints for customer health score
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { healthScoreService } from '../services/healthScoreService';
import { alertService } from '../services/alertService';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const calculateSchema = z.object({
  force: z.boolean().optional().default(false),
});

// GET /api/health/:customerId - Get health score for a customer
router.get('/:customerId', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;

    const healthScore = await healthScoreService.getHealthScore(customerId);

    if (!healthScore) {
      res.status(404).json({
        success: false,
        error: 'Customer health score not found',
        customerId,
      });
      return;
    }

    res.json({
      success: true,
      data: healthScore,
    });
  } catch (error) {
    logger.error('Error getting health score', { error, params: req.params });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// POST /api/health/:customerId/calculate - Calculate health score for a customer
router.post('/:customerId/calculate', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const parseResult = calculateSchema.safeParse(req.body);
    const force = parseResult.success ? parseResult.data.force : false;

    logger.info(`Calculating health score for customer ${customerId}, force: ${force}`);

    const result = await healthScoreService.calculateScore(customerId, force);

    res.json({
      success: true,
      data: {
        customerId,
        ...result,
        calculatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error calculating health score', { error, params: req.params });
    res.status(500).json({
      success: false,
      error: 'Failed to calculate health score',
    });
  }
});

// GET /api/health/:customerId/history - Get health score history
router.get('/:customerId/history', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    const history = await healthScoreService.getHistory(customerId, days);

    res.json({
      success: true,
      data: {
        customerId,
        days,
        count: history.length,
        history,
      },
    });
  } catch (error) {
    logger.error('Error getting health score history', { error, params: req.params });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// GET /api/health/dashboard - Get dashboard summary
router.get('/', async (_req: Request, res: Response) => {
  try {
    const dashboard = await healthScoreService.getDashboard();

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    logger.error('Error getting dashboard', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// GET /api/health/alerts - Get all alerts
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const acknowledged = req.query.acknowledged === 'true' ? true :
                        req.query.acknowledged === 'false' ? false : undefined;

    const alerts = await alertService.getAlerts(undefined, acknowledged);

    res.json({
      success: true,
      data: {
        count: alerts.length,
        alerts,
      },
    });
  } catch (error) {
    logger.error('Error getting alerts', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// POST /api/health/alerts/:alertId/acknowledge - Acknowledge an alert
router.post('/alerts/:alertId/acknowledge', async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const { acknowledgedBy } = req.body;

    if (!acknowledgedBy) {
      res.status(400).json({
        success: false,
        error: 'acknowledgedBy is required',
      });
      return;
    }

    const alert = await alertService.acknowledgeAlert(alertId, acknowledgedBy);

    if (!alert) {
      res.status(404).json({
        success: false,
        error: 'Alert not found',
      });
      return;
    }

    res.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    logger.error('Error acknowledging alert', { error, params: req.params });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// POST /api/health/alerts/:alertId/resolve - Resolve an alert
router.post('/alerts/:alertId/resolve', async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const { resolvedBy, actionTaken } = req.body;

    if (!resolvedBy || !actionTaken) {
      res.status(400).json({
        success: false,
        error: 'resolvedBy and actionTaken are required',
      });
      return;
    }

    const alert = await alertService.resolveAlert(alertId, resolvedBy, actionTaken);

    if (!alert) {
      res.status(404).json({
        success: false,
        error: 'Alert not found',
      });
      return;
    }

    res.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    logger.error('Error resolving alert', { error, params: req.params });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;