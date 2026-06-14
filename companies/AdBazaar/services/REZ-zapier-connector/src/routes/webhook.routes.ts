import { Router, Request, Response } from 'express';
import { webhookService } from '../services/webhook.service';
import { authService } from '../services/auth.service';
import { ApiResponse, WebhookSubscription, WebhookEvent } from '../types';

const router = Router();

const getTenantId = (req: Request): string => {
  const tenantId = req.headers['x-tenant-id'] as string;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }
  return tenantId;
};

// Create webhook subscription
router.post('/webhooks', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { event, url, integrationId } = req.body;

    if (!event || !url) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'event and url are required',
      };
      return res.status(400).json(response);
    }

    const webhook = await webhookService.create(
      integrationId || 'manual',
      tenantId,
      event as WebhookEvent,
      url
    );

    const response: ApiResponse<WebhookSubscription> = {
      success: true,
      data: webhook,
      message: 'Webhook subscription created',
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create webhook',
    };
    res.status(400).json(response);
  }
});

// Get all webhooks for tenant
router.get('/webhooks', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const webhooks = await webhookService.findByTenant(tenantId);
    const response: ApiResponse<WebhookSubscription[]> = {
      success: true,
      data: webhooks,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch webhooks',
    };
    res.status(500).json(response);
  }
});

// Get webhook by ID
router.get('/webhooks/:id', async (req: Request, res: Response) => {
  try {
    const webhook = await webhookService.findById(req.params.id);
    if (!webhook) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Webhook not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<WebhookSubscription> = {
      success: true,
      data: webhook,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch webhook',
    };
    res.status(500).json(response);
  }
});

// Update webhook
router.put('/webhooks/:id', async (req: Request, res: Response) => {
  try {
    const webhook = await webhookService.update(req.params.id, req.body);
    if (!webhook) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Webhook not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<WebhookSubscription> = {
      success: true,
      data: webhook,
      message: 'Webhook updated',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update webhook',
    };
    res.status(400).json(response);
  }
});

// Delete webhook
router.delete('/webhooks/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await webhookService.delete(req.params.id);
    if (!deleted) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Webhook not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<null> = {
      success: true,
      message: 'Webhook deleted',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete webhook',
    };
    res.status(500).json(response);
  }
});

// Toggle webhook active status
router.patch('/webhooks/:id/toggle', async (req: Request, res: Response) => {
  try {
    const { isActive } = req.body;
    const webhook = await webhookService.toggleActive(req.params.id, isActive);
    if (!webhook) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Webhook not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<WebhookSubscription> = {
      success: true,
      data: webhook,
      message: `Webhook ${isActive ? 'activated' : 'deactivated'}`,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle webhook',
    };
    res.status(400).json(response);
  }
});

// Zapier REST Hook endpoints
router.post('/hooks/:id/resthook', async (req: Request, res: Response) => {
  try {
    const webhook = await webhookService.findById(req.params.id);
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    // Acknowledge the subscription
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register REST hook' });
  }
});

// Verify webhook signature
router.post('/webhooks/verify', async (req: Request, res: Response) => {
  try {
    const { payload, signature, secret } = req.body;
    const isValid = authService.verifyWebhookSignature(payload, signature, secret);
    res.json({ valid: isValid });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

export default router;
