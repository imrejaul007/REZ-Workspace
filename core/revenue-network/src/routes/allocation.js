import express from 'express';
import { streamRegistry } from '../index.js';

const router = express.Router();

/**
 * GET /api/allocation
 * Get allocation overview
 */
router.get('/', async (req, res) => {
  try {
    const { industry } = req.query;

    let streams = Array.from(streamRegistry.values());
    if (industry) streams = streams.filter(s => s.industry === industry);

    const allocation = {
      byIndustry: {},
      byType: {},
      total: 0
    };

    for (const stream of streams) {
      // By industry
      if (!allocation.byIndustry[stream.industry]) {
        allocation.byIndustry[stream.industry] = 0;
      }
      allocation.byIndustry[stream.industry] += stream.amount;

      // By type
      if (!allocation.byType[stream.type]) {
        allocation.byType[stream.type] = 0;
      }
      allocation.byType[stream.type] += stream.amount;

      allocation.total += stream.amount;
    }

    res.json({
      success: true,
      allocation
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
