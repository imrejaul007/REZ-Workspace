import express from 'express';
import { streamRegistry } from '../index.js';

const router = express.Router();

/**
 * GET /api/analytics
 * Get revenue analytics
 */
router.get('/', async (req, res) => {
  try {
    const streams = Array.from(streamRegistry.values());

    const analytics = {
      totalStreams: streams.length,
      totalRevenue: streams.reduce((sum, s) => sum + (s.totalRevenue || 0), 0),
      byType: {},
      byIndustry: {}
    };

    for (const stream of streams) {
      // By type
      if (!analytics.byType[stream.type]) {
        analytics.byType[stream.type] = { count: 0, revenue: 0 };
      }
      analytics.byType[stream.type].count++;
      analytics.byType[stream.type].revenue += stream.totalRevenue || 0;

      // By industry
      if (!analytics.byIndustry[stream.industry]) {
        analytics.byIndustry[stream.industry] = { count: 0, revenue: 0 };
      }
      analytics.byIndustry[stream.industry].count++;
      analytics.byIndustry[stream.industry].revenue += stream.totalRevenue || 0;
    }

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
