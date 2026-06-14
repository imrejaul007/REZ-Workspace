import { Router, Response } from 'express';
import { supportAnalyticsService, ticketWorkflowService } from '../services/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/support/analytics/employee/:id
 * Get employee support statistics
 */
router.get(
  '/analytics/employee/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ success: false, error: 'Company ID not found' });
      return;
    }

    const stats = await supportAnalyticsService.getEmployeeStats(req.params.id, companyId);

    res.json({ success: true, data: stats });
  })
);

/**
 * GET /api/support/analytics/company
 * Get company-wide support analytics
 */
router.get(
  '/analytics/company',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { startDate, endDate } = req.query;
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ success: false, error: 'Company ID not found' });
      return;
    }

    const analytics = await supportAnalyticsService.getCompanyAnalytics(companyId, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.json({ success: true, data: analytics });
  })
);

/**
 * GET /api/support/analytics/agents
 * Get agent performance metrics
 */
router.get(
  '/analytics/agents',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { startDate, endDate } = req.query;
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ success: false, error: 'Company ID not found' });
      return;
    }

    const metrics = await supportAnalyticsService.getAgentMetrics(companyId, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.json({ success: true, data: metrics });
  })
);

/**
 * GET /api/support/analytics/trends
 * Get support trends
 */
router.get(
  '/analytics/trends',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { days } = req.query;
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ success: false, error: 'Company ID not found' });
      return;
    }

    const trends = await supportAnalyticsService.getSupportTrends(
      companyId,
      days ? parseInt(days as string) : 30
    );

    res.json({ success: true, data: trends });
  })
);

/**
 * GET /api/support/analytics/workflow
 * Get workflow statistics
 */
router.get(
  '/analytics/workflow',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const companyId = req.user?.companyId;

    if (!companyId) {
      res.status(400).json({ success: false, error: 'Company ID not found' });
      return;
    }

    const stats = await ticketWorkflowService.getWorkflowStats(companyId);

    res.json({ success: true, data: stats });
  })
);

export default router;
