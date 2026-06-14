import { Router, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { subscriptionService } from '../services/index.js';
import { invoiceService } from '../services/index.js';
import { CreateSubscriptionSchema, UpdateSubscriptionSchema, UpgradeDowngradeSchema } from '../types/index.js';
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

// POST /api/subscriptions - Create subscription
router.post('/', withMetrics(async (req: Request, res: Response) => {
  try {
    const validation = validate(CreateSubscriptionSchema, req.body);
    if (!validation.success) {
      res.status(400).json({ success: false, error: validation.error });
      return;
    }

    const result = await subscriptionService.createSubscription(validation.data);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    logger.error('Error creating subscription', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}));

// GET /api/subscriptions - List subscriptions
router.get('/', withMetrics(async (req: Request, res: Response) => {
  try {
    const filters = {
      publisherId: req.query.publisherId as string,
      status: req.query.status as any,
      planId: req.query.planId as string,
      page: parseInt(req.query.page as string) || 1,
      limit: Math.min(parseInt(req.query.limit as string) || 20, 100)
    };

    const result = await subscriptionService.listSubscriptions(filters);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    logger.error('Error listing subscriptions', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}));

// GET /api/subscriptions/stats - Get subscription stats
router.get('/stats', withMetrics(async (req: Request, res: Response) => {
  try {
    const { analyticsService } = await import('../services/index.js');
    const result = await analyticsService.getSubscriptionStats();

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    logger.error('Error getting subscription stats', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}));

// GET /api/subscriptions/:id - Get subscription
router.get('/:id', withMetrics(async (req: Request, res: Response) => {
  try {
    const result = await subscriptionService.getSubscription(req.params.id);

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    logger.error('Error getting subscription', { error, id: req.params.id });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}));

// PUT /api/subscriptions/:id - Update subscription
router.put('/:id', withMetrics(async (req: Request, res: Response) => {
  try {
    const validation = validate(UpdateSubscriptionSchema, req.body);
    if (!validation.success) {
      res.status(400).json({ success: false, error: validation.error });
      return;
    }

    const result = await subscriptionService.updateSubscription(req.params.id, validation.data);

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    logger.error('Error updating subscription', { error, id: req.params.id });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}));

// POST /api/subscriptions/:id/cancel - Cancel subscription
router.post('/:id/cancel', withMetrics(async (req: Request, res: Response) => {
  try {
    const { reason, immediate } = req.body;
    const result = await subscriptionService.cancelSubscription(req.params.id, reason, immediate);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    logger.error('Error cancelling subscription', { error, id: req.params.id });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}));

// POST /api/subscriptions/:id/renew - Renew subscription
router.post('/:id/renew', withMetrics(async (req: Request, res: Response) => {
  try {
    const result = await subscriptionService.renewSubscription(req.params.id);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    logger.error('Error renewing subscription', { error, id: req.params.id });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}));

// POST /api/subscriptions/:id/upgrade - Upgrade subscription
router.post('/:id/upgrade', withMetrics(async (req: Request, res: Response) => {
  try {
    const validation = validate(UpgradeDowngradeSchema, req.body);
    if (!validation.success) {
      res.status(400).json({ success: false, error: validation.error });
      return;
    }

    const { newPlanId, effectiveDate, preserveCredits } = validation.data;
    const result = await subscriptionService.upgradeSubscription(
      req.params.id,
      newPlanId,
      effectiveDate,
      preserveCredits
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    logger.error('Error upgrading subscription', { error, id: req.params.id });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}));

// POST /api/subscriptions/:id/downgrade - Downgrade subscription
router.post('/:id/downgrade', withMetrics(async (req: Request, res: Response) => {
  try {
    const validation = validate(UpgradeDowngradeSchema, req.body);
    if (!validation.success) {
      res.status(400).json({ success: false, error: validation.error });
      return;
    }

    const { newPlanId, effectiveDate, preserveCredits } = validation.data;
    const result = await subscriptionService.downgradeSubscription(
      req.params.id,
      newPlanId,
      effectiveDate,
      preserveCredits
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    logger.error('Error downgrading subscription', { error, id: req.params.id });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}));

// GET /api/subscriptions/:id/invoices - Get subscription invoices
router.get('/:id/invoices', withMetrics(async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const result = await invoiceService.getInvoicesBySubscription(
      req.params.id,
      page,
      limit
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    logger.error('Error getting subscription invoices', { error, id: req.params.id });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}));

// GET /api/subscriptions/:id/events - Get subscription events
router.get('/:id/events', withMetrics(async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const result = await subscriptionService.getSubscriptionEvents(
      req.params.id,
      page,
      limit
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    logger.error('Error getting subscription events', { error, id: req.params.id });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}));

export default router;