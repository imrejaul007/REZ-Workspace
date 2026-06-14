// @ts-ignore
// ReZ Schedule - Audit Routes
import { Router, Request, Response } from 'express';
import { auditService } from '../services/auditService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Get audit trail for an entity
 * GET /api/audit/:entityType/:entityId
 */
router.get('/:entityType/:entityId', async (req: Request, res: Response) => {
  try {
    const entityType = req.params.entityType as string;
    const entityId = req.params.entityId as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    const trail = await auditService.getEntityAuditTrail(
      entityType as 'booking' | 'event_type' | 'schedule' | 'user' | 'webhook' | 'calendar' | 'organization',
      entityId,
      { limit, offset }
    );

    res.json({ success: true, data: trail });
  } catch (error) {
    logger.error('[Audit] Get trail error:', error);
    res.status(500).json({ success: false, error: 'Failed to get audit trail' });
  }
});

/**
 * Get user's activity
 * GET /api/audit/user/:userId
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const trail = await auditService.getUserAuditTrail(userId, { limit, startDate, endDate });

    res.json({ success: true, data: trail });
  } catch (error) {
    logger.error('[Audit] User trail error:', error);
    res.status(500).json({ success: false, error: 'Failed to get user audit trail' });
  }
});

/**
 * Get audit statistics
 * GET /api/audit/stats/summary
 */
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'startDate and endDate required' });
    }

    const stats = await auditService.getStats({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      entityType: req.query.entityType as 'booking' | 'event_type' | 'schedule' | 'user' | 'webhook' | 'calendar' | 'organization' | undefined,
      entityId: req.query.entityId as string | undefined,
    });

    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('[Audit] Stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to get audit statistics' });
  }
});

/**
 * Export audit logs
 * POST /api/audit/export
 */
router.post('/export', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, entityTypes, actions, format } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'startDate and endDate required' });
    }

    const data = await auditService.export({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      entityTypes,
      actions,
      format: format || 'json',
    });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-log.csv');
    }

    res.json({ success: true, data });
  } catch (error) {
    logger.error('[Audit] Export error:', error);
    res.status(500).json({ success: false, error: 'Failed to export audit logs' });
  }
});

export default router;
