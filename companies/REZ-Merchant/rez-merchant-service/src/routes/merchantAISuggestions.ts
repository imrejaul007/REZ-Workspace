/**
 * MERCHANT AI SUGGESTIONS ROUTE
 * Shows all AI-powered suggestions for merchant
 */

import { Router, Request, Response } from 'express';
import { merchantAuth } from '../middleware/auth';
import { getMerchantAISuggestions } from '../utils/pricingIntegration';
import { getCustomerIntelligenceSummary } from '../utils/leadIntelligenceIntegration';
import { getMessagingAnalytics } from '../utils/messagingIntegration';
import { getMerchantScreens, getCampaignAnalytics } from '../utils/doohIntegration';
import { logger } from '../config/logger';

const router = Router();
router.use(merchantAuth);

/**
 * GET /api/merchant/ai/suggestions
 * Get all AI suggestions for merchant dashboard
 */
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchant?.id;
    if (!merchantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get all suggestions in parallel
    const [
      pricingSuggestions,
      customerIntelligence,
      messagingStats,
      doohScreens,
    ] = await Promise.all([
      getMerchantAISuggestions(merchantId),
      getCustomerIntelligenceSummary(merchantId),
      getMessagingAnalytics(merchantId),
      getMerchantScreens(merchantId),
    ]);

    // Combine all suggestions
    const suggestions = {
      pricing: {
        recommendations: pricingSuggestions.priceRecommendations.slice(0, 5),
        inventoryAlerts: pricingSuggestions.inventoryAlerts,
        offerSuggestions: pricingSuggestions.offerSuggestions,
      },
      customers: customerIntelligence,
      messaging: messagingStats,
      dooh: {
        screenCount: doohScreens.length,
        screens: doohScreens.map((s) => ({
          id: s.id,
          type: s.type,
          location: s.location,
          status: s.status,
        })),
      },
      summary: {
        urgentActions: [
          ...pricingSuggestions.inventoryAlerts.filter((a) => a.alertType === 'low_stock'),
          ...pricingSuggestions.offerSuggestions.filter((o) => o.discount >= 30),
        ],
        recommendations: [
          ...pricingSuggestions.priceRecommendations.slice(0, 3),
        ],
      },
    };

    res.json({ success: true, data: suggestions });

  } catch (error: unknown) {
    logger.error('[MerchantAI] Get suggestions failed:', error);
    res.status(500).json({ error: 'Failed to get AI suggestions' });
  }
});

/**
 * GET /api/merchant/ai/pricing
 * Get pricing recommendations only
 */
router.get('/pricing', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchant?.id;
    if (!merchantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const suggestions = await getMerchantAISuggestions(merchantId);

    res.json({
      success: true,
      data: {
        recommendations: suggestions.priceRecommendations,
        inventoryAlerts: suggestions.inventoryAlerts,
        offerSuggestions: suggestions.offerSuggestions,
      },
    });

  } catch (error: unknown) {
    logger.error('[MerchantAI] Get pricing failed:', error);
    res.status(500).json({ error: 'Failed to get pricing suggestions' });
  }
});

/**
 * GET /api/merchant/ai/customers
 * Get customer intelligence
 */
router.get('/customers', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchant?.id;
    if (!merchantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const intelligence = await getCustomerIntelligenceSummary(merchantId);

    res.json({ success: true, data: intelligence });

  } catch (error: unknown) {
    logger.error('[MerchantAI] Get customers failed:', error);
    res.status(500).json({ error: 'Failed to get customer intelligence' });
  }
});

/**
 * GET /api/merchant/ai/messaging
 * Get messaging stats
 */
router.get('/messaging', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchant?.id;
    if (!merchantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const stats = await getMessagingAnalytics(merchantId);

    res.json({ success: true, data: stats });

  } catch (error: unknown) {
    logger.error('[MerchantAI] Get messaging failed:', error);
    res.status(500).json({ error: 'Failed to get messaging stats' });
  }
});

/**
 * GET /api/merchant/ai/dooh
 * Get DOOH stats
 */
router.get('/dooh', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchant?.id;
    if (!merchantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const screens = await getMerchantScreens(merchantId);

    res.json({
      success: true,
      data: {
        screens,
        total: screens.length,
        active: screens.filter((s) => s.status === 'active').length,
      },
    });

  } catch (error: unknown) {
    logger.error('[MerchantAI] Get DOOH failed:', error);
    res.status(500).json({ error: 'Failed to get DOOH stats' });
  }
});

export default router;
