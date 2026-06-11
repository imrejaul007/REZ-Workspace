/**
 * ShopFlow AI Routes - Real AI Intelligence Endpoints
 * Product recommendations, inventory forecasting, dynamic pricing, customer segmentation
 */

import { Router, Request, Response } from 'express';
import {
  recommendProducts,
  forecastInventory,
  suggestPricing,
  segmentCustomer,
  suggestUpsell,
  optimizeStoreLayout,
  getAIInsights
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
      browsingHistory: browsingHistory || [],
      preferences: preferences || {},
      currentCart: currentCart || []
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Product recommendation error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate recommendations'
    });
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
      return res.status(400).json({
        success: false,
        error: 'productId is required'
      });
    }

    const result = await forecastInventory(productId);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Inventory forecast error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to forecast inventory'
    });
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
      return res.status(400).json({
        success: false,
        error: 'productId is required'
      });
    }

    const result = await suggestPricing({
      productId,
      cost,
      competitorPrice,
      demand: demand || 'medium'
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Pricing suggestion error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to suggest pricing'
    });
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
      return res.status(400).json({
        success: false,
        error: 'customerId is required'
      });
    }

    const result = await segmentCustomer(customerId);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Customer segmentation error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to segment customer'
    });
  }
});

// ============================================
// CROSS-SELL / UP-SELL SUGGESTIONS
// POST /api/ai/cross-sell
// ============================================

router.post('/cross-sell', async (req: Request, res: Response) => {
  try {
    const { productIds, customerId } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'productIds array is required'
      });
    }

    const cart = productIds.map((productId: string) => ({
      productId,
      quantity: 1
    }));

    const result = await suggestUpsell({ cart, customerId });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Cross-sell suggestion error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to suggest cross-sell products'
    });
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
      data: result
    });
  } catch (error: any) {
    console.error('Store layout optimization error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to optimize store layout'
    });
  }
});

// ============================================
// AI INSIGHTS
// POST /api/ai/insights
// ============================================

router.post('/insights', async (req: Request, res: Response) => {
  try {
    const { type, query } = req.body;

    const result = await getAIInsights({
      type: type || 'general',
      query
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('AI insights error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate AI insights'
    });
  }
});

// ============================================
// BATCH INVENTORY FORECAST
// POST /api/ai/inventory/forecast-batch
// ============================================

router.post('/inventory/forecast-batch', async (req: Request, res: Response) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'productIds array is required'
      });
    }

    const forecasts = await Promise.all(
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
      data: { forecasts }
    });
  } catch (error: any) {
    console.error('Batch forecast error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to batch forecast'
    });
  }
});

// ============================================
// AI STATUS
// GET /api/ai/status
// ============================================

router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'active',
    capabilities: {
      productRecommendations: true,
      inventoryForecasting: true,
      dynamicPricing: true,
      customerSegmentation: true,
      crossSellUpSell: true,
      storeLayoutOptimization: true,
      aiInsights: true
    },
    model: 'claude-sonnet-4-20250514',
    timestamp: new Date().toISOString()
  });
});

export default router;