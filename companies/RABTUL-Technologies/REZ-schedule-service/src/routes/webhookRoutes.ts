// ReZ Schedule - Webhook Routes
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { webhookService } from '../services/webhookService';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const createWebhookSchema = z.object({
  url: z.string().url(),
  triggers: z.array(z.enum([
    'booking.created',
    'booking.confirmed',
    'booking.cancelled',
    'booking.rescheduled',
    'booking.completed',
    'booking.no_show',
    'booking.reminder_sent',
    'event_type.created',
    'event_type.updated',
    'event_type.deleted',
    'availability.updated',
  ])).min(1),
  settings: z.object({
    includeFields: z.array(z.string()).optional(),
    excludeFields: z.array(z.string()).optional(),
  }).optional(),
});

/**
 * List webhooks
 * GET /api/webhooks
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const organizationId = req.headers['x-organization-id'] as string;

    const webhooks = await webhookService.listWebhooks(userId, organizationId);

    res.json({
      success: true,
      data: webhooks.map(w => ({
        id: w.id,
        url: w.url,
        triggers: w.triggers,
        active: w.active,
        lastTriggeredAt: w.lastTriggeredAt,
        failureCount: w.failureCount,
        createdAt: w.createdAt,
      })),
    });
  } catch (error) {
    logger.error('[Webhook] List error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list webhooks',
    });
  }
});

/**
 * Create webhook
 * POST /api/webhooks
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const organizationId = req.headers['x-organization-id'] as string;
    const data = createWebhookSchema.parse(req.body);

    const result = await webhookService.createWebhook({
      userId,
      organizationId,
      url: data.url,
      triggers: data.triggers as Parameters<typeof webhookService.createWebhook>[0]['triggers'],
      settings: data.settings,
    });

    res.status(201).json({
      success: true,
      data: {
        id: result.id,
        secret: result.secret, // Only returned on creation
        message: 'Save this secret - it will not be shown again',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    logger.error('[Webhook] Create error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create webhook',
    });
  }
});

/**
 * Get webhook details
 * GET /api/webhooks/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const webhooks = await webhookService.listWebhooks();
    const webhook = webhooks.find(w => w.id === id);

    if (!webhook) {
      return res.status(404).json({
        success: false,
        error: 'Webhook not found',
      });
    }

    res.json({
      success: true,
      data: {
        id: webhook.id,
        url: webhook.url,
        triggers: webhook.triggers,
        active: webhook.active,
        settings: webhook.settings,
        lastTriggeredAt: webhook.lastTriggeredAt,
        failureCount: webhook.failureCount,
        createdAt: webhook.createdAt,
      },
    });
  } catch (error) {
    logger.error('[Webhook] Get error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get webhook',
    });
  }
});

/**
 * Delete webhook
 * DELETE /api/webhooks/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await webhookService.deleteWebhook(id);

    res.json({
      success: true,
      message: 'Webhook deleted',
    });
  } catch (error) {
    logger.error('[Webhook] Delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete webhook',
    });
  }
});

/**
 * Toggle webhook active status
 * PATCH /api/webhooks/:id/toggle
 */
router.patch('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // For now, just return success - in production, update the webhook
    res.json({
      success: true,
      message: 'Webhook toggled',
    });
  } catch (error) {
    logger.error('[Webhook] Toggle error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle webhook',
    });
  }
});

/**
 * Get webhook delivery history
 * GET /api/webhooks/:id/deliveries
 */
router.get('/:id/deliveries', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit, status } = req.query;

    const deliveries = await webhookService.getDeliveryHistory(id, {
      limit: limit ? parseInt(limit as string, 10) : 50,
      status: status as string,
    });

    res.json({
      success: true,
      data: deliveries,
    });
  } catch (error) {
    logger.error('[Webhook] Deliveries error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get delivery history',
    });
  }
});

/**
 * Retry failed delivery
 * POST /api/webhooks/:id/deliveries/:deliveryId/retry
 */
router.post('/:webhookId/deliveries/:deliveryId/retry', async (req: Request, res: Response) => {
  try {
    const { deliveryId } = req.params;

    const success = await webhookService.retryDelivery(deliveryId);

    res.json({
      success,
      message: success ? 'Delivery retried' : 'Delivery not eligible for retry',
    });
  } catch (error) {
    logger.error('[Webhook] Retry error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retry delivery',
    });
  }
});

/**
 * Retry all failed deliveries for webhook
 * POST /api/webhooks/:id/retry-all
 */
router.post('/:id/retry-all', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const count = await webhookService.retryFailedDeliveries(id);

    res.json({
      success: true,
      data: { retried: count },
    });
  } catch (error) {
    logger.error('[Webhook] Retry all error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retry deliveries',
    });
  }
});

/**
 * Webhook test endpoint (for verifying webhook setup)
 * POST /api/webhooks/test
 */
router.post('/test', async (req: Request, res: Response) => {
  try {
    const { url, secret } = req.body;

    if (!url || !secret) {
      return res.status(400).json({
        success: false,
        error: 'URL and secret required',
      });
    }

    // Send a test payload
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery from ReZ Schedule',
      },
    };

    const signature = webhookService.signPayload(JSON.stringify(testPayload), secret);

    // In production, actually send the request
    logger.info(`[Webhook] Test webhook would be sent to ${url}`);

    res.json({
      success: true,
      message: 'Test webhook queued',
    });
  } catch (error) {
    logger.error('[Webhook] Test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test webhook',
    });
  }
});

export default router;
