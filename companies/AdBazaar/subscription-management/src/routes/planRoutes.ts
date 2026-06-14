import { Router, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { planService } from '../services/index.js';
import { PlanSchema } from '../types/index.js';
import logger from 'utils/logger.js';
import { httpRequestDuration, httpRequestTotal } from '../utils/metrics.js';

const router = Router();

// Helper for timing and metrics
const withMetrics = (handler: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    try {
      await handler(req, res, next);
    } finally {
      const duration = (Date.now() - start) / 1000;
      const route = req.route?.path || req.path;
      httpRequestDuration.observe(
        { method: req.method, route, status_code: res.statusCode },
        duration
      );
      httpRequestTotal.inc({ method: req.method, route, status_code: res.statusCode });
    }
  };
};

// Validation error handler
const validate = (schema: any, data: any) => {
  try {
    return { success: true, data: schema.parse(data) };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      };
    }
    return { success: false, error: 'Validation failed' };
  }
};

// POST /api/plans - Create plan
router.post('/', withMetrics(async (req: Request, res: Response) => {
  try {
    const validation = validate(PlanSchema, req.body);
    if (!validation.success) {
      res.status(400).json({ success: false, error: validation.error });
      return;
    }

    const result = await planService.createPlan(validation.data);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    logger.error('Error creating plan', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}));

// GET /api/plans - List plans
router.get('/', withMetrics(async (req: Request, res: Response) => {
  try {
    const filters = {
      type: req.query.type as any,
      isActive: req.query.isActive !== 'false',
      page: parseInt(req.query.page as string) || 1,
      limit: Math.min(parseInt(req.query.limit as string) || 20, 100)
    };

    const result = await planService.listPlans(filters);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    logger.error('Error listing plans', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}));

// GET /api/plans/compare - Compare plans
router.get('/compare', withMetrics(async (req: Request, res: Response) => {
  try {
    const planIds = (req.query.ids as string)?.split(',') || [];

    if (planIds.length < 2) {
      res.status(400).json({ success: false, error: 'At least 2 plan IDs required for comparison' });
      return;
    }

    const result = await planService.comparePlans(planIds);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    logger.error('Error comparing plans', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}));

// GET /api/plans/:id - Get plan
router.get('/:id', withMetrics(async (req: Request, res: Response) => {
  try {
    const plan = await planService.getPlanById(req.params.id);

    if (plan) {
      res.json({ success: true, data: plan });
    } else {
      res.status(404).json({ success: false, error: 'Plan not found' });
    }
  } catch (error) {
    logger.error('Error getting plan', { error, id: req.params.id });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}));

// GET /api/plans/:id/pricing - Get plan pricing
router.get('/:id/pricing', withMetrics(async (req: Request, res: Response) => {
  try {
    const result = await planService.getPlanPricing(req.params.id);

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    logger.error('Error getting plan pricing', { error, id: req.params.id });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}));

// PUT /api/plans/:id - Update plan
router.put('/:id', withMetrics(async (req: Request, res: Response) => {
  try {
    const result = await planService.updatePlan(req.params.id, req.body);

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    logger.error('Error updating plan', { error, id: req.params.id });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}));

// DELETE /api/plans/:id - Deactivate plan
router.delete('/:id', withMetrics(async (req: Request, res: Response) => {
  try {
    const result = await planService.deactivatePlan(req.params.id);

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    logger.error('Error deactivating plan', { error, id: req.params.id });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}));

export default router;