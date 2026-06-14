/**
 * Webhook Routes
 */

import { Router, Request, Response } from 'express';
import { WebhookService } from '../services/WebhookService';

const router = Router();
const webhookService = new WebhookService();

/**
 * POST /api/webhooks
 * Create webhook
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { merchantId, url, events, secret, active, description } = req.body;

    if (!merchantId || !url || !events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'merchantId, url, and events array are required' });
    }

    const webhook = await webhookService.createWebhook({
      merchantId,
      url,
      events,
      secret,
      active,
    });

    res.json({ success: true, webhook });
  } catch (error) {
    console.error('Error creating webhook:', error);
    res.status(500).json({ error: 'Failed to create webhook' });
  }
});

/**
 * GET /api/webhooks
 * List webhooks
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.query;

    if (!merchantId) {
      return res.status(400).json({ error: 'merchantId is required' });
    }

    const webhooks = await webhookService.listWebhooks(merchantId as string);
    res.json({ webhooks });
  } catch (error) {
    console.error('Error listing webhooks:', error);
    res.status(500).json({ error: 'Failed to list webhooks' });
  }
});

/**
 * GET /api/webhooks/:id
 * Get webhook
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { Webhook } = require('../models/Webhook');
    const webhook = await Webhook.findById(req.params.id);

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    res.json({ webhook });
  } catch (error) {
    console.error('Error getting webhook:', error);
    res.status(500).json({ error: 'Failed to get webhook' });
  }
});

/**
 * PUT /api/webhooks/:id
 * Update webhook
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { url, events, active, description } = req.body;

    const webhook = await webhookService.updateWebhook(req.params.id, {
      ...(url && { url }),
      ...(events && { events }),
      ...(typeof active === 'boolean' && { active }),
      ...(description && { description }),
    });

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    res.json({ success: true, webhook });
  } catch (error) {
    console.error('Error updating webhook:', error);
    res.status(500).json({ error: 'Failed to update webhook' });
  }
});

/**
 * DELETE /api/webhooks/:id
 * Delete webhook
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await webhookService.deleteWebhook(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

/**
 * POST /api/webhooks/:id/test
 * Test webhook
 */
router.post('/:id/test', async (req: Request, res: Response) => {
  try {
    const { Webhook } = require('../models/Webhook');
    const webhook = await Webhook.findById(req.params.id);

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    // Trigger test event
    const delivery = await webhookService.triggerWebhooks({
      merchantId: webhook.merchantId,
      eventType: 'webhook.test',
      data: { test: true, message: 'This is a test webhook' },
    });

    res.json({ success: true, deliveryIds: delivery });
  } catch (error) {
    console.error('Error testing webhook:', error);
    res.status(500).json({ error: 'Failed to test webhook' });
  }
});

/**
 * GET /api/webhooks/:id/deliveries
 * Get webhook deliveries
 */
router.get('/:id/deliveries', async (req: Request, res: Response) => {
  try {
    const { limit = '50', status } = req.query;
    const deliveries = await webhookService.getDeliveryHistory(req.params.id, {
      limit: parseInt(limit as string),
      status: status as string,
    });

    res.json({ deliveries });
  } catch (error) {
    console.error('Error getting deliveries:', error);
    res.status(500).json({ error: 'Failed to get deliveries' });
  }
});

export { router as webhookRoutes };
