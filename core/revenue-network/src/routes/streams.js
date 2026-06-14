import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { streamRegistry, REVENUE_TYPES, REVENUE_STATUS } from '../index.js';

const router = express.Router();

/**
 * GET /api/streams
 * List revenue streams
 */
router.get('/', async (req, res) => {
  try {
    const { type, status, industry } = req.query;

    let streams = Array.from(streamRegistry.values());

    if (type) streams = streams.filter(s => s.type === type);
    if (status) streams = streams.filter(s => s.status === status);
    if (industry) streams = streams.filter(s => s.industry === industry);

    res.json({
      success: true,
      count: streams.length,
      streams
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/streams
 * Create revenue stream
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      type = REVENUE_TYPES.SUBSCRIPTION,
      industry,
      amount,
      currency = 'USD',
      frequency = 'monthly'
    } = req.body;

    if (!name || !industry || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Name, industry, and amount are required'
      });
    }

    const streamId = `stream_${uuidv4()}`;
    const stream = {
      id: streamId,
      name,
      type,
      industry,
      amount,
      currency,
      frequency,
      status: REVENUE_STATUS.ACTIVE,
      totalRevenue: 0,
      subscriberCount: 0,
      createdAt: new Date().toISOString()
    };

    streamRegistry.set(streamId, stream);

    res.status(201).json({
      success: true,
      stream
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/streams/:id
 * Get stream details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const stream = streamRegistry.get(id);

    if (!stream) {
      return res.status(404).json({
        success: false,
        error: 'Stream not found'
      });
    }

    res.json({
      success: true,
      stream
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
