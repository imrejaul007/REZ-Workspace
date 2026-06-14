/**
 * REZ Signal Service - Alert Routes
 *
 * API endpoints for alert management
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AlertModel, AlertStatus, AlertSeverity } from '../models/Alert.js';
import { CompanySignalsModel } from '../models/CompanySignals.js';
import { SignalModel } from '../models/Signal.js';
import logger from '../utils/logger.js';

const router = Router();

// ============================================================================
// Validation Schemas
// ============================================================================

const CreateAlertSchema = z.object({
  type: z.enum(['new_signal', 'signal_trend', 'competitor_activity', 'intent_surge', 'threshold_breach']),
  companyId: z.string().min(1),
  companyName: z.string().min(1),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  summary: z.string().min(1).max(500),
  insight: z.string().min(1).max(2000),
  recommendedAction: z.string().min(1).max(500),
  isUrgent: z.boolean().default(false),
});

const UpdateAlertSchema = z.object({
  status: z.enum(['active', 'acknowledged', 'dismissed', 'actioned']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  notes: z.string().max(1000).optional(),
});

const AlertQuerySchema = z.object({
  companyId: z.string().optional(),
  type: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['active', 'acknowledged', 'dismissed', 'actioned']).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

// ============================================================================
// Routes
// ============================================================================

/**
 * POST /api/v1/alerts
 * Create a new alert
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = req.headers['x-user-id'] as string;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const validated = CreateAlertSchema.parse(req.body);

    const alert = await AlertModel.create({
      ...validated,
      tenantId,
      status: 'active',
      actions: [],
      notifiedUsers: [],
      notificationChannels: [],
    });

    logger.info('Alert created', {
      tenantId,
      alertId: alert._id,
      type: alert.type,
      companyId: alert.companyId,
    });

    res.status(201).json({
      success: true,
      data: { alert },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Failed to create alert', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to create alert' });
  }
});

/**
 * GET /api/v1/alerts
 * List alerts with filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const validated = AlertQuerySchema.parse(req.query);

    const query: any = { tenantId };

    if (validated.companyId) query.companyId = validated.companyId;
    if (validated.type) query.type = validated.type;
    if (validated.severity) query.severity = validated.severity;
    if (validated.status) query.status = validated.status;

    const [alerts, total] = await Promise.all([
      AlertModel.find(query)
        .sort({ createdAt: -1 })
        .skip(validated.offset)
        .limit(validated.limit),
      AlertModel.countDocuments(query),
    ]);

    // Stats
    const stats = {
      total,
      byStatus: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      byType: {} as Record<string, number>,
    };

    for (const alert of alerts) {
      stats.byStatus[alert.status] = (stats.byStatus[alert.status] || 0) + 1;
      stats.bySeverity[alert.severity] = (stats.bySeverity[alert.severity] || 0) + 1;
      stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
    }

    res.json({
      success: true,
      data: {
        alerts,
        pagination: {
          offset: validated.offset,
          limit: validated.limit,
          total,
          hasMore: validated.offset + alerts.length < total,
        },
        stats,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Failed to list alerts', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to list alerts' });
  }
});

/**
 * GET /api/v1/alerts/actionable
 * Get actionable alerts (high priority, active)
 */
router.get('/actionable', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const alerts = await AlertModel.find({
      tenantId,
      status: 'active',
      $or: [
        { severity: 'high' },
        { severity: 'critical' },
        { isUrgent: true },
      ],
    })
      .sort({ severity: -1, createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: {
        alerts,
        count: alerts.length,
      },
    });
  } catch (error) {
    logger.error('Failed to get actionable alerts', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get actionable alerts' });
  }
});

/**
 * GET /api/v1/alerts/company/:companyId
 * Get alerts for a specific company
 */
router.get('/company/:companyId', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { companyId } = req.params;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const alerts = await AlertModel.find({
      tenantId,
      companyId,
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: { alerts },
    });
  } catch (error) {
    logger.error('Failed to get company alerts', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get company alerts' });
  }
});

/**
 * PATCH /api/v1/alerts/:id
 * Update alert status
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    const validated = UpdateAlertSchema.parse(req.body);

    const alert = await AlertModel.findOne({ _id: id, tenantId });

    if (!alert) {
      res.status(404).json({ success: false, error: 'Alert not found' });
      return;
    }

    // Update status if provided
    if (validated.status) {
      alert.status = validated.status;
    }

    // Update severity if provided
    if (validated.severity) {
      alert.severity = validated.severity;
    }

    // Add action if status changed
    if (validated.status) {
      alert.actions.push({
        takenBy: userId,
        takenAt: new Date(),
        action: `Status changed to ${validated.status}`,
        notes: validated.notes,
      });
    }

    await alert.save();

    logger.info('Alert updated', {
      tenantId,
      alertId: id,
      status: alert.status,
    });

    res.json({ success: true, data: { alert } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Failed to update alert', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to update alert' });
  }
});

/**
 * POST /api/v1/alerts/generate
 * Generate alerts from signals
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing tenant ID' });
      return;
    }

    // Find companies with high intent signals
    const highIntentCompanies = await CompanySignalsModel.find({
      tenantId,
      overallScore: { $gte: 60 },
      isMonitored: true,
    }).limit(50);

    const generatedAlerts = [];

    for (const company of highIntentCompanies) {
      // Check if there's already an active alert for this company
      const existingAlert = await AlertModel.findOne({
        tenantId,
        companyId: company.companyId,
        status: 'active',
      });

      if (existingAlert) continue;

      // Get recent signals
      const recentSignals = await SignalModel.find({
        tenantId,
        companyId: company.companyId,
        timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        isActive: true,
      }).limit(5);

      if (recentSignals.length === 0) continue;

      // Generate alert
      const signal = recentSignals[0];
      const alert = await AlertModel.create({
        tenantId,
        type: 'intent_surge',
        title: `High Intent Signal: ${company.companyName}`,
        description: `Intent score: ${company.overallScore}/100`,
        severity: company.overallScore >= 80 ? 'high' : 'medium',
        status: 'active',
        companyId: company.companyId,
        companyName: company.companyName,
        signalIds: recentSignals.map(s => s._id),
        summary: `${company.companyName} shows high buying intent with ${company.totalSignals} signals in the last 30 days.`,
        insight: `Intent is ${company.trendDirection} with a score of ${company.overallScore}. Dominant intent stage: ${company.intentStage}.`,
        recommendedAction: `Prioritize outreach to ${company.companyName}. Recent activity: ${signal.title}`,
        isUrgent: company.overallScore >= 80,
      });

      generatedAlerts.push(alert);
    }

    logger.info('Alerts generated', {
      tenantId,
      count: generatedAlerts.length,
    });

    res.json({
      success: true,
      data: {
        generated: generatedAlerts.length,
        alerts: generatedAlerts,
      },
    });
  } catch (error) {
    logger.error('Failed to generate alerts', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to generate alerts' });
  }
});

export default router;
