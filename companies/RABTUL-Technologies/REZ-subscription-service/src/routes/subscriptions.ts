import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  subscriptionManager,
  billingEngine,
  usageTracker,
  paymentCollector
} from '../services';
import {
  SubscriptionCreateSchema,
  SubscriptionUpdateSchema,
  UsageRecordSchema,
  PauseSubscriptionSchema,
  CancelSubscriptionSchema,
  UpgradeDowngradeSchema,
  InvoiceStatus
} from '../types';
import {
  asyncHandler,
  authenticateInternal
} from '../middleware';
import { Invoice, Plan } from '../models';
import { logger } from '../utils';

const router = Router();

// Apply authentication to all routes
router.use(authenticateInternal);

/**
 * POST /api/v1/subscriptions
 * Create a new subscription
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = SubscriptionCreateSchema.parse(req.body);

    const subscription = await subscriptionManager.createSubscription(validatedData);

    res.status(201).json({
      success: true,
      data: subscription
    });
  })
);

/**
 * GET /api/v1/subscriptions
 * List subscriptions (with optional filters)
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { customerId, status, limit = 50, offset = 0 } = req.query;

    let subscriptions;

    if (customerId) {
      subscriptions = await subscriptionManager.getSubscriptionsByCustomer(
        customerId as string,
        { limit: parseInt(limit as string, 10) }
      );
    } else {
      // For admin listing - would need to add this method
      subscriptions = [];
    }

    res.json({
      success: true,
      data: subscriptions,
      pagination: {
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
        count: subscriptions.length
      }
    });
  })
);

/**
 * GET /api/v1/subscriptions/:id
 * Get subscription by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const subscription = await subscriptionManager.getSubscription(id);

    if (!subscription) {
      res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
      return;
    }

    res.json({
      success: true,
      data: subscription
    });
  })
);

/**
 * PATCH /api/v1/subscriptions/:id
 * Update subscription
 */
router.patch(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const validatedData = SubscriptionUpdateSchema.parse(req.body);

    const subscription = await subscriptionManager.updateSubscription(id, validatedData);

    res.json({
      success: true,
      data: subscription
    });
  })
);

/**
 * POST /api/v1/subscriptions/:id/pause
 * Pause subscription
 */
router.post(
  '/:id/pause',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const validatedData = PauseSubscriptionSchema.parse(req.body);

    const subscription = await subscriptionManager.pauseSubscription(id, validatedData);

    res.json({
      success: true,
      data: subscription,
      message: 'Subscription paused successfully'
    });
  })
);

/**
 * POST /api/v1/subscriptions/:id/resume
 * Resume paused subscription
 */
router.post(
  '/:id/resume',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const subscription = await subscriptionManager.resumeSubscription(id);

    res.json({
      success: true,
      data: subscription,
      message: 'Subscription resumed successfully'
    });
  })
);

/**
 * POST /api/v1/subscriptions/:id/cancel
 * Cancel subscription
 */
router.post(
  '/:id/cancel',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const validatedData = CancelSubscriptionSchema.parse(req.body);

    const subscription = await subscriptionManager.cancelSubscription(id, validatedData);

    res.json({
      success: true,
      data: subscription,
      message: validatedData.cancellationEffectiveDate === 'period_end'
        ? 'Subscription will be cancelled at period end'
        : 'Subscription cancelled successfully'
    });
  })
);

/**
 * POST /api/v1/subscriptions/:id/reactivate
 * Reactivate cancelled subscription
 */
router.post(
  '/:id/reactivate',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const subscription = await subscriptionManager.reactivateSubscription(id);

    res.json({
      success: true,
      data: subscription,
      message: 'Subscription reactivated successfully'
    });
  })
);

/**
 * POST /api/v1/subscriptions/:id/change-plan
 * Change subscription plan (upgrade/downgrade)
 */
router.post(
  '/:id/change-plan',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const validatedData = UpgradeDowngradeSchema.parse(req.body);

    const subscription = await subscriptionManager.changePlan(id, validatedData);

    res.json({
      success: true,
      data: subscription,
      message: 'Plan changed successfully'
    });
  })
);

/**
 * GET /api/v1/subscriptions/:id/usage
 * Get usage for a subscription
 */
router.get(
  '/:id/usage',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const usage = await usageTracker.getUsageRecords(id, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });

    res.json({
      success: true,
      data: usage
    });
  })
);

/**
 * GET /api/v1/subscriptions/:id/invoices
 * Get invoices for a subscription
 */
router.get(
  '/:id/invoices',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const invoices = await Invoice.find({ subscriptionId: id })
      .sort({ createdAt: -1 })
      .skip(parseInt(offset as string, 10))
      .limit(parseInt(limit as string, 10));

    const total = await Invoice.countDocuments({ subscriptionId: id });

    res.json({
      success: true,
      data: invoices,
      pagination: {
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
        total
      }
    });
  })
);

/**
 * POST /api/v1/subscriptions/:id/retry-payment
 * Retry payment for subscription
 */
router.post(
  '/:id/retry-payment',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await paymentCollector.retryPayment(id);

    res.json({
      success: result.success,
      message: result.success
        ? 'Payment successful'
        : 'Payment failed',
      error: result.error
    });
  })
);

export default router;
