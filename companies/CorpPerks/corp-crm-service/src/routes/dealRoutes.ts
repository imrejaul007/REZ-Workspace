import { Router, Response } from 'express';
import { TenantRequest, requireTenant } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/index.js';
import { dealService } from '../services/index.js';

const router = Router();

// All routes require tenant context
router.use(requireTenant);

// Create a new deal
router.post(
  '/',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const deal = await dealService.create(req.body, req.tenantId!);
    res.status(201).json({
      success: true,
      data: deal,
      message: 'Deal created successfully',
    });
  })
);

// Get all deals
router.get(
  '/',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const { deals, total, page, limit } = await dealService.findAll(req.tenantId!, req.query);
    res.json({
      success: true,
      data: deals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// Get pipeline view
router.get(
  '/pipeline',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const pipeline = await dealService.getPipeline(req.tenantId!);
    res.json({
      success: true,
      data: pipeline,
    });
  })
);

// Get a single deal by ID
router.get(
  '/:id',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const deal = await dealService.findById(req.tenantId!, req.params.id);
    if (!deal) {
      res.status(404).json({
        success: false,
        error: 'Deal not found',
      });
      return;
    }
    res.json({
      success: true,
      data: deal,
    });
  })
);

// Update a deal
router.patch(
  '/:id',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const deal = await dealService.update(req.tenantId!, req.params.id, req.body);
    if (!deal) {
      res.status(404).json({
        success: false,
        error: 'Deal not found',
      });
      return;
    }
    res.json({
      success: true,
      data: deal,
      message: 'Deal updated successfully',
    });
  })
);

// Move deal to a new stage
router.post(
  '/:id/stage',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const performedBy = req.userId || 'system';
    const deal = await dealService.moveStage(req.tenantId!, req.params.id, req.body, performedBy);
    if (!deal) {
      res.status(404).json({
        success: false,
        error: 'Deal not found',
      });
      return;
    }
    res.json({
      success: true,
      data: deal,
      message: 'Deal stage updated successfully',
    });
  })
);

// Add activity to deal
router.post(
  '/:id/activities',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const performedBy = req.userId || 'system';
    const deal = await dealService.addActivity(req.tenantId!, req.params.id, req.body, performedBy);
    if (!deal) {
      res.status(404).json({
        success: false,
        error: 'Deal not found',
      });
      return;
    }
    res.status(201).json({
      success: true,
      data: deal,
      message: 'Activity added successfully',
    });
  })
);

// Get deal predictions
router.get(
  '/:id/predictions',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const predictions = await dealService.getPredictions(req.tenantId!, req.params.id);
    res.json({
      success: true,
      data: predictions,
    });
  })
);

export default router;
