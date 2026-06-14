import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import linkedInService from '../services/linkedin.service';
import logger from '../utils/logger';
import { validateBody, requireTenantId } from '../middleware/validation.middleware';
import { AnalyticsRequestSchema } from '../validators/linkedin.schemas';
import { ApiResponse } from '../types';

const router = Router();

// Apply tenant ID requirement to all routes
router.use(requireTenantId());

/**
 * POST /analytics/campaigns - Get campaign analytics
 */
router.post(
  '/campaigns',
  validateBody(AnalyticsRequestSchema),
  async (req: Request, res: Response) => {
    const requestId = uuidv4();
    const tenantId = req.headers['x-tenant-id'] as string;

    try {
      const analytics = await linkedInService.getCampaignAnalytics(tenantId, req.body);

      logger.info('Analytics retrieved', {
        campaignCount: analytics.length,
        tenantId,
        requestId,
      });

      const response: ApiResponse<typeof analytics> = {
        success: true,
        data: analytics,
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get analytics', {
        error: error instanceof Error ? error.message : String(error),
        tenantId,
        requestId,
      });

      const response: ApiResponse = {
        success: false,
        error: {
          code: 'ANALYTICS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get analytics',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      };
      res.status(500).json(response);
    }
  }
);

export default router;
