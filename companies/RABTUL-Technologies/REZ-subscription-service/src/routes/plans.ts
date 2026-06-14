import { Router, Request, Response } from 'express';
import { Plan } from '../models';
import { BillingCycle } from '../types';
import { asyncHandler, authenticateInternal } from '../middleware';

const router = Router();

// Apply authentication to all routes
router.use(authenticateInternal);

/**
 * GET /api/v1/plans
 * List all available plans
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { billingCycle, isPublic = 'true' } = req.query;

    const query: Record<string, unknown> = { isActive: true };

    if (billingCycle) {
      query.billingCycle = billingCycle;
    }

    const plans = await Plan.find(query).sort({ sortOrder: 1, price: 1 });

    res.json({
      success: true,
      data: plans
    });
  })
);

/**
 * GET /api/v1/plans/:id
 * Get plan by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const plan = await Plan.findOne({ planId: id, isActive: true });

    if (!plan) {
      res.status(404).json({
        success: false,
        error: 'Plan not found'
      });
      return;
    }

    res.json({
      success: true,
      data: plan
    });
  })
);

export default router;
