import { Router, Request, Response } from 'express';
import { ChannelManager, AggregatorOrder } from '../services/aggregators/channelManager';
import { logger } from '../services/utils/logger';

const router = Router();
const channelManager = new ChannelManager();

// Register aggregator
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { aggregatorId, adapterType, config } = req.body;
    if (!aggregatorId || !adapterType) {
      return res.status(400).json({ error: 'aggregatorId and adapterType required' });
    }

    // Import adapter based on type
    const { SwiggyAdapter, ZomatoAdapter } = await import('../services/aggregators/channelManager');

    let adapter;
    switch (adapterType) {
      case 'swiggy':
        adapter = new SwiggyAdapter(aggregatorId, config.apiKey, config.storeId);
        break;
      case 'zomato':
        adapter = new ZomatoAdapter(aggregatorId, config.apiKey, config.storeId);
        break;
      default:
        return res.status(400).json({ error: 'Unknown adapter type' });
    }

    channelManager.registerAggregator(aggregatorId, adapter);
    res.json({ success: true, message: `Aggregator ${aggregatorId} registered` });
  } catch (error) {
    logger.error('Register aggregator failed', { error });
    res.status(500).json({ error: 'Failed to register aggregator' });
  }
});

// Get new orders from all aggregators
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const orders = await channelManager.fetchAllNewOrders();
    res.json({ success: true, data: orders });
  } catch (error) {
    logger.error('Fetch orders failed', { error });
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Update order status on aggregator
router.post('/:id/status', async (req: Request, res: Response) => {
  try {
    const { orderId, status } = req.body;
    if (!orderId || !status) {
      return res.status(400).json({ error: 'orderId and status required' });
    }
    await channelManager.updateOrderStatus(req.params.id, orderId, status);
    res.json({ success: true, message: 'Status updated' });
  } catch (error) {
    logger.error('Update status failed', { error });
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Push menu to all aggregators
router.post('/menu', async (req: Request, res: Response) => {
  try {
    const menu = req.body;
    await channelManager.pushMenuToAll(menu);
    res.json({ success: true, message: 'Menu pushed to all aggregators' });
  } catch (error) {
    logger.error('Push menu failed', { error });
    res.status(500).json({ error: 'Failed to push menu' });
  }
});

// Webhook handler
router.post('/webhook/:aggregator', async (req: Request, res: Response) => {
  try {
    const event = req.body;
    logger.info(`Webhook from ${req.params.aggregator}`, { event });

    await channelManager.webhookHandler({
      type: event.type,
      channel: req.params.aggregator,
      data: event.data,
      timestamp: new Date()
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Webhook handler failed', { error });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Get channel status
router.get('/status/:channelId', async (req: Request, res: Response) => {
  try {
    const status = await channelManager.getChannelStatus(req.params.channelId);
    res.json({ success: true, data: status });
  } catch (error) {
    logger.error('Get channel status failed', { error });
    res.status(500).json({ error: 'Failed to get status' });
  }
});

export default router;
