import { Router, Request, Response } from 'express';
import { auditService } from '../services/audit.service';
import { ApiResponse, AuditLogEntry, AuditAction } from '../types';

const router = Router();

const getTenantId = (req: Request): string => {
  const tenantId = req.headers['x-tenant-id'] as string;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }
  return tenantId;
};

// Get audit log for content
router.get('/content/:contentId', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const since = req.query.since ? new Date(req.query.since as string) : undefined;
    const action = req.query.action as AuditAction | undefined;

    const entries = auditService.getByContentItem(req.params.contentId, { limit, since, action });
    const response: ApiResponse<AuditLogEntry[]> = {
      success: true,
      data: entries,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch audit log',
    };
    res.status(500).json(response);
  }
});

// Get audit log for tenant
router.get('/tenant', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const since = req.query.since ? new Date(req.query.since as string) : undefined;
    const action = req.query.action as AuditAction | undefined;
    const contentItemId = req.query.contentItemId as string | undefined;

    const entries = auditService.getByTenant(tenantId, { limit, since, action, contentItemId });
    const response: ApiResponse<AuditLogEntry[]> = {
      success: true,
      data: entries,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch audit log',
    };
    res.status(500).json(response);
  }
});

// Get audit log for user
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const since = req.query.since ? new Date(req.query.since as string) : undefined;

    const entries = auditService.getByUser(tenantId, req.params.userId, { limit, since });
    const response: ApiResponse<AuditLogEntry[]> = {
      success: true,
      data: entries,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch audit log',
    };
    res.status(500).json(response);
  }
});

// Get audit statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const since = req.query.since ? new Date(req.query.since as string) : undefined;

    const stats = auditService.getStats(tenantId, { since });
    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch statistics',
    };
    res.status(500).json(response);
  }
});

export default router;
