import { Router, Request, Response } from 'express';
import { DeliveryAggregatorService } from '../services/delivery/DeliveryAggregatorService';
import { logger } from '../services/utils/logger';

const router = Router();
const deliveryService = new DeliveryAggregatorService();

// Get delivery quotes
router.post('/quotes', async (req: Request, res: Response) => {
  try {
    const { pickup, dropoff, weight, dimensions } = req.body;
    if (!pickup || !dropoff) {
      return res.status(400).json({ error: 'pickup and dropoff required' });
    }
    const quotes = await deliveryService.getQuotes({
      pickup,
      dropoff,
      weight,
      dimensions
    });
    res.json({ success: true, data: quotes });
  } catch (error) {
    logger.error('Get quotes failed', { error });
    res.status(500).json({ error: 'Failed to get quotes' });
  }
});

// Book delivery
router.post('/book', async (req: Request, res: Response) => {
  try {
    const { partner, pickup, dropoff, items, customerPhone } = req.body;
    if (!partner || !pickup || !dropoff || !items) {
      return res.status(400).json({ error: 'partner, pickup, dropoff, and items required' });
    }
    const booking = await deliveryService.bookDelivery({
      partner,
      pickup,
      dropoff,
      items,
      customerPhone
    });
    res.json({ success: true, data: booking });
  } catch (error) {
    logger.error('Book delivery failed', { error });
    res.status(500).json({ error: 'Failed to book delivery' });
  }
});

// Track delivery
router.get('/:id/track', async (req: Request, res: Response) => {
  try {
    const tracking = await deliveryService.trackDelivery(req.params.id);
    res.json({ success: true, data: tracking });
  } catch (error) {
    logger.error('Track delivery failed', { error });
    res.status(500).json({ error: 'Failed to track delivery' });
  }
});

// Cancel delivery
router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const result = await deliveryService.cancelDelivery(req.params.id, reason);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Cancel delivery failed', { error });
    res.status(500).json({ error: 'Failed to cancel delivery' });
  }
});

// Webhook from delivery partner
router.post('/webhook/:partner', async (req: Request, res: Response) => {
  try {
    const event = req.body;
    logger.info(`Webhook from ${req.params.partner}`, { event });

    // Process webhook based on partner
    await deliveryService.handleWebhook(req.params.partner, event);

    res.json({ success: true });
  } catch (error) {
    logger.error('Webhook handler failed', { error });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
