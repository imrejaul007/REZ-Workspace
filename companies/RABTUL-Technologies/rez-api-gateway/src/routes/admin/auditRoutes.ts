/**
 * Admin Audit Log Routes
 *
 * Provides endpoints for querying and exporting audit logs
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../../shared/authMiddleware';
import {
  queryAuditLogs,
  auditAdminAction,
  AuditAction,
  ResourceType,
} from '../../middleware/auditMiddleware';
import { adminRateLimiter, adminExportRateLimiter } from '../../middleware/adminRateLimiter';
import { logger } from '../../config/logger';

const router = Router();

// Apply rate limiting to all admin audit routes
router.use(adminRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
}));

// Apply admin authentication
router.use(requireAdmin);

// Validation schemas
const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  adminId: z.string().optional(),
  action: z.enum(['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'SUSPEND', 'ACTIVATE', 'LOGIN', 'LOGOUT', 'EXPORT', 'BULK_OPERATION', 'SETTINGS_CHANGE']).optional(),
  resourceType: z.enum(['USER', 'MERCHANT', 'ORDER', 'PRODUCT', 'CATEGORY', 'CAMPAIGN', 'ADMIN_USER', 'SYSTEM_CONFIG', 'REFUND', 'CASHBACK', 'REPORT']).optional(),
  resourceId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['success', 'failure']).optional(),
});

/**
 * Get audit logs with filtering
 * GET /admin/audit-log
 */
router.get('/audit-log', async (req: Request, res: Response) => {
  try {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.errors[0].message,
      });
    }

    const { page, limit, adminId, action, resourceType, resourceId, startDate, endDate, status } = parsed.data;

    const result = queryAuditLogs({
      page,
      limit,
      adminId,
      action,
      resourceType,
      resourceId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status,
    });

    logger.info('[Audit] Query audit logs', {
      adminId: (req as any).adminId,
      filters: { page, limit, adminId, action, resourceType },
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    logger.error('[Audit] Query error:', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to query audit logs' });
  }
});

/**
 * Get audit log entry by ID
 * GET /admin/audit-log/:id
 */
router.get('/audit-log/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = queryAuditLogs({
      page: 1,
      limit: 1,
      resourceId: id,
    });

    if (result.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Audit entry not found',
      });
    }

    logger.info('[Audit] Get audit entry', {
      adminId: (req as any).adminId,
      auditId: id,
    });

    res.json({
      success: true,
      data: result.data[0],
    });
  } catch (error: any) {
    logger.error('[Audit] Get entry error:', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to get audit entry' });
  }
});

/**
 * Get audit statistics
 * GET /admin/audit-log/stats
 */
router.get('/audit-log/stats', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    // Get recent logs for stats calculation
    const result = queryAuditLogs({
      page: 1,
      limit: 1000,
      startDate: startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: endDate ? new Date(endDate as string) : new Date(),
    });

    const logs = result.data;

    // Calculate statistics
    const stats = {
      totalActions: logs.length,
      successCount: logs.filter(l => l.status === 'success').length,
      failureCount: logs.filter(l => l.status === 'failure').length,
      byAction: {} as Record<string, number>,
      byResourceType: {} as Record<string, number>,
      byAdmin: {} as Record<string, { actions: number; failures: number }>,
      recentActivity: {
        last24h: logs.filter(l => Date.now() - l.timestamp.getTime() < 24 * 60 * 60 * 1000).length,
        last7d: logs.filter(l => Date.now() - l.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000).length,
      },
    };

    // Group by action
    for (const log of logs) {
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
    }

    // Group by resource type
    for (const log of logs) {
      stats.byResourceType[log.resourceType] = (stats.byResourceType[log.resourceType] || 0) + 1;
    }

    // Group by admin
    for (const log of logs) {
      if (!stats.byAdmin[log.adminId]) {
        stats.byAdmin[log.adminId] = { actions: 0, failures: 0 };
      }
      stats.byAdmin[log.adminId].actions++;
      if (log.status === 'failure') {
        stats.byAdmin[log.adminId].failures++;
      }
    }

    logger.info('[Audit] Get audit stats', {
      adminId: (req as any).adminId,
    });

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error('[Audit] Stats error:', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to get audit statistics' });
  }
});

/**
 * Export audit logs
 * POST /admin/export/audit-log
 */
router.post('/export/audit-log', async (req: Request, res: Response) => {
  try {
    const { format = 'csv', filters = {} } = req.body;

    // Parse dates if provided
    const parsedFilters = {
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    };

    const result = queryAuditLogs({
      ...parsedFilters,
      page: 1,
      limit: 10000, // Max export size
    });

    // Generate download URL (in production, this would generate actual file)
    const downloadUrl = `/exports/audit-log_${Date.now()}.${format}`;

    logger.info('[Audit] Export audit logs', {
      adminId: (req as any).adminId,
      format,
      recordCount: result.data.length,
    });

    res.json({
      success: true,
      data: {
        downloadUrl,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        recordCount: result.data.length,
      },
    });
  } catch (error: any) {
    logger.error('[Audit] Export error:', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to export audit logs' });
  }
});

/**
 * Create manual audit entry (for complex actions)
 * POST /admin/audit-log
 */
const createAuditSchema = z.object({
  action: z.enum(['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'SUSPEND', 'ACTIVATE', 'LOGIN', 'LOGOUT', 'EXPORT', 'BULK_OPERATION', 'SETTINGS_CHANGE']),
  resourceType: z.enum(['USER', 'MERCHANT', 'ORDER', 'PRODUCT', 'CATEGORY', 'CAMPAIGN', 'ADMIN_USER', 'SYSTEM_CONFIG', 'REFUND', 'CASHBACK', 'REPORT']),
  resourceId: z.string().optional(),
  previousValue: z.any().optional(),
  newValue: z.any().optional(),
  metadata: z.record(z.any()).optional(),
});

router.post('/audit-log', async (req: Request, res: Response) => {
  try {
    const parsed = createAuditSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.errors[0].message,
      });
    }

    const { action, resourceType, resourceId, previousValue, newValue, metadata } = parsed.data;

    const entry = await auditAdminAction(
      req as any,
      action as AuditAction,
      resourceType as ResourceType,
      {
        resourceId,
        previousValue,
        newValue,
        metadata,
      }
    );

    logger.info('[Audit] Manual audit entry created', {
      adminId: (req as any).adminId,
      action,
      resourceType,
      resourceId,
    });

    res.status(201).json({
      success: true,
      data: entry,
    });
  } catch (error: any) {
    logger.error('[Audit] Create error:', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to create audit entry' });
  }
});

export default router;
