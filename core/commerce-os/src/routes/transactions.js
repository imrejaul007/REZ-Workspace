import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { transactionRegistry, TRANSACTION_TYPES } from '../index.js';

const router = express.Router();

/**
 * GET /api/transactions
 * List transactions
 */
router.get('/', async (req, res) => {
  try {
    const { type, status, industry, limit = 50 } = req.query;

    let transactions = Array.from(transactionRegistry.values());

    if (type) transactions = transactions.filter(t => t.type === type);
    if (status) transactions = transactions.filter(t => t.status === status);
    if (industry) transactions = transactions.filter(t => t.industry === industry);

    transactions = transactions.slice(0, parseInt(limit));

    res.json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/transactions
 * Create a transaction
 */
router.post('/', async (req, res) => {
  try {
    const {
      type = TRANSACTION_TYPES.SALE,
      amount,
      currency = 'USD',
      industry,
      from,
      to,
      metadata = {}
    } = req.body;

    if (!amount || !industry) {
      return res.status(400).json({
        success: false,
        error: 'Amount and industry are required'
      });
    }

    const txId = `tx_${uuidv4()}`;
    const transaction = {
      id: txId,
      type,
      amount,
      currency,
      industry,
      from,
      to,
      status: 'completed',
      metadata,
      createdAt: new Date().toISOString()
    };

    transactionRegistry.set(txId, transaction);

    res.status(201).json({
      success: true,
      transaction
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/transactions/:id
 * Get transaction details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = transactionRegistry.get(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      transaction
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
