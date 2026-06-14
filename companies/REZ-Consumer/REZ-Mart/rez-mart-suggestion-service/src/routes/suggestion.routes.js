/**
 * Suggestion Routes
 * FreshMart 11AM Story: Smart Cart Suggestions
 */

const express = require('express');
const router = express.Router();
const suggestionService = require('../services/suggestion.service');

/**
 * GET /api/suggestions/product/:sku
 * Get suggestions for a single product
 * Example: /api/suggestions/product/cereal-001
 */
router.get('/product/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    const { limit = 5 } = req.query;

    const suggestions = await suggestionService.getProductSuggestions(sku, parseInt(limit));

    res.json({
      success: true,
      productSku: sku,
      suggestions
    });
  } catch (error) {
    console.error('Error getting product suggestions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/suggestions/cart
 * Get suggestions for entire cart
 * Body: { items: [{ sku, name, quantity, price, category }] }
 */
router.post('/cart', async (req, res) => {
  try {
    const { items, userId } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cart items required'
      });
    }

    const suggestions = await suggestionService.getCartSuggestions(items, {
      limit: 10,
      includePersonalized: !!userId,
      userId
    });

    res.json({
      success: true,
      ...suggestions
    });
  } catch (error) {
    console.error('Error getting cart suggestions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/suggestions/cart/personalized
 * Get personalized suggestions based on user history
 * Body: { userId, items: [...] }
 */
router.post('/cart/personalized', async (req, res) => {
  try {
    const { userId, items, limit = 5 } = req.body;

    if (!userId || !items) {
      return res.status(400).json({
        success: false,
        error: 'userId and items required'
      });
    }

    const suggestions = await suggestionService.getPersonalizedSuggestions(userId, items, parseInt(limit));

    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Error getting personalized suggestions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/suggestions/purchase
 * Record purchase and update relationships
 * Body: { cartId, userId, storeId, items: [...], context: {} }
 */
router.post('/purchase', async (req, res) => {
  try {
    const { cartId, userId, storeId, items, context } = req.body;

    if (!cartId || !storeId || !items) {
      return res.status(400).json({
        success: false,
        error: 'cartId, storeId, and items required'
      });
    }

    const analysis = await suggestionService.recordPurchase(
      cartId,
      userId,
      storeId,
      items,
      context
    );

    res.json({
      success: true,
      message: 'Purchase recorded, relationships updated',
      analysisId: analysis._id
    });
  } catch (error) {
    console.error('Error recording purchase:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/suggestions/accept
 * Record that user accepted a suggestion
 * Body: { cartId, sku }
 */
router.post('/accept', async (req, res) => {
  try {
    const { cartId, sku } = req.body;

    // Update CartAnalysis record
    await require('../models/cartAnalysis.model').findOneAndUpdate(
      { cartId, 'suggestions.sku': sku },
      { $set: { 'suggestions.$.accepted': true } }
    );

    res.json({
      success: true,
      message: `Suggestion ${sku} accepted`
    });
  } catch (error) {
    console.error('Error accepting suggestion:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/suggestions/analytics/:storeId
 * Get suggestion performance analytics
 * Query: ?startDate=2026-01-01&endDate=2026-06-13
 */
router.get('/analytics/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const analytics = await suggestionService.getSuggestionAnalytics(storeId, start, end);

    res.json({
      success: true,
      storeId,
      period: { start: start.toISOString(), end: end.toISOString() },
      analytics
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/suggestions/popular
 * Get popular product pairs (for initial data seeding)
 */
router.get('/popular', async (req, res) => {
  try {
    const { category = 'grocery', limit = 20 } = req.query;

    const PopularPairs = require('../models/relationship.model');
    const pairs = await PopularPairs.find({ category, active: true })
      .sort({ confidence: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      category,
      pairs: pairs.map(p => ({
        from: p.productSku,
        to: p.relatedSku,
        confidence: Math.round(p.confidence * 100)
      }))
    });
  } catch (error) {
    console.error('Error getting popular pairs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
