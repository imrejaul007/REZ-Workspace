/**
 * REZ Forms - Webhook Routes
 * Manage form webhooks
 */

import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';

export const webhookRoutes = Router();

// In-memory webhook storage
const webhooks: Map<string, { id: string; formId: string; url: string; events: string[]; secret: string; enabled: boolean }> = new Map();

const createWebhookSchema = z.object({
  formId: z.string(),
  url: z.string().url(),
  events: z.array(z.enum(['submission', 'start', 'end'])),
  secret: z.string().optional(),
});

/**
 * Create webhook for a form
 * POST /api/webhooks
 */
webhookRoutes.post('/', async (req, res) => {
  try {
    const data = createWebhookSchema.parse(req.body);
    const { v4: uuidv4 } = require('uuid');

    const webhook = {
      id: uuidv4(),
      formId: data.formId,
      url: data.url,
      events: data.events,
      secret: data.secret || crypto.randomBytes(32).toString('hex'),
      enabled: true,
    };

    webhooks.set(webhook.id, webhook);

    res.status(201).json(webhook);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      console.error('Create webhook error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * List webhooks for a form
 * GET /api/webhooks?formId=xxx
 */
webhookRoutes.get('/', async (req, res) => {
  try {
    const formId = req.query.formId as string;
    const formWebhooks = Array.from(webhooks.values()).filter(w => !formId || w.formId === formId);
    res.json({ webhooks: formWebhooks });
  } catch (error) {
    console.error('List webhooks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get webhook by ID
 * GET /api/webhooks/:id
 */
webhookRoutes.get('/:id', async (req, res) => {
  try {
    const webhook = webhooks.get(req.params.id);
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    res.json(webhook);
  } catch (error) {
    console.error('Get webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update webhook
 * PATCH /api/webhooks/:id
 */
webhookRoutes.patch('/:id', async (req, res) => {
  try {
    const webhook = webhooks.get(req.params.id);
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    const updated = {
      ...webhook,
      ...req.body,
      id: webhook.id, // Prevent ID change
    };

    webhooks.set(req.params.id, updated);
    res.json(updated);
  } catch (error) {
    console.error('Update webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Delete webhook
 * DELETE /api/webhooks/:id
 */
webhookRoutes.delete('/:id', async (req, res) => {
  try {
    if (!webhooks.has(req.params.id)) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    webhooks.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Delete webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Test webhook
 * POST /api/webhooks/:id/test
 */
webhookRoutes.post('/:id/test', async (req, res) => {
  try {
    const webhook = webhooks.get(req.params.id);
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    const axios = require('axios');
    const testPayload = {
      event: 'test',
      formId: webhook.formId,
      webhookId: webhook.id,
      timestamp: new Date().toISOString(),
      test: true,
    };

    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(JSON.stringify(testPayload))
      .digest('hex');

    const result = await axios.post(webhook.url, testPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-REZ-Forms-Signature': signature,
        'X-REZ-Forms-Event': 'test',
      },
      timeout: 5000,
    });

    res.json({
      success: true,
      statusCode: result.status,
      response: result.data,
    });
  } catch (error: any) {
    res.status(200).json({
      success: false,
      error: error.message,
      statusCode: error.response?.status,
    });
  }
});

/**
 * Verify webhook signature
 * GET /api/webhooks/verify?signature=xxx&timestamp=xxx
 */
webhookRoutes.get('/verify', async (req, res) => {
  try {
    const { signature, timestamp, webhookId } = req.query;

    // Find webhook
    const webhook = webhookId ? webhooks.get(webhookId as string) : null;
    if (!webhook) {
      return res.status(404).json({ valid: false, error: 'Webhook not found' });
    }

    // Verify timestamp (within 5 minutes)
    const now = Date.now();
    const ts = parseInt(timestamp as string);
    if (isNaN(ts) || Math.abs(now - ts) > 5 * 60 * 1000) {
      return res.json({ valid: false, error: 'Timestamp expired' });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', webhook.secret)
      .update(timestamp as string)
      .digest('hex');

    const valid = signature === expectedSignature;

    res.json({
      valid,
      webhookId: webhook.id,
      formId: webhook.formId,
    });
  } catch (error) {
    console.error('Verify webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});