import { Router, Request, Response } from 'express';
import { createWebhook, getWebhook, updateWebhook, deleteWebhook, listWebhooks, deliverWebhook, getDeliveries } from '../services/webhook.service';
import logger from '../utils/logger';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  try {
    const { name, url, events, secret, retryConfig } = req.body;
    if (!name || !url || !events) return res.status(400).json({ success: false, error: 'name, url, events required' });
    const webhook = createWebhook(name, url, events, { secret, retryConfig });
    res.status(201).json({ success: true, data: webhook });
  } catch (error) {
    logger.error('Error creating webhook:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, data: listWebhooks(), count: listWebhooks().length });
});

router.get('/:id', (req: Request, res: Response) => {
  const w = getWebhook(req.params.id);
  return w ? res.json({ success: true, data: w }) : res.status(404).json({ success: false, error: 'Not found' });
});

router.patch('/:id', (req: Request, res: Response) => {
  const w = updateWebhook(req.params.id, req.body);
  return w ? res.json({ success: true, data: w }) : res.status(404).json({ success: false, error: 'Not found' });
});

router.delete('/:id', (req: Request, res: Response) => {
  deleteWebhook(req.params.id);
  res.json({ success: true });
});

router.post('/:id/deliver', (req: Request, res: Response) => {
  deliverWebhook(req.params.id, req.body.eventType || 'manual', req.body.data || {}).then(d => res.json({ success: true, data: d }));
});

router.get('/:id/deliveries', (req: Request, res: Response) => {
  res.json({ success: true, data: getDeliveries(req.params.id) });
});

export default router;
