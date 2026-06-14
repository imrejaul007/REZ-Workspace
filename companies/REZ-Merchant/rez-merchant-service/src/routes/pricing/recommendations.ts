import { Router, Request, Response } from 'express';
import { merchantAuth } from '../../middleware/auth';
import { DynamicPricingAgent } from '../../services/dynamicPricingAgent';

const router = Router();
router.use(merchantAuth);

/**
 * GET /pricing/recommendations
 * Get dynamic pricing recommendations for products
 *
 * Query params:
 *   - horizon: 7 | 14 | 30 (default: 7)
 *   - storeId: optional specific store ID
 */
router.get('/recommendations', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const horizon = Math.min(Math.max(parseInt(req.query.horizon as string) || 7, 7), 30) as 7 | 14 | 30;
    const storeId = req.query.storeId as string | undefined;

    const recommendations = await DynamicPricingAgent.getRecommendations(
      merchantId,
      storeId,
      horizon
    );

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /pricing/recommendations/summary
 * Get quick pricing summary for dashboard
 *
 * Query params:
 *   - storeId: optional specific store ID
 */
router.get('/recommendations/summary', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const storeId = req.query.storeId as string | undefined;

    const recommendations = await DynamicPricingAgent.getRecommendations(
      merchantId,
      storeId,
      7
    );

    res.json({
      success: true,
      data: {
        generatedAt: recommendations.generatedAt,
        validUntil: recommendations.validUntil,
        context: recommendations.context,
        summary: recommendations.summary,
        topActions: recommendations.actions.slice(0, 3),
        priceChanges: {
          increases: recommendations.recommendations
            .filter(r => r.priceChange > 0)
            .sort((a, b) => b.priceChange - a.priceChange)
            .slice(0, 5),
          decreases: recommendations.recommendations
            .filter(r => r.priceChange < 0)
            .sort((a, b) => a.priceChange - b.priceChange)
            .slice(0, 5),
        },
      },
    });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /pricing/product/:productId
 * Get real-time pricing for a specific product
 *
 * Params:
 *   - productId: Product ID
 *
 * Query params:
 *   - storeId: optional specific store ID
 */
router.get('/product/:productId', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const productId = req.params.productId;
    const storeId = req.query.storeId as string | undefined;

    if (!productId) {
      res.status(400).json({
        success: false,
        message: 'Product ID is required',
      });
      return;
    }

    const pricing = await DynamicPricingAgent.getRealtimePrice(
      merchantId,
      productId,
      storeId
    );

    res.json({
      success: true,
      data: pricing,
    });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;

    if (err.message === 'Product not found') {
      res.status(404).json({ success: false, message: msg });
      return;
    }

    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /pricing/strategies
 * Get available pricing strategies
 */
router.get('/strategies', async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      strategies: [
        {
          name: 'premium',
          displayName: 'Premium Pricing',
          description: 'Higher prices during peak demand periods like weekends and dinner rush',
          useCase: 'Weekends, high demand days, peak hours',
          minMargin: 25,
          maxMargin: 50,
        },
        {
          name: 'competitive',
          displayName: 'Competitive Pricing',
          description: 'Price matching with market average for steady periods',
          useCase: 'Normal demand periods, weekdays',
          minMargin: 15,
          maxMargin: 30,
        },
        {
          name: 'penetration',
          displayName: 'Penetration Pricing',
          description: 'Lower prices to attract customers during low demand',
          useCase: 'Low demand periods, new product launches',
          minMargin: 10,
          maxMargin: 20,
        },
        {
          name: 'dynamic',
          displayName: 'Dynamic Pricing',
          description: 'Real-time price adjustments based on demand signals',
          useCase: 'Hourly optimization, special events',
          minMargin: 15,
          maxMargin: 40,
        },
        {
          name: 'bundle',
          displayName: 'Bundle Pricing',
          description: 'Discounted prices for product combinations',
          useCase: 'Slow periods, combo meals',
          minMargin: 10,
          maxMargin: 25,
        },
      ],
      factors: [
        { type: 'demand', weight: 0.35, description: 'Current and predicted demand levels' },
        { type: 'time', weight: 0.25, description: 'Time of day and day of week' },
        { type: 'seasonal', weight: 0.15, description: 'Seasonal trends and holidays' },
        { type: 'inventory', weight: 0.15, description: 'Stock levels and turnover rate' },
        { type: 'trend', weight: 0.10, description: 'Growth or decline trends' },
      ],
    },
  });
});

export default router;
