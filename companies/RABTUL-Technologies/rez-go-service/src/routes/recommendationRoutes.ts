/**
 * REZ Go AI Recommendations Routes
 *
 * Provides AI-powered recommendations based on:
 * - User's cart
 * - Purchase history
 * - Store context
 * - Real-time signals
 */

import { Router, Request, Response } from 'express';
import { intelligenceIntegration } from '../integrations/intelligenceIntegration.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/recommendations
 * Get AI recommendations for user
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || req.query.userId as string;
    const storeId = req.query.storeId as string;
    const cartItems = req.query.cartItems
      ? (req.query.cartItems as string).split(',')
      : [];
    const budget = req.query.budget ? parseInt(req.query.budget as string) : undefined;

    if (!userId || !storeId) {
      return res.status(400).json({ error: 'userId and storeId are required' });
    }

    const recommendations = await intelligenceIntegration.getRecommendations({
      userId,
      storeId,
      cartItems,
      budget,
    });

    res.json({
      success: true,
      recommendations,
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

/**
 * GET /api/recommendations/substitutes
 * Get product substitutes
 */
router.get('/substitutes', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || req.query.userId as string;
    const storeId = req.query.storeId as string;
    const productId = req.query.productId as string;

    if (!userId || !storeId || !productId) {
      return res.status(400).json({
        error: 'userId, storeId, and productId are required',
      });
    }

    // Get recommendations and filter for substitutes
    const allRecs = await intelligenceIntegration.getRecommendations({
      userId,
      storeId,
    });

    const substitutes = allRecs.filter((r) => r.type === 'substitute');

    res.json({
      success: true,
      substitutes,
    });
  } catch (error) {
    console.error('Substitutes error:', error);
    res.status(500).json({ error: 'Failed to get substitutes' });
  }
});

/**
 * GET /api/recommendations/combos
 * Get combo suggestions
 */
router.get('/combos', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || req.query.userId as string;
    const storeId = req.query.storeId as string;
    const cartItems = req.query.cartItems
      ? (req.query.cartItems as string).split(',')
      : [];

    if (!userId || !storeId) {
      return res.status(400).json({ error: 'userId and storeId are required' });
    }

    // Get all recommendations and filter for combos
    const allRecs = await intelligenceIntegration.getRecommendations({
      userId,
      storeId,
      cartItems,
    });

    const combos = allRecs.filter((r) => r.type === 'complement');

    res.json({
      success: true,
      combos,
    });
  } catch (error) {
    console.error('Combos error:', error);
    res.status(500).json({ error: 'Failed to get combos' });
  }
});

/**
 * GET /api/recommendations/price-insights
 * Get price intelligence
 */
router.get('/price-insights', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || req.query.userId as string;
    const storeId = req.query.storeId as string;
    const products = req.query.products
      ? (req.query.products as string).split(',')
      : [];

    if (!userId || !storeId) {
      return res.status(400).json({ error: 'userId and storeId are required' });
    }

    const insights = await intelligenceIntegration.getPriceInsights({
      userId,
      storeId,
      products,
    });

    res.json({
      success: true,
      insights,
    });
  } catch (error) {
    console.error('Price insights error:', error);
    res.status(500).json({ error: 'Failed to get price insights' });
  }
});

/**
 * GET /api/recommendations/spending-prediction
 * Get spending prediction
 */
router.get('/spending-prediction', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || req.query.userId as string;
    const storeId = req.query.storeId as string;
    const cartTotal = req.query.cartTotal
      ? parseInt(req.query.cartTotal as string)
      : 0;

    if (!userId || !storeId) {
      return res.status(400).json({ error: 'userId and storeId are required' });
    }

    const prediction = await intelligenceIntegration.getSpendingPrediction({
      userId,
      storeId,
      cartTotal,
    });

    res.json({
      success: true,
      prediction,
    });
  } catch (error) {
    console.error('Spending prediction error:', error);
    res.status(500).json({ error: 'Failed to get spending prediction' });
  }
});

/**
 * GET /api/recommendations/signals
 * Get behavioral signals
 */
router.get('/signals', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || req.query.userId as string;
    const storeId = req.query.storeId as string;
    const context = (req.query.context as 'scanning' | 'cart' | 'checkout') || 'scanning';

    if (!userId || !storeId) {
      return res.status(400).json({ error: 'userId and storeId are required' });
    }

    const signals = await intelligenceIntegration.getSignals({
      userId,
      storeId,
      context,
    });

    res.json({
      success: true,
      signals,
    });
  } catch (error) {
    console.error('Signals error:', error);
    res.status(500).json({ error: 'Failed to get signals' });
  }
});

/**
 * POST /api/recommendations/events
 * Emit shopping event to intelligence
 */
router.post('/events', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || req.body.userId;
    const { eventType, sessionId, storeId, data } = req.body;

    if (!userId || !eventType || !sessionId || !storeId) {
      return res.status(400).json({
        error: 'eventType, userId, sessionId, and storeId are required',
      });
    }

    await intelligenceIntegration.emitEvent({
      type: eventType,
      userId,
      storeId,
      sessionId,
      data: data || {},
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Event emit error:', error);
    res.status(500).json({ error: 'Failed to emit event' });
  }
});

export default router;
