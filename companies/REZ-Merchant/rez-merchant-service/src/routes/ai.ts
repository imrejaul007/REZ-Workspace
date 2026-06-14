/**
 * AI ROUTES
 * ML service integration endpoints
 */

import { Router, Request, Response } from 'express';
import { merchantAuth } from '../middleware/auth';
import { aiService } from '../services/aiService';
import { logger } from '../config/logger';

const router = Router();
router.use(merchantAuth);

/**
 * GET /api/ai/churn/:customerId
 * Get churn risk prediction for a customer
 */
router.get('/churn/:customerId', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const data = await aiService.getChurnRisk(customerId);
    res.json({ success: true, data });
  } catch (error: unknown) {
    logger.error('[AI Routes] GET /churn failed:', {
      customerId: req.params.customerId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get churn prediction',
    });
  }
});

/**
 * GET /api/ai/ltv/:customerId
 * Get lifetime value prediction for a customer
 */
router.get('/ltv/:customerId', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const data = await aiService.getCustomerLTV(customerId);
    res.json({ success: true, data });
  } catch (error: unknown) {
    logger.error('[AI Routes] GET /ltv failed:', {
      customerId: req.params.customerId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get LTV prediction',
    });
  }
});

/**
 * POST /api/ai/demand
 * Get demand forecast for products
 */
router.post('/demand', async (req: Request, res: Response) => {
  try {
    const { skuId, days } = req.body;
    if (!skuId) {
      return res.status(400).json({
        success: false,
        error: 'skuId is required',
      });
    }
    const data = await aiService.getDemandForecast(skuId, days || 7);
    res.json({ success: true, data });
  } catch (error: unknown) {
    logger.error('[AI Routes] POST /demand failed:', {
      skuId: req.body.skuId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get demand forecast',
    });
  }
});

/**
 * POST /api/ai/fraud
 * Get fraud risk assessment for an order
 */
router.post('/fraud', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'orderId is required',
      });
    }
    const data = await aiService.getFraudRisk(orderId);
    res.json({ success: true, data });
  } catch (error: unknown) {
    logger.error('[AI Routes] POST /fraud failed:', {
      orderId: req.body.orderId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get fraud risk',
    });
  }
});

/**
 * POST /api/ai/recommend
 * Get personalized recommendations for a customer
 */
router.post('/recommend', async (req: Request, res: Response) => {
  try {
    const { customerId, context } = req.body;
    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'customerId is required',
      });
    }
    const data = await aiService.getRecommendations(customerId, context || {});
    res.json({ success: true, data });
  } catch (error: unknown) {
    logger.error('[AI Routes] POST /recommend failed:', {
      customerId: req.body.customerId,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendations',
    });
  }
});

export default router;
