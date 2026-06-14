import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Subscription, PlanType, SubscriptionStatus, PLAN_BENEFITS, PLAN_PRICES, PLAN_DURATIONS } from '../models';

const router = Router();

// Validation schemas
const createSubscriptionSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  plan: z.enum(['monthly', 'quarterly', 'yearly']),
  paymentId: z.string().optional()
});

const updateSubscriptionSchema = z.object({
  plan: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
  autoRenew: z.boolean().optional(),
  paymentId: z.string().optional()
});

const renewSubscriptionSchema = z.object({
  paymentId: z.string().optional()
});

// Helper function for error handling
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Middleware to validate request body
const validateBody = (schema: z.ZodSchema) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
        return;
      }
      next(error);
    }
  });
};

// Error response helper
const errorResponse = (res: Response, statusCode: number, message: string, details?: any) => {
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(details && { details })
  });
};

// Success response helper
const successResponse = (res: Response, data: any, message?: string) => {
  res.json({
    success: true,
    ...(message && { message }),
    data
  });
};

// Calculate end date based on plan
const calculateEndDate = (plan: PlanType, startDate: Date = new Date()): Date => {
  const duration = PLAN_DURATIONS[plan];
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + duration);
  return endDate;
};

// Generate subscription ID
const generateSubscriptionId = (): string => {
  return `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

// POST / - Create subscription
router.post(
  '/',
  validateBody(createSubscriptionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, plan, paymentId } = req.body;

    // Check if user already has an active subscription
    const existingSubscription = await Subscription.findOne({
      userId,
      status: 'active'
    });

    if (existingSubscription) {
      errorResponse(res, 409, 'User already has an active subscription', {
        subscriptionId: existingSubscription.subscriptionId,
        endDate: existingSubscription.endDate
      });
      return;
    }

    const startDate = new Date();
    const endDate = calculateEndDate(plan, startDate);

    const subscription = new Subscription({
      subscriptionId: generateSubscriptionId(),
      userId,
      plan,
      status: 'active',
      startDate,
      endDate,
      autoRenew: true,
      benefits: PLAN_BENEFITS[plan],
      price: PLAN_PRICES[plan],
      paymentId
    });

    await subscription.save();

    successResponse(res, subscription, 'Subscription created successfully');
  })
);

// GET / - List all subscriptions
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const subscriptions = await Subscription.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Subscription.countDocuments();

    successResponse(res, {
      subscriptions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  })
);

// GET /:id - Get subscription by ID
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const subscription = await Subscription.findOne({
      $or: [{ subscriptionId: id }, { _id: id }]
    });

    if (!subscription) {
      errorResponse(res, 404, 'Subscription not found');
      return;
    }

    successResponse(res, subscription);
  })
);

// GET /user/:userId - Get subscriptions by user
router.get(
  '/user/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const subscriptions = await Subscription.find({ userId }).sort({ createdAt: -1 });

    successResponse(res, {
      subscriptions,
      count: subscriptions.length
    });
  })
);

// GET /user/:userId/active - Get active subscription for user
router.get(
  '/user/:userId/active',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const subscription = await Subscription.findOne({
      userId,
      status: 'active'
    });

    if (!subscription) {
      errorResponse(res, 404, 'No active subscription found');
      return;
    }

    // Check if subscription has expired
    if (subscription.endDate < new Date()) {
      subscription.status = 'expired';
      await subscription.save();
      errorResponse(res, 404, 'Subscription has expired');
      return;
    }

    successResponse(res, subscription);
  })
);

// PATCH /:id - Update subscription
router.patch(
  '/:id',
  validateBody(updateSubscriptionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { plan, autoRenew, paymentId } = req.body;

    const subscription = await Subscription.findOne({
      $or: [{ subscriptionId: id }, { _id: id }]
    });

    if (!subscription) {
      errorResponse(res, 404, 'Subscription not found');
      return;
    }

    if (plan && plan !== subscription.plan) {
      // Update plan details
      subscription.plan = plan;
      subscription.benefits = PLAN_BENEFITS[plan];
      subscription.price = PLAN_PRICES[plan];

      // Recalculate end date from current date
      const newEndDate = calculateEndDate(plan, new Date());
      subscription.endDate = newEndDate;
    }

    if (autoRenew !== undefined) {
      subscription.autoRenew = autoRenew;
    }

    if (paymentId) {
      subscription.paymentId = paymentId;
    }

    await subscription.save();

    successResponse(res, subscription, 'Subscription updated successfully');
  })
);

// PATCH /:id/pause - Pause subscription
router.patch(
  '/:id/pause',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const subscription = await Subscription.findOne({
      $or: [{ subscriptionId: id }, { _id: id }]
    });

    if (!subscription) {
      errorResponse(res, 404, 'Subscription not found');
      return;
    }

    if (subscription.status !== 'active') {
      errorResponse(res, 400, 'Only active subscriptions can be paused', {
        currentStatus: subscription.status
      });
      return;
    }

    subscription.status = 'paused';
    await subscription.save();

    successResponse(res, subscription, 'Subscription paused successfully');
  })
);

// PATCH /:id/resume - Resume subscription
router.patch(
  '/:id/resume',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const subscription = await Subscription.findOne({
      $or: [{ subscriptionId: id }, { _id: id }]
    });

    if (!subscription) {
      errorResponse(res, 404, 'Subscription not found');
      return;
    }

    if (subscription.status !== 'paused') {
      errorResponse(res, 400, 'Only paused subscriptions can be resumed', {
        currentStatus: subscription.status
      });
      return;
    }

    subscription.status = 'active';
    await subscription.save();

    successResponse(res, subscription, 'Subscription resumed successfully');
  })
);

// PATCH /:id/cancel - Cancel subscription
router.patch(
  '/:id/cancel',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const subscription = await Subscription.findOne({
      $or: [{ subscriptionId: id }, { _id: id }]
    });

    if (!subscription) {
      errorResponse(res, 404, 'Subscription not found');
      return;
    }

    if (subscription.status === 'cancelled') {
      errorResponse(res, 400, 'Subscription is already cancelled');
      return;
    }

    subscription.status = 'cancelled';
    subscription.autoRenew = false;
    await subscription.save();

    successResponse(res, subscription, 'Subscription cancelled successfully');
  })
);

// POST /:id/renew - Renew subscription
router.post(
  '/:id/renew',
  validateBody(renewSubscriptionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { paymentId } = req.body;

    const subscription = await Subscription.findOne({
      $or: [{ subscriptionId: id }, { _id: id }]
    });

    if (!subscription) {
      errorResponse(res, 404, 'Subscription not found');
      return;
    }

    if (subscription.status === 'cancelled') {
      errorResponse(res, 400, 'Cannot renew a cancelled subscription');
      return;
    }

    const now = new Date();

    // If subscription has ended, start fresh; otherwise extend
    if (subscription.endDate <= now) {
      subscription.startDate = now;
    }

    const newEndDate = new Date(subscription.endDate);
    newEndDate.setDate(newEndDate.getDate() + PLAN_DURATIONS[subscription.plan]);
    subscription.endDate = newEndDate;

    subscription.status = 'active';

    if (paymentId) {
      subscription.paymentId = paymentId;
    }

    await subscription.save();

    successResponse(res, subscription, 'Subscription renewed successfully');
  })
);

// DELETE /:id - Delete subscription
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const subscription = await Subscription.findOneAndDelete({
      $or: [{ subscriptionId: id }, { _id: id }]
    });

    if (!subscription) {
      errorResponse(res, 404, 'Subscription not found');
      return;
    }

    successResponse(res, null, 'Subscription deleted successfully');
  })
);

export default router;