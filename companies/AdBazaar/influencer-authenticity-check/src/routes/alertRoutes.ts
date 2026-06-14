import { Router, Request, Response } from 'express';
import { alertService } from '../services/alertService';
import { asyncHandler, AppError, AuthenticatedRequest } from '../middleware';
import { validateRequest, AlertAcknowledgeSchema } from '../utils/validators';
import { logger } from 'utils/logger.js';

const router = Router();

// GET /api/alerts - Active alerts
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      severity,
      platform,
      limit = '50',
      offset = '0',
    } = req.query as Record<string, string>;

    const result = await alertService.getActiveAlerts({
      severity: severity as 'info' | 'warning' | 'critical' | undefined,
      platform,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });

    res.json({
      success: true,
      data: {
        alerts: result.alerts,
        total: result.total,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
      },
    });
  })
);

// GET /api/alerts/stats - Alert statistics
router.get(
  '/stats',
  asyncHandler(async (_req: Request, res: Response) => {
    const stats = await alertService.getAlertStats();

    res.json({
      success: true,
      data: stats,
    });
  })
);

// POST /api/alerts/:id/acknowledge - Acknowledge alert
router.post(
  '/:id/acknowledge',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { acknowledgedBy, notes } = validateRequest(AlertAcknowledgeSchema, req.body);

    const influencerId = req.query.influencerId as string;

    if (!influencerId) {
      throw new AppError('influencerId query parameter required', 400);
    }

    const loggerCtx = logger.child({ action: 'acknowledge_alert', alertId: id });

    const success = await alertService.acknowledgeAlert(
      id,
      influencerId,
      acknowledgedBy || req.userId,
      notes
    );

    if (!success) {
      throw new AppError('Alert not found', 404);
    }

    loggerCtx.info('Alert acknowledged', { acknowledgedBy });

    res.json({
      success: true,
      message: 'Alert acknowledged successfully',
    });
  })
);

// POST /api/alerts/acknowledge-all - Acknowledge all alerts for influencer
router.post(
  '/acknowledge-all',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { influencerId, notes } = req.body;

    if (!influencerId) {
      throw new AppError('influencerId required', 400);
    }

    const count = await alertService.acknowledgeAllAlerts(
      influencerId,
      req.userId,
      notes
    );

    res.json({
      success: true,
      message: `${count} alerts acknowledged`,
      data: { count },
    });
  })
);

// GET /api/alerts/influencer/:influencerId - Get alerts for influencer
router.get(
  '/influencer/:influencerId',
  asyncHandler(async (req: Request, res: Response) => {
    const { influencerId } = req.params;

    const alerts = await alertService.getAlertsForInfluencer(influencerId);

    res.json({
      success: true,
      data: {
        influencerId,
        totalAlerts: alerts.length,
        unacknowledgedCount: alerts.filter((a) => !a.acknowledged).length,
        alerts: alerts.map((a) => ({
          alertId: a.alertId,
          type: a.type,
          severity: a.severity,
          message: a.message,
          createdAt: a.createdAt,
          acknowledged: a.acknowledged,
          acknowledgedBy: a.acknowledgedBy,
          acknowledgedAt: a.acknowledgedAt,
          notes: a.notes,
        })),
      },
    });
  })
);

export default router;