import { Router, Request, Response } from 'express';
import responderService from '../services/responderService';
import { ResponsePlatform, AutoResponseLog, ApiResponse, PaginatedResponse } from '../types';
import logger from '../utils/logger';

const router = Router();

const getTenantId = (req: Request): string => {
  return req.headers['x-tenant-id'] as string || 'default';
};

// Stats
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const stats = responderService.getStats(tenantId);

    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Response Logs
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const templateId = req.query.templateId as string | undefined;
    const status = req.query.status as string | undefined;
    const platform = req.query.platform as ResponsePlatform | undefined;

    const { logs, total } = responderService.getResponseLogs(tenantId, {
      templateId,
      status,
      platform,
      page,
      limit
    });

    const response: PaginatedResponse<AutoResponseLog> = {
      success: true,
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching response logs:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
