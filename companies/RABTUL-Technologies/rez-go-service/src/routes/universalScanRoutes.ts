/**
 * REZ Go Universal Scan & Timeline Routes
 */

import { Router, Request, Response } from 'express';
import {
  universalScan,
  detectFake,
  comparePrices,
  searchProducts,
} from '../services/universalScanService.js';
import {
  getProductTimeline,
  generateShoppingList,
  trackPurchase,
} from '../services/productTimelineService.js';
import {
  searchReceipts,
  getPurchaseHistory,
  getReorderSuggestions,
  getSpendingInsights,
  processNaturalQuery,
} from '../services/smartReceiptService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/universal/scan
 * Scan any barcode - works anywhere
 */
router.post('/scan', async (req: Request, res: Response) => {
  try {
    const { barcode } = req.body;

    if (!barcode) {
      return res.status(400).json({ error: 'barcode is required' });
    }

    const result = await universalScan(barcode);

    if (!result) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true, result });
  } catch (error) {
    console.error('Universal scan error:', error);
    res.status(500).json({ error: 'Scan failed' });
  }
});

/**
 * POST /api/universal/fake-check
 * Check if product is authentic
 */
router.post('/fake-check', async (req: Request, res: Response) => {
  try {
    const { barcode } = req.body;

    if (!barcode) {
      return res.status(400).json({ error: 'barcode is required' });
    }

    const result = await detectFake(barcode);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Fake check error:', error);
    res.status(500).json({ error: 'Fake check failed' });
  }
});

/**
 * GET /api/universal/compare/:barcode
 * Compare prices across stores
 */
router.get('/compare/:barcode', async (req: Request, res: Response) => {
  try {
    const { barcode } = req.params;

    const results = await comparePrices(barcode);
    res.json({ success: true, results });
  } catch (error) {
    console.error('Compare error:', error);
    res.status(500).json({ error: 'Compare failed' });
  }
});

/**
 * GET /api/universal/search
 * Search products
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, category, minPrice, maxPrice, limit } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'q (search query) is required' });
    }

    const results = await searchProducts(q as string, {
      category: category as string,
      minPrice: minPrice ? parseInt(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice as string) : undefined,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.json({ success: true, results });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

/**
 * GET /api/timeline/:barcode
 * Get product timeline (price history, etc.)
 */
router.get('/timeline/:barcode', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { barcode } = req.params;
    const userId = (req as any).user?.sub;

    const timeline = await getProductTimeline(barcode, userId);

    if (!timeline) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true, timeline });
  } catch (error) {
    console.error('Timeline error:', error);
    res.status(500).json({ error: 'Failed to get timeline' });
  }
});

/**
 * GET /api/shopping-list
 * Generate AI shopping list
 */
router.get('/shopping-list', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub;
    const { type = 'monthly' } = req.query;

    const list = await generateShoppingList(userId, type as 'monthly' | 'weekly' | 'custom');
    res.json({ success: true, list });
  } catch (error) {
    console.error('Shopping list error:', error);
    res.status(500).json({ error: 'Failed to generate list' });
  }
});

/**
 * GET /api/receipts/search
 * Search receipts
 */
router.get('/receipts/search', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub;
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'q is required' });
    }

    const results = await searchReceipts(userId, q as string);
    res.json({ success: true, results });
  } catch (error) {
    console.error('Receipt search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

/**
 * GET /api/receipts/history
 * Get purchase history
 */
router.get('/receipts/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub;
    const { limit, startDate, endDate, storeId } = req.query;

    const results = await getPurchaseHistory(userId, {
      limit: limit ? parseInt(limit as string) : 50,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      storeId: storeId as string,
    });

    res.json({ success: true, results });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

/**
 * GET /api/receipts/reorder
 * Get reorder suggestions
 */
router.get('/receipts/reorder', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub;

    const suggestions = await getReorderSuggestions(userId);
    res.json({ success: true, suggestions });
  } catch (error) {
    console.error('Reorder error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

/**
 * GET /api/receipts/insights
 * Get spending insights
 */
router.get('/receipts/insights', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub;

    const insights = await getSpendingInsights(userId);
    res.json({ success: true, insights });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ error: 'Failed to get insights' });
  }
});

/**
 * POST /api/receipts/query
 * Natural language query
 */
router.post('/receipts/query', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub;
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    const result = await processNaturalQuery(userId, query);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: 'Query failed' });
  }
});

export default router;
