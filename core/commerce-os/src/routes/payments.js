import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

/**
 * POST /api/payments
 * Process a payment
 */
router.post('/', async (req, res) => {
  try {
    const {
      orderId,
      amount,
      currency = 'USD',
      method = 'card',
      industry
    } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Order ID and amount are required'
      });
    }

    const paymentId = `pay_${uuidv4()}`;
    const payment = {
      id: paymentId,
      orderId,
      amount,
      currency,
      method,
      industry,
      status: 'completed',
      processedAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      payment
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/payments/:id
 * Get payment details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    res.json({
      success: true,
      payment: {
        id,
        status: 'completed',
        amount: 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
