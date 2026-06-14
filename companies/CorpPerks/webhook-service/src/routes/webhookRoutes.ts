import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { webhookService } from '../services/webhookService.js';
import { internalAuth, optionalAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody, validateQuery, validateParams, schemas } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Validation schemas
const createSubscriptionSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string().min(1)).min(1),
  description: z.string().optional(),
  headers: z.record(z.string()).optional(),
});

const updateSubscriptionSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.string().min(1)).min(1).optional(),
  isActive: z.boolean().optional(),
  description: z.string().optional(),
  headers: z.record(z.string()).optional(),
});

const getLogsQuerySchema = z.object({
  subscriptionId: z.string().optional(),
  eventType: z.string().optional(),
  status: z.enum(['pending', 'success', 'failed', 'retrying']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

/**
 * POST /api/webhooks/subscribe
 * Create a new webhook subscription
 */
router.post(
  '/subscribe',
  internalAuth,
  validateBody(createSubscriptionSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { url, events, description, headers } = req.body;
    const createdBy = req.headers['x-user-id'] as string || 'system';

    const subscription = await webhookService.createSubscription({
      url,
      events,
      description,
      headers,
      createdBy,
    });

    logger.info('Webhook subscription created via API', {
      subscriptionId: subscription._id,
      url,
      events,
    });

    res.status(201).json({
      success: true,
      data: {
        id: subscription._id,
        url: subscription.url,
        events: subscription.events,
        secret: subscription.secret,
        description: subscription.description,
        isActive: subscription.isActive,
        createdAt: subscription.createdAt,
      },
    });
  })
);

/**
 * GET /api/webhooks/subscriptions
 * List all webhook subscriptions
 */
router.get(
  '/subscriptions',
  internalAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { events, isActive, createdBy } = req.query;

    const subscriptions = await webhookService.getSubscriptions({
      events: events ? (events as string).split(',') : undefined,
      isActive: isActive ? isActive === 'true' : undefined,
      createdBy: createdBy as string,
    });

    res.json({
      success: true,
      data: subscriptions.map((sub) => ({
        id: sub._id,
        url: sub.url,
        events: sub.events,
        description: sub.description,
        isActive: sub.isActive,
        successCount: sub.successCount,
        failureCount: sub.failureCount,
        lastTriggeredAt: sub.lastTriggeredAt,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
      })),
    });
  })
);

/**
 * GET /api/webhooks/subscriptions/:id
 * Get a specific subscription
 */
router.get(
  '/subscriptions/:id',
  internalAuth,
  validateParams(schemas.objectId),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const subscription = await webhookService.getSubscriptionById(req.params.id);

    if (!subscription) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Subscription not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: subscription._id,
        url: subscription.url,
        events: subscription.events,
        secret: subscription.secret,
        description: subscription.description,
        isActive: subscription.isActive,
        successCount: subscription.successCount,
        failureCount: subscription.failureCount,
        lastTriggeredAt: subscription.lastTriggeredAt,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      },
    });
  })
);

/**
 * PATCH /api/webhooks/subscriptions/:id
 * Update a subscription
 */
router.patch(
  '/subscriptions/:id',
  internalAuth,
  validateParams(schemas.objectId),
  validateBody(updateSubscriptionSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const subscription = await webhookService.updateSubscription(
      req.params.id,
      req.body
    );

    if (!subscription) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Subscription not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: subscription._id,
        url: subscription.url,
        events: subscription.events,
        description: subscription.description,
        isActive: subscription.isActive,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      },
    });
  })
);

/**
 * DELETE /api/webhooks/subscriptions/:id
 * Delete a subscription
 */
router.delete(
  '/subscriptions/:id',
  internalAuth,
  validateParams(schemas.objectId),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const deleted = await webhookService.deleteSubscription(req.params.id);

    if (!deleted) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Subscription not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Subscription deleted successfully',
    });
  })
);

/**
 * POST /api/webhooks/test
 * Test a webhook subscription
 */
router.post(
  '/test',
  internalAuth,
  validateBody(z.object({
    subscriptionId: z.string(),
  })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { subscriptionId } = req.body;

    try {
      const result = await webhookService.testSubscription(subscriptionId);

      res.json({
        success: true,
        data: {
          subscriptionId,
          success: result.success,
          statusCode: result.statusCode,
          responseBody: result.responseBody,
          error: result.error,
          processingTimeMs: result.processingTimeMs,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({
        success: false,
        error: 'Test Failed',
        message,
      });
    }
  })
);

/**
 * GET /api/webhooks/logs
 * Get webhook delivery logs
 */
router.get(
  '/logs',
  internalAuth,
  validateQuery(getLogsQuerySchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const query = req.query as z.infer<typeof getLogsQuerySchema>;

    const { logs, total } = await webhookService.getLogs({
      subscriptionId: query.subscriptionId,
      eventType: query.eventType,
      status: query.status,
      limit: query.limit,
      offset: query.offset,
      startDate: query.startDate,
      endDate: query.endDate,
    });

    res.json({
      success: true,
      data: {
        logs: logs.map((log) => ({
          id: log._id,
          subscriptionId: log.subscriptionId,
          eventType: log.eventType,
          status: log.status,
          attempts: log.attempts,
          maxAttempts: log.maxAttempts,
          response: log.response,
          error: log.error,
          processingTimeMs: log.processingTimeMs,
          createdAt: log.createdAt,
          completedAt: log.completedAt,
        })),
        pagination: {
          total,
          limit: query.limit,
          offset: query.offset,
          hasMore: query.offset + logs.length < total,
        },
      },
    });
  })
);

/**
 * POST /api/webhooks/trigger
 * Trigger webhooks for an event (internal use)
 */
router.post(
  '/trigger',
  internalAuth,
  validateBody(z.object({
    eventType: z.string().min(1),
    payload: z.record(z.unknown()),
    source: z.string().optional(),
    idempotencyKey: z.string().optional(),
  })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { eventType, payload, source, idempotencyKey } = req.body;

    const eventIds = await webhookService.triggerWebhooks(eventType, payload, {
      source,
      idempotencyKey,
    });

    res.json({
      success: true,
      data: {
        eventType,
        eventIds,
        subscriptionCount: eventIds.length,
      },
    });
  })
);

/**
 * GET /api/webhooks/stats
 * Get webhook statistics
 */
router.get(
  '/stats',
  internalAuth,
  asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const subscriptions = await webhookService.getSubscriptions();
    const { logs: recentLogs } = await webhookService.getLogs({ limit: 100 });

    const stats = {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: subscriptions.filter((s) => s.isActive).length,
      totalEvents: recentLogs.length,
      successRate: recentLogs.length > 0
        ? (recentLogs.filter((l) => l.status === 'success').length / recentLogs.length) * 100
        : 0,
      averageProcessingTimeMs: recentLogs.length > 0
        ? recentLogs.reduce((sum, l) => sum + (l.processingTimeMs || 0), 0) / recentLogs.length
        : 0,
    };

    res.json({
      success: true,
      data: stats,
    });
  })
);

export default router;
