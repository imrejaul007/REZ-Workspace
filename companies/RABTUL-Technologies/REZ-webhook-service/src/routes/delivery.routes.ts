/**
 * Delivery Routes
 */

import { Router, Request, Response } from 'express';
import { WebhookService } from '../services/WebhookService';

const router = Router();
const webhookService = new WebhookService();

/**
 * POST /api/deliveries/:deliveryId/retry
 * Retry delivery
 */
router.post('/:deliveryId/retry', async (req: Request, res: Response) => {
  try {
    const delivery = await webhookService.retryDelivery(req.params.deliveryId);

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found or max retries exceeded' });
    }

    res.json({ success: true, delivery });
  } catch (error) {
    console.error('Error retrying delivery:', error);
    res.status(500).json({ error: 'Failed to retry delivery' });
  }
});

/**
 * GET /api/deliveries/:deliveryId
 * Get delivery
 */
router.get('/:deliveryId', async (req: Request, res: Response) => {
  try {
    const { WebhookDelivery } = require('../models/WebhookDelivery');
    const delivery = await WebhookDelivery.findOne({ deliveryId: req.params.deliveryId });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    res.json({ delivery });
  } catch (error) {
    console.error('Error getting delivery:', error);
    res.status(500).json({ error: 'Failed to get delivery' });
  }
});

export { router as deliveryRoutes };
