import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { cartRecoveryService } from '../services/cart.service';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const createCartSchema = z.object({
  sessionId: z.string().optional(),
  channel: z.enum(['web', 'mobile', 'app', 'pos']).optional(),
  items: z.array(z.object({
    itemId: z.string().min(1),
    name: z.string().min(1),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0),
    imageUrl: z.string().optional(),
    metadata: z.record(z.unknown()).optional()
  })).min(1),
  currency: z.string().optional()
});

function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: 'Validation failed', details: result.error.issues });
      return;
    }
    req.body = result.data;
    next();
  };
}

// POST /api/carts - Create cart
router.post('/', authMiddleware, validateBody(createCartSchema), async (req: Request, res: Response) => {
  try {
    const input = { ...req.body, userId: req.user!.userId };
    const cart = await cartRecoveryService.createCart(input);
    res.status(201).json({ success: true, data: cart });
  } catch (error) {
    logger.error('Create cart error:', error);
    res.status(500).json({ success: false, error: 'Failed to create cart' });
  }
});

// GET /api/carts/:id - Get cart
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const cart = await cartRecoveryService.findById(req.params.id);
    if (!cart) {
      res.status(404).json({ success: false, error: 'Cart not found' });
      return;
    }
    res.json({ success: true, data: cart });
  } catch (error) {
    logger.error('Get cart error:', error);
    res.status(500).json({ success: false, error: 'Failed to get cart' });
  }
});

// GET /api/carts/abandoned - Get abandoned carts
router.get('/status/abandoned', authMiddleware, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await cartRecoveryService.getAbandonedCarts(page, limit);
    res.json({
      success: true,
      data: result.carts,
      pagination: { page, limit, total: result.total, pages: Math.ceil(result.total / limit) }
    });
  } catch (error) {
    logger.error('Get abandoned carts error:', error);
    res.status(500).json({ success: false, error: 'Failed to get abandoned carts' });
  }
});

// POST /api/carts/:id/recover - Initiate recovery
router.post('/:id/recover', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { channel } = req.body;
    if (!channel) {
      res.status(400).json({ success: false, error: 'Channel is required' });
      return;
    }

    const recovery = await cartRecoveryService.initiateRecovery(req.params.id, channel);
    res.status(201).json({ success: true, data: recovery });
  } catch (error) {
    logger.error('Initiate recovery error:', error);
    res.status(500).json({ success: false, error: 'Failed to initiate recovery' });
  }
});

// GET /api/carts/:id/analytics - Get cart analytics
router.get('/:id/analytics', authMiddleware, async (req: Request, res: Response) => {
  try {
    const analytics = await cartRecoveryService.getCartAnalytics(req.params.id);
    res.json({ success: true, data: analytics });
  } catch (error) {
    logger.error('Get analytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to get analytics' });
  }
});

// POST /api/carts/:id/mark-recovered - Mark cart as recovered
router.post('/:id/mark-recovered', authMiddleware, async (req: Request, res: Response) => {
  try {
    const cart = await cartRecoveryService.markRecovered(req.params.id);
    if (!cart) {
      res.status(404).json({ success: false, error: 'Cart not found or not abandoned' });
      return;
    }
    res.json({ success: true, data: cart });
  } catch (error) {
    logger.error('Mark recovered error:', error);
    res.status(500).json({ success: false, error: 'Failed to mark cart as recovered' });
  }
});

// POST /api/carts/:id/mark-converted - Mark cart as converted
router.post('/:id/mark-converted', authMiddleware, async (req: Request, res: Response) => {
  try {
    const cart = await cartRecoveryService.markConverted(req.params.id);
    if (!cart) {
      res.status(404).json({ success: false, error: 'Cart not found or already converted' });
      return;
    }
    res.json({ success: true, data: cart });
  } catch (error) {
    logger.error('Mark converted error:', error);
    res.status(500).json({ success: false, error: 'Failed to mark cart as converted' });
  }
});

// GET /api/carts/stats/recovery-rate - Get recovery rate
router.get('/stats/recovery-rate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const rate = await cartRecoveryService.calculateRecoveryRate();
    res.json({ success: true, data: { recoveryRate: rate } });
  } catch (error) {
    logger.error('Get recovery rate error:', error);
    res.status(500).json({ success: false, error: 'Failed to get recovery rate' });
  }
});

export default router;