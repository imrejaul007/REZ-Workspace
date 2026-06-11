/**
 * ShopFlow AI Brain Routes
 * Real AI-powered retail intelligence endpoints
 */

import { Router, Request, Response } from 'express';
import {
  recommendProducts,
  forecastInventory,
  suggestPricing,
  segmentCustomer,
  suggestUpsell,
  optimizeStoreLayout,
  getAIInsights,
} from '../services/aiBrain';

const router = Router();

// ============================================
// PRODUCT RECOMMENDATIONS
// POST /api/ai/recommend/products
// ============================================

router.post('/recommend/products', async (req: Request, res: Response) => {
  try {
    const { customerId, browsingHistory, preferences, currentCart } = req.body;

    const result = await recommendProducts({
      customerId,
      browsingHistory,
      preferences,
      currentCart,
    });

    res.json({
      success: true,
      data: result,
      meta: {
        personalized: result.personalized,
        productCount: result.products.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// INVENTORY FORECASTING
// POST /api/ai/inventory/forecast
// ============================================

router.post('/inventory/forecast', async (req: Request, res: Response) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, error: 'productId is required' });
    }

    const result = await forecastInventory(productId);

    res.json({
      success: true,
      data: result,
      meta: {
        forecastPeriod: '30 days',
        confidence: result.confidence,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// DYNAMIC PRICING SUGGESTIONS
// POST /api/ai/pricing/suggest
// ============================================

router.post('/pricing/suggest', async (req: Request, res: Response) => {
  try {
    const { productId, cost, competitorPrice, demand } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, error: 'productId is required' });
    }

    const result = await suggestPricing({
      productId,
      cost,
      competitorPrice,
      demand,
    });

    res.json({
      success: true,
      data: result,
      meta: {
        priceChange: `${result.priceChange > 0 ? '+' : ''}${result.priceChange}%`,
        confidence: result.confidence,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// CUSTOMER SEGMENTATION
// POST /api/ai/customer/segment
// ============================================

router.post('/customer/segment', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({ success: false, error: 'customerId is required' });
    }

    const result = await segmentCustomer(customerId);

    res.json({
      success: true,
      data: result,
      meta: {
        segment: result.segment,
        ltv: result.ltv,
        churnRisk: result.churnRisk,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// CROSS-SELL / UP-SELL SUGGESTIONS
// POST /api/ai/upsell/suggest
// ============================================

router.post('/upsell/suggest', async (req: Request, res: Response) => {
  try {
    const { cart, customerId } = req.body;

    if (!cart || cart.length === 0) {
      return res.status(400).json({ success: false, error: 'cart is required and must not be empty' });
    }

    const result = await suggestUpsell({ cart, customerId });

    res.json({
      success: true,
      data: result,
      meta: {
        triggerProduct: result.triggerProduct,
        suggestionCount: result.suggestedProducts.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// STORE LAYOUT OPTIMIZATION
// POST /api/ai/store/layout
// ============================================

router.post('/store/layout', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.body;

    const result = await optimizeStoreLayout(storeId);

    res.json({
      success: true,
      data: result,
      meta: {
        currentScore: result.overallScore,
        suggestionCount: result.suggestions.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// AI INSIGHTS (Claude-powered)
// POST /api/ai/insights
// ============================================

router.post('/insights', async (req: Request, res: Response) => {
  try {
    const { type, query } = req.body;

    const validTypes = ['inventory', 'pricing', 'customer', 'general'];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `type is required and must be one of: ${validTypes.join(', ')}`,
      });
    }

    const result = await getAIInsights({ type, query });

    res.json({
      success: true,
      data: result,
      meta: {
        type,
        confidence: result.confidence,
        recommendationCount: result.recommendations.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// BATCH OPERATIONS
// ============================================

router.post('/batch/forecast', async (req: Request, res: Response) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({ success: false, error: 'productIds array is required' });
    }

    const results = await Promise.all(
      productIds.map(async (productId: string) => {
        try {
          return await forecastInventory(productId);
        } catch (error: any) {
          return { productId, error: error.message };
        }
      })
    );

    res.json({
      success: true,
      data: results,
      meta: {
        total: productIds.length,
        successful: results.filter((r: any) => !r.error).length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/batch/pricing', async (req: Request, res: Response) => {
  try {
    const { products } = req.body;

    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ success: false, error: 'products array is required' });
    }

    const results = await Promise.all(
      products.map(async (product: any) => {
        try {
          return await suggestPricing(product);
        } catch (error: any) {
          return { productId: product.productId, error: error.message };
        }
      })
    );

    res.json({
      success: true,
      data: results,
      meta: {
        total: products.length,
        successful: results.filter((r: any) => !r.error).length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/batch/segment', async (req: Request, res: Response) => {
  try {
    const { customerIds } = req.body;

    if (!customerIds || !Array.isArray(customerIds)) {
      return res.status(400).json({ success: false, error: 'customerIds array is required' });
    }

    const results = await Promise.all(
      customerIds.map(async (customerId: string) => {
        try {
          return await segmentCustomer(customerId);
        } catch (error: any) {
          return { customerId, error: error.message };
        }
      })
    );

    res.json({
      success: true,
      data: results,
      meta: {
        total: customerIds.length,
        successful: results.filter((r: any) => !r.error).length,
        segmentBreakdown: results.reduce((acc: any, r: any) => {
          if (!r.error && r.segment) {
            acc[r.segment] = (acc[r.segment] || 0) + 1;
          }
          return acc;
        }, {}),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// AI BRAIN STATUS
// GET /api/ai/brain/status
// ============================================

router.get('/brain/status', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      active: true,
      capabilities: {
        productRecommendations: true,
        inventoryForecasting: true,
        dynamicPricing: true,
        customerSegmentation: true,
        crossSellUpsell: true,
        storeLayoutOptimization: true,
        aiInsights: true,
      },
      version: '1.0.0',
      model: 'Claude (Anthropic)',
      features: [
        'Personalized product recommendations based on customer preferences',
        '30-day inventory forecasting with trend analysis',
        'Competitor-aware dynamic pricing suggestions',
        'RFM-based customer segmentation',
        'AI-powered cross-sell and up-sell recommendations',
        'Store layout optimization based on sales data',
        'Claude-powered general insights and recommendations',
      ],
    },
  });
});

export default router;