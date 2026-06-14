import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { orderRegistry, ORDER_STATUS } from '../index.js';

const router = express.Router();

/**
 * GET /api/orders
 * List orders
 */
router.get('/', async (req, res) => {
  try {
    const { status, industry, limit = 50 } = req.query;

    let orders = Array.from(orderRegistry.values());

    if (status) orders = orders.filter(o => o.status === status);
    if (industry) orders = orders.filter(o => o.industry === industry);

    orders = orders.slice(0, parseInt(limit));

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
 * Create an order
 */
router.post('/', async (req, res) => {
  try {
    const {
      items = [],
      industry,
      customer,
      total,
      currency = 'USD'
    } = req.body;

    if (!items.length || !industry) {
      return res.status(400).json({
        success: false,
        error: 'Items and industry are required'
      });
    }

    const orderId = `order_${uuidv4()}`;
    const order = {
      id: orderId,
      items,
      industry,
      customer,
      total: total || items.reduce((sum, i) => sum + (i.price * i.quantity), 0),
      currency,
      status: ORDER_STATUS.PENDING,
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
