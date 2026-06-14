import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { orderRegistry, listingRegistry } from '../index.js';

const router = express.Router();

/**
 * GET /api/orders
 * List orders
 */
router.get('/', async (req, res) => {
  try {
    const { status, industry } = req.query;

    let orders = Array.from(orderRegistry.values());

    if (status) orders = orders.filter(o => o.status === status);
    if (industry) orders = orders.filter(o => o.industry === industry);

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/orders
 * Create order
 */
router.post('/', async (req, res) => {
  try {
    const { listingId, buyerId, quantity = 1, metadata = {} } = req.body;

    if (!listingId || !buyerId) {
      return res.status(400).json({
        success: false,
        error: 'Listing ID and buyer ID are required'
      });
    }

    const listing = listingRegistry.get(listingId);
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }

    const orderId = `order_${uuidv4()}`;
    const order = {
      id: orderId,
      listingId,
      buyerId,
      sellerId: listing.providerId,
      industry: listing.industry,
      quantity,
      total: listing.price * quantity,
      currency: listing.currency,
      status: 'pending',
      metadata,
      createdAt: new Date().toISOString()
    };

    orderRegistry.set(orderId, order);

    res.status(201).json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/orders/:id
 * Get order details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const order = orderRegistry.get(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/orders/:id/status
 * Update order status
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = orderRegistry.get(id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    order.status = status;
    order.updatedAt = new Date().toISOString();
    orderRegistry.set(id, order);

    res.json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
