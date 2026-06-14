/**
 * Webhook Routes
 *
 * CRUD operations for webhook subscriptions:
 * - List webhooks
 * - Create webhook
 * - Update webhook
 * - Delete webhook
 * - Test webhook
 * - List events
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Webhook } from '../models/Webhook';
import { merchantAuth } from '../middleware/auth';
import {
  generateWebhookSecret,
  generateSignature,
  ALL_WEBHOOK_EVENTS,
  EVENT_CATEGORIES,
  WebhookEvent,
} from '../services/webhookService';
import { rateLimitMiddleware } from '../middleware/rateLimiter';
import { errorResponse, errors } from '../utils/response';
import mongoose from 'mongoose';

const router = Router();
router.use(merchantAuth);

// ── Validation Schemas ─────────────────────────────────────────────────────────

const createWebhookSchema = z.object({
  url: z.string().url('Invalid URL'),
  events: z.array(z.enum(ALL_WEBHOOK_EVENTS as unknown as [string, ...string[]])).min(1, 'At least one event required'),
  description: z.string().max(500).optional(),
  headers: z.record(z.string()).optional(),
});

const updateWebhookSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.enum(ALL_WEBHOOK_EVENTS as unknown as [string, ...string[]])).min(1).optional(),
  isActive: z.boolean().optional(),
  description: z.string().max(500).optional(),
  headers: z.record(z.string()).optional(),
});

const listQuerySchema = z.object({
  isActive: z.enum(['true', 'false']).optional(),
  event: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ── Route Handlers ────────────────────────────────────────────────────────────

/**
 * GET /webhooks
 * List all webhooks for the merchant
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const queryResult = listQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      errorResponse(res, errors.badRequest(queryResult.error.errors[0].message));
      return;
    }

    const { isActive, event, page, limit } = queryResult.data;

    const query: Record<string, unknown> = { merchantId: req.merchantId };
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (event) query.events = event;

    const [webhooks, total] = await Promise.all([
      Webhook.find(query)
        .select('-secret')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Webhook.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: webhooks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to list webhooks' });
  }
});

/**
 * GET /webhooks/events
 * List all available webhook events
 */
router.get('/events', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      events: ALL_WEBHOOK_EVENTS,
      categories: EVENT_CATEGORIES,
    },
  });
});

/**
 * POST /webhooks
 * Create a new webhook subscription
 */
router.post('/', rateLimitMiddleware('WRITE'), async (req: Request, res: Response) => {
  try {
    const bodyResult = createWebhookSchema.safeParse(req.body);
    if (!bodyResult.success) {
      errorResponse(res, errors.badRequest(bodyResult.error.errors[0].message));
      return;
    }

    const { url, events, description, headers } = bodyResult.data;

    // Check for duplicate URL
    const existing = await Webhook.findOne({
      merchantId: req.merchantId,
      url,
      isActive: true,
    });
    if (existing) {
      res.status(409).json({
        success: false,
        message: 'A webhook with this URL already exists',
      });
      return;
    }

    // Generate secret
    const secret = generateWebhookSecret();

    const webhook = await Webhook.create({
      merchantId: req.merchantId,
      url,
      events,
      secret,
      description,
      headers,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Webhook created',
      data: {
        id: webhook._id,
        url: webhook.url,
        events: webhook.events,
        secret: webhook.secret, // Only returned on create
        description: webhook.description,
        isActive: webhook.isActive,
        createdAt: webhook.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create webhook' });
  }
});

/**
 * POST /webhooks/test
 * Send a test event to verify webhook
 */
router.post('/test', rateLimitMiddleware('WRITE'), async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.body;

    if (!webhookId || !mongoose.Types.ObjectId.isValid(webhookId)) {
      errorResponse(res, errors.badRequest('Valid webhookId required'));
      return;
    }

    const webhook = await Webhook.findOne({
      _id: webhookId,
      merchantId: req.merchantId,
    });

    if (!webhook) {
      errorResponse(res, errors.notFound('Webhook'));
      return;
    }

    // Send test event
    const testPayload = {
      id: new mongoose.Types.ObjectId().toString(),
      event: 'test',
      timestamp: new Date().toISOString(),
      merchantId: req.merchantId,
      data: {
        message: 'This is a test webhook delivery',
        webhookId: webhook._id,
      },
    };

    const { deliverWebhook } = await import('../services/webhookService');
    const signature = generateSignature(JSON.stringify(testPayload), webhook.secret);

    // Make the test request directly
    const axios = (await import('axios')).default;
    const response = await axios.post(webhook.url, testPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': 'test',
        'User-Agent': 'ReZ-Merchant-Webhook/2.0',
      },
      timeout: 10000,
    }).catch((err) => err.response);

    res.json({
      success: true,
      data: {
        delivered: response?.status >= 200 && response?.status < 300,
        statusCode: response?.status || 'error',
        responseBody: typeof response?.data === 'string'
          ? response.data.substring(0, 200)
          : JSON.stringify(response?.data || {}).substring(0, 200),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to test webhook' });
  }
});

/**
 * GET /webhooks/:id
 * Get webhook details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errorResponse(res, errors.badRequest('Invalid webhook ID'));
      return;
    }

    const webhook = await Webhook.findOne({
      _id: req.params.id,
      merchantId: req.merchantId,
    }).select('-secret');

    if (!webhook) {
      errorResponse(res, errors.notFound('Webhook'));
      return;
    }

    res.json({ success: true, data: webhook });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get webhook' });
  }
});

/**
 * PUT /webhooks/:id
 * Update webhook
 */
router.put('/:id', rateLimitMiddleware('WRITE'), async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errorResponse(res, errors.badRequest('Invalid webhook ID'));
      return;
    }

    const bodyResult = updateWebhookSchema.safeParse(req.body);
    if (!bodyResult.success) {
      errorResponse(res, errors.badRequest(bodyResult.error.errors[0].message));
      return;
    }

    const webhook = await Webhook.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.merchantId },
      { $set: bodyResult.data },
      { new: true }
    ).select('-secret');

    if (!webhook) {
      errorResponse(res, errors.notFound('Webhook'));
      return;
    }

    res.json({
      success: true,
      message: 'Webhook updated',
      data: webhook,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update webhook' });
  }
});

/**
 * DELETE /webhooks/:id
 * Delete webhook
 */
router.delete('/:id', rateLimitMiddleware('WRITE'), async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errorResponse(res, errors.badRequest('Invalid webhook ID'));
      return;
    }

    const webhook = await Webhook.findOneAndDelete({
      _id: req.params.id,
      merchantId: req.merchantId,
    });

    if (!webhook) {
      errorResponse(res, errors.notFound('Webhook'));
      return;
    }

    res.json({
      success: true,
      message: 'Webhook deleted',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete webhook' });
  }
});

/**
 * POST /webhooks/:id/rotate-secret
 * Rotate webhook secret
 */
router.post('/:id/rotate-secret', rateLimitMiddleware('WRITE'), async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errorResponse(res, errors.badRequest('Invalid webhook ID'));
      return;
    }

    const webhook = await Webhook.findOne({
      _id: req.params.id,
      merchantId: req.merchantId,
    });

    if (!webhook) {
      errorResponse(res, errors.notFound('Webhook'));
      return;
    }

    const newSecret = generateWebhookSecret();
    webhook.secret = newSecret;
    await webhook.save();

    res.json({
      success: true,
      message: 'Secret rotated',
      data: {
        secret: newSecret,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to rotate secret' });
  }
});

export default router;
