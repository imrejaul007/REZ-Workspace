import { Router, Response } from 'express';
import { z } from 'zod';
import { webhookService } from '../services/WebhookService';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

const createWebhookSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  secret: z.string().optional(),
  headers: z.record(z.string()).optional(),
  retryPolicy: z.object({
    maxRetries: z.number().min(0).max(10).optional(),
    retryDelay: z.number().min(1000).optional(),
    backoffMultiplier: z.number().min(1).optional(),
  }).optional(),
  filters: z.object({
    campaignTypes: z.array(z.string()).optional(),
    advertisers: z.array(z.string()).optional(),
    minBudget: z.number().optional(),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateWebhookSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url().optional(),
  events: z.array(z.string()).min(1).optional(),
  headers: z.record(z.string()).optional(),
  retryPolicy: z.object({
    maxRetries: z.number().min(0).max(10).optional(),
    retryDelay: z.number().min(1000).optional(),
    backoffMultiplier: z.number().min(1).optional(),
  }).optional(),
  filters: z.object({
    campaignTypes: z.array(z.string()).optional(),
    advertisers: z.array(z.string()).optional(),
    minBudget: z.number().optional(),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
  active: z.boolean().optional(),
});

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = createWebhookSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
      return;
    }

    const ownerId = req.userId || 'system';
    const webhook = await webhookService.createWebhook({
      ...parsed.data,
      ownerId,
    });

    res.status(201).json(webhook);
  } catch (error) {
    logger.error('Error creating webhook', { error });
    res.status(500).json({ error: 'Failed to create webhook' });
  }
});

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.userId || 'system';
    const webhooks = await webhookService.getWebhooksByOwner(ownerId);
    res.json(webhooks);
  } catch (error) {
    logger.error('Error fetching webhooks', { error });
    res.status(500).json({ error: 'Failed to fetch webhooks' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const webhook = await webhookService.getWebhook(req.params.id);
    if (!webhook) {
      res.status(404).json({ error: 'Webhook not found' });
      return;
    }
    res.json(webhook);
  } catch (error) {
    logger.error('Error fetching webhook', { error });
    res.status(500).json({ error: 'Failed to fetch webhook' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = updateWebhookSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
      return;
    }

    const webhook = await webhookService.updateWebhook(req.params.id, parsed.data);
    if (!webhook) {
      res.status(404).json({ error: 'Webhook not found' });
      return;
    }
    res.json(webhook);
  } catch (error) {
    logger.error('Error updating webhook', { error });
    res.status(500).json({ error: 'Failed to update webhook' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await webhookService.deleteWebhook(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Webhook not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting webhook', { error });
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

router.post('/:id/test', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const log = await webhookService.testWebhook(req.params.id);
    res.json({ message: 'Test webhook queued', logId: log._id });
  } catch (error) {
    logger.error('Error testing webhook', { error });
    res.status(500).json({ error: 'Failed to test webhook' });
  }
});

router.get('/:id/logs', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = '1', limit = '50', status } = req.query;
    const result = await webhookService.getWebhookLogs(req.params.id, {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      status: status as string,
    });

    res.json({
      logs: result.logs,
      pagination: {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        total: result.total,
        pages: Math.ceil(result.total / parseInt(limit as string, 10)),
      },
    });
  } catch (error) {
    logger.error('Error fetching webhook logs', { error });
    res.status(500).json({ error: 'Failed to fetch webhook logs' });
  }
});

router.post('/:id/toggle', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const webhook = await webhookService.getWebhook(req.params.id);
    if (!webhook) {
      res.status(404).json({ error: 'Webhook not found' });
      return;
    }

    const updated = await webhookService.toggleWebhook(req.params.id, !webhook.active);
    res.json(updated);
  } catch (error) {
    logger.error('Error toggling webhook', { error });
    res.status(500).json({ error: 'Failed to toggle webhook' });
  }
});

export default router;