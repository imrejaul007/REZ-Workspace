/**
 * REZ Unified Hub - Commerce Routes
 * Cross-company commerce operations
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { apiClient } from '../services/apiClient';
import { logger } from '../utils/logger';

const router = Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const CreateOrderSchema = z.object({
  user_id: z.string().min(1, 'user_id is required'),
  company: z.string().min(1, 'company is required'),
  items: z.array(z.object({
    product_id: z.string(),
    quantity: z.number().positive(),
    price: z.number().positive(),
    company: z.string(),
  })).min(1, 'At least one item is required'),
  payment_method: z.enum(['wallet', 'upi', 'card']).default('wallet'),
});

const RecommendationSchema = z.object({
  user_id: z.string().min(1, 'user_id is required'),
  context: z.object({
    location: z.object({ lat: z.number(), lng: z.number() }).optional(),
    time_of_day: z.string().optional(),
    weather: z.string().optional(),
    device: z.string().optional(),
  }).optional(),
});

// ============================================
// ROUTES
// ============================================

/**
 * POST /api/v1/commerce/order
 * Create order across companies with fraud check
 */
router.post('/order', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = CreateOrderSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: validation.error.errors,
      });
      return;
    }

    const { user_id, company, items, payment_method } = validation.data;

    // Calculate total
    const total_amount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Check fraud risk first
    const fraudCheck = await apiClient.checkFraud(user_id, 'purchase', total_amount);
    const fraudData = fraudCheck as { risk_level?: string } | null;

    if (fraudData?.risk_level === 'high') {
      logger.warn(`[Commerce] Order blocked for user ${user_id} due to fraud risk`);
      res.status(403).json({
        success: false,
        error: 'Transaction blocked due to fraud risk',
        code: 'FRAUD_BLOCKED',
      });
      return;
    }

    // Create order
    const order = await apiClient.call('ORDER', '/api/v1/orders', 'POST', {
      user_id,
      company,
      items,
      payment_method,
      total_amount,
    });

    // Track for attribution
    await apiClient.trackAttribution('purchase', user_id, total_amount, {
      order_id: (order as { id?: string })?.id,
      company,
    });

    // Collect signal for intelligence
    await apiClient.collectSignal('commerce', 'order_created', user_id, {
      order_id: (order as { id?: string })?.id,
      company,
      total: total_amount,
      item_count: items.length,
    });

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    logger.error('Error creating cross-company order:', error);
    next(error);
  }
});

/**
 * POST /api/v1/commerce/recommendations
 * Get personalized recommendations across all products
 */
router.post('/recommendations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = RecommendationSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: validation.error.errors,
      });
      return;
    }

    const { user_id, context } = validation.data;

    // Parallel fetch recommendations
    const [products, services, content] = await Promise.allSettled([
      apiClient.call('RECOMMEND', '/api/v1/products', 'POST', { user_id, context }),
      apiClient.call('RECOMMEND', '/api/v1/services', 'POST', { user_id, context }),
      apiClient.call('PERSONAL', '/api/v1/content', 'POST', { user_id, slot: 'recommendations', context }),
    ]);

    res.json({
      success: true,
      data: {
        products: (products.status === 'fulfilled' ? products.value as { items?: unknown[] } : null)?.items || [],
        services: (services.status === 'fulfilled' ? services.value as { items?: unknown[] } : null)?.items || [],
        content: (content.status === 'fulfilled' ? content.value as { items?: unknown[] } : null)?.items || [],
      },
    });
  } catch (error) {
    logger.error('Error fetching recommendations:', error);
    next(error);
  }
});

/**
 * GET /api/v1/commerce/search
 * Search across all products and services
 */
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, category, min_price, max_price, limit = '20' } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
      });
      return;
    }

    const filters: Record<string, unknown> = {};
    if (category) filters.category = category;
    if (min_price) filters.min_price = parseFloat(min_price as string);
    if (max_price) filters.max_price = parseFloat(max_price as string);

    const result = await apiClient.call('SEARCH', '/api/v1/search', 'POST', {
      query: q,
      filters,
      limit: parseInt(limit as string, 10),
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error searching:', error);
    next(error);
  }
});

/**
 * GET /api/v1/commerce/orders/:userId
 * Get order history for a user
 */
router.get('/orders/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { limit = '20', offset = '0' } = req.query;

    const result = await apiClient.call('ORDER', '/api/v1/orders', 'POST', {
      user_id: userId,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error fetching orders:', error);
    next(error);
  }
});

/**
 * POST /api/v1/commerce/cart
 * Create or update cart
 */
router.post('/cart', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      user_id: z.string().min(1),
      items: z.array(z.object({
        product_id: z.string(),
        quantity: z.number().positive(),
        price: z.number().positive(),
      })),
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: validation.error.errors,
      });
      return;
    }

    const { user_id, items } = validation.data;

    const result = await apiClient.call('ORDER', '/api/v1/cart', 'POST', {
      user_id,
      items,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error managing cart:', error);
    next(error);
  }
});

export default router;
