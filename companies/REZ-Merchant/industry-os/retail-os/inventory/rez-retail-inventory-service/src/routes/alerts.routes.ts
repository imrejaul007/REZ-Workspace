import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { alertService } from '../services/alert.service';
import { AlertSeverity } from '../types';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/alerts
 * Get active alerts
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const severity = req.query.severity as AlertSeverity | undefined;
    const alerts = await alertService.getActiveAlerts(severity);
    res.json({ success: true, data: alerts });
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/alerts/stats
 * Get alert statistics
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await alertService.getAlertStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/alerts/product/:productId
 * Get alerts by product
 */
router.get('/product/:productId', async (req: Request, res: Response) => {
  try {
    const alerts = await alertService.getAlertsByProduct(req.params.productId);
    res.json({ success: true, data: alerts });
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /api/alerts/:id/acknowledge
 * Acknowledge alert
 */
router.put('/:id/acknowledge', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'system';
    const alert = await alertService.acknowledgeAlert(req.params.id, userId);

    if (!alert) {
      res.status(404).json({ success: false, error: 'Alert not found' });
      return;
    }

    res.json({ success: true, data: alert });
  } catch (error) {
    logger.error('Error acknowledging alert:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /api/alerts/:id/resolve
 * Resolve alert
 */
router.put('/:id/resolve', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'system';
    const alert = await alertService.resolveAlert(req.params.id, userId);

    if (!alert) {
      res.status(404).json({ success: false, error: 'Alert not found' });
      return;
    }

    res.json({ success: true, data: alert });
  } catch (error) {
    logger.error('Error resolving alert:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /api/alerts/:id/dismiss
 * Dismiss alert
 */
router.put('/:id/dismiss', async (req: Request, res: Response) => {
  try {
    const alert = await alertService.dismissAlert(req.params.id);

    if (!alert) {
      res.status(404).json({ success: false, error: 'Alert not found' });
      return;
    }

    res.json({ success: true, data: alert });
  } catch (error) {
    logger.error('Error dismissing alert:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
