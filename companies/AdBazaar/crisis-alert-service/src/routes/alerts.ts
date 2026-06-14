/**
 * Alerts Router - API routes for crisis alerts
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AlertService, CreateAlertInput, AlertFilter } from '../services/alertService';
import { AuthRequest } from '../middleware/auth';
import { AlertSeverity, AlertType, AlertStatus } from '../models';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const createAlertSchema = z.object({
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  type: z.enum([
    'negative_sentiment',
    'viral_negative',
    'competitor_crisis',
    'mention_spike',
    'influencer_crisis',
  ]),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  source: z.object({
    platform: z.string().min(1),
    postId: z.string().optional(),
    postUrl: z.string().url().optional(),
    authorUsername: z.string().optional(),
  }),
  metrics: z.object({
    mentions: z.number().min(0),
    sentiment: z.number().min(-100).max(100),
    reach: z.number().min(0).optional(),
    velocity: z.number().min(0).optional(),
  }),
  affectedBrand: z.string().optional(),
});

const acknowledgeSchema = z.object({
  notes: z.string().optional(),
});

const escalateSchema = z.object({
  escalateTo: z.array(z.string()).min(1),
  notes: z.string().optional(),
});

const resolveSchema = z.object({
  resolution: z.string().min(1),
  notes: z.string().optional(),
});

const listAlertsSchema = z.object({
  status: z.enum(['active', 'acknowledged', 'escalated', 'resolved']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  type: z.enum([
    'negative_sentiment',
    'viral_negative',
    'competitor_crisis',
    'mention_spike',
    'influencer_crisis',
  ]).optional(),
  affectedBrand: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'severity', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * GET /api/alerts
 * List active alerts with filters and pagination
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const validation = listAlertsSchema.safeParse(req.query);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: validation.error.issues,
      });
      return;
    }

    const { startDate, endDate, ...filters } = validation.data;

    const result = await AlertService.listAlerts(
      {
        ...filters,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
      {
        page: validation.data.page,
        limit: validation.data.limit,
        sortBy: validation.data.sortBy,
        sortOrder: validation.data.sortOrder,
      }
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error('Failed to list alerts', { error });
    res.status(500).json({ success: false, error: 'Failed to list alerts' });
  }
});

/**
 * POST /api/alerts
 * Create a new alert
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const validation = createAlertSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: validation.error.issues,
      });
      return;
    }

    const alert = await AlertService.createAlert(
      validation.data as CreateAlertInput,
      req.user?.userId
    );

    res.status(201).json({
      success: true,
      data: alert,
    });
  } catch (error) {
    logger.error('Failed to create alert', { error });
    res.status(500).json({ success: false, error: 'Failed to create alert' });
  }
});

/**
 * GET /api/alerts/history
 * Get alert history
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const validation = listAlertsSchema.safeParse(req.query);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: validation.error.issues,
      });
      return;
    }

    const { startDate, endDate, ...filters } = validation.data;

    const result = await AlertService.getAlertHistory(
      {
        ...filters,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
      {
        page: validation.data.page,
        limit: validation.data.limit,
        sortBy: validation.data.sortBy,
        sortOrder: validation.data.sortOrder,
      }
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error('Failed to get alert history', { error });
    res.status(500).json({ success: false, error: 'Failed to get alert history' });
  }
});

/**
 * GET /api/alerts/stats
 * Get alert statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const stats = await AlertService.getAlertStats(days);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Failed to get alert stats', { error });
    res.status(500).json({ success: false, error: 'Failed to get alert stats' });
  }
});

/**
 * GET /api/alerts/:id
 * Get alert by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const alert = await AlertService.getAlertById(req.params.id);

    if (!alert) {
      res.status(404).json({ success: false, error: 'Alert not found' });
      return;
    }

    res.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    logger.error('Failed to get alert', { error });
    res.status(500).json({ success: false, error: 'Failed to get alert' });
  }
});

/**
 * POST /api/alerts/:id/acknowledge
 * Acknowledge an alert
 */
router.post('/:id/acknowledge', async (req: AuthRequest, res: Response) => {
  try {
    const validation = acknowledgeSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: validation.error.issues,
      });
      return;
    }

    const alert = await AlertService.acknowledgeAlert(req.params.id, req.user?.userId || 'unknown');

    if (!alert) {
      res.status(404).json({ success: false, error: 'Alert not found or already resolved' });
      return;
    }

    res.json({
      success: true,
      data: alert,
      message: 'Alert acknowledged successfully',
    });
  } catch (error) {
    logger.error('Failed to acknowledge alert', { error });
    res.status(500).json({ success: false, error: 'Failed to acknowledge alert' });
  }
});

/**
 * POST /api/alerts/:id/escalate
 * Escalate an alert
 */
router.post('/:id/escalate', async (req: AuthRequest, res: Response) => {
  try {
    const validation = escalateSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: validation.error.issues,
      });
      return;
    }

    const alert = await AlertService.escalateAlert(
      req.params.id,
      validation.data.escalateTo,
      req.user?.userId || 'unknown'
    );

    if (!alert) {
      res.status(404).json({ success: false, error: 'Alert not found' });
      return;
    }

    res.json({
      success: true,
      data: alert,
      message: 'Alert escalated successfully',
    });
  } catch (error) {
    logger.error('Failed to escalate alert', { error });
    res.status(500).json({ success: false, error: 'Failed to escalate alert' });
  }
});

/**
 * POST /api/alerts/:id/resolve
 * Resolve an alert
 */
router.post('/:id/resolve', async (req: AuthRequest, res: Response) => {
  try {
    const validation = resolveSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: validation.error.issues,
      });
      return;
    }

    const alert = await AlertService.resolveAlert(
      req.params.id,
      validation.data.resolution,
      req.user?.userId || 'unknown'
    );

    if (!alert) {
      res.status(404).json({ success: false, error: 'Alert not found' });
      return;
    }

    res.json({
      success: true,
      data: alert,
      message: 'Alert resolved successfully',
    });
  } catch (error) {
    logger.error('Failed to resolve alert', { error });
    res.status(500).json({ success: false, error: 'Failed to resolve alert' });
  }
});

/**
 * DELETE /api/alerts/:id
 * Delete an alert
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    // Only admins can delete alerts
    if (req.user?.role !== 'admin' && req.user?.role !== 'api_key') {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const deleted = await AlertService.deleteAlert(req.params.id);

    if (!deleted) {
      res.status(404).json({ success: false, error: 'Alert not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Alert deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete alert', { error });
    res.status(500).json({ success: false, error: 'Failed to delete alert' });
  }
});

export { router as alertsRouter };