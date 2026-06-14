/**
 * Audit Log Routes
 *
 * Query and export audit logs for compliance:
 * - List audit logs
 * - Filter by entity, action, user, date
 * - Export audit trail
 */

import { Router, Request, Response } from 'express';
import { merchantAuth } from '../middleware/auth';
import { getAuditLogs } from '../services/auditLogService';
import { logger } from '../config/logger';

const router = Router();
router.use(merchantAuth);

/**
 * GET /audit-logs
 * List audit logs with filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      entityType,
      entityId,
      action,
      userId,
      from,
      to,
      page,
      limit,
    } = req.query;

    const result = await getAuditLogs(req.merchantId!, {
      entityType: entityType as string,
      entityId: entityId as string,
      action: action as string,
      userId: userId as string,
      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 50,
    });

    res.json({
      success: true,
      data: result.logs,
      pagination: {
        page: result.page,
        limit: parseInt(limit as string) || 50,
        total: result.total,
        totalPages: result.totalPages,
        hasMore: result.page < result.totalPages,
      },
    });
  } catch (err) {
    logger.error('[AuditLogs] Failed to fetch logs', { error: err });
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
});

/**
 * GET /audit-logs/export
 * Export audit logs
 */
router.get('/export', async (req: Request, res: Response) => {
  try {
    const { entityType, from, to, format } = req.query;

    const result = await getAuditLogs(req.merchantId!, {
      entityType: entityType as string,
      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined,
      limit: 10000,
    });

    if (format === 'csv') {
      const headers = ['timestamp', 'action', 'entityType', 'entityId', 'userId', 'ipAddress'];
      const rows = result.logs.map((log) =>
        headers.map((h) => {
          const val = (log as unknown)[h];
          if (val instanceof Date) return val.toISOString();
          if (typeof val === 'object') return JSON.stringify(val);
          return val || '';
        }).join(',')
      );

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
      res.send([headers.join(','), ...rows].join('\n'));
    } else {
      res.json({
        success: true,
        data: result.logs,
        total: result.total,
      });
    }
  } catch (err) {
    logger.error('[AuditLogs] Export failed', { error: err });
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

/**
 * GET /audit-logs/summary
 * Get audit summary by action type
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;

    const query: unknown = { merchantId: req.merchantId };
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from as string);
      if (to) query.timestamp.$lte = new Date(to as string);
    }

    const { AuditLog } = await import('../models/AuditLog');
    const summary = await AuditLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          lastOccurrence: { $max: '$timestamp' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: summary.map((s) => ({
        action: s._id,
        count: s.count,
        lastOccurrence: s.lastOccurrence,
      })),
    });
  } catch (err) {
    logger.error('[AuditLogs] Summary failed', { error: err });
    res.status(500).json({ success: false, message: 'Failed to generate summary' });
  }
});

export default router;
