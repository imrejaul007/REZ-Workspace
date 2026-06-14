/**
 * Aggregation Routes
 * Internal routes for data collection
 */

import { Router, Request, Response } from 'express';
import { logger } from '../config/logger';

const router = Router();

/**
 * POST /internal/aggregate
 * Submit merchant metrics for aggregation
 */
router.post('/aggregate', async (req: Request, res: Response) => {
  try {
    const aggregationService = req.app.get('aggregationService');
    const { merchantId, ...metrics } = req.body;

    if (!merchantId) {
      res.status(400).json({ success: false, message: 'merchantId required' });
      return;
    }

    await aggregationService.upsertMerchantData({
      merchantId,
      ...metrics
    });

    res.json({ success: true, message: 'Data submitted for aggregation' });
  } catch (error) {
    logger.error('Aggregation error', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /internal/consent
 * Update data sharing consent
 */
router.post('/consent', async (req: Request, res: Response) => {
  try {
    const aggregationService = req.app.get('aggregationService');
    const { merchantId, consent } = req.body;

    if (!merchantId) {
      res.status(400).json({ success: false, message: 'merchantId required' });
      return;
    }

    if (consent === false) {
      await aggregationService.revokeConsent(merchantId);
      res.json({ success: true, message: 'Consent revoked' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid consent value' });
    }
  } catch (error) {
    logger.error('Consent error', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /internal/run-aggregation
 * Trigger full aggregation (admin only)
 */
router.post('/run-aggregation', async (req: Request, res: Response) => {
  try {
    const aggregationService = req.app.get('aggregationService');
    await aggregationService.runFullAggregation();

    res.json({ success: true, message: 'Aggregation completed' });
  } catch (error) {
    logger.error('Aggregation run error', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
