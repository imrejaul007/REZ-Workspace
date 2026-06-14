import { Router, Response } from 'express';
import { TenantRequest, requireTenant } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/index.js';
import { analyticsService } from '../services/index.js';

const router = Router();

// All routes require tenant context
router.use(requireTenant);

// Get dashboard summary
router.get(
  '/dashboard',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const summary = await analyticsService.getDashboardSummary(req.tenantId!);
    res.json({
      success: true,
      data: summary,
    });
  })
);

// Get revenue analytics
router.get(
  '/revenue',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const analytics = await analyticsService.getRevenueAnalytics(req.tenantId!, req.query);
    res.json({
      success: true,
      data: analytics,
    });
  })
);

// Get pipeline analytics
router.get(
  '/pipeline',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const analytics = await analyticsService.getPipelineAnalytics(req.tenantId!);
    res.json({
      success: true,
      data: analytics,
    });
  })
);

// Get conversion analytics
router.get(
  '/conversion',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const analytics = await analyticsService.getConversionAnalytics(req.tenantId!, req.query);
    res.json({
      success: true,
      data: analytics,
    });
  })
);

// Get forecasting data
router.get(
  '/forecasting',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const forecast = await analyticsService.getForecasting(req.tenantId!);
    res.json({
      success: true,
      data: forecast,
    });
  })
);

export default router;
