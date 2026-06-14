import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { couponService, CreateCouponInput, UpdateCouponInput } from '../services/coupon.service';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const createCouponSchema = z.object({
  code: z.string().min(3).max(20).regex(/^[A-Za-z0-9_-]+$/),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  type: z.enum(['percentage', 'fixed', 'buy_x_get_y', 'free_shipping']),
  value: z.number().min(0),
  minOrderValue: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  currency: z.string().optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().optional(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  applicableCategories: z.array(z.string()).optional(),
  excludedCategories: z.array(z.string()).optional(),
  applicableProducts: z.array(z.string()).optional(),
  excludedProducts: z.array(z.string()).optional(),
  targetSegments: z.array(z.string()).optional(),
  channel: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional()
});

const updateCouponSchema = createCouponSchema.partial().omit({ code: true });

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

// POST /api/coupons - Create coupon
router.post('/', authMiddleware, validateBody(createCouponSchema), async (req: Request, res: Response) => {
  try {
    const coupon = await couponService.create(req.body as CreateCouponInput, req.user!.userId);
    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    logger.error('Create coupon error:', error);
    res.status(500).json({ success: false, error: 'Failed to create coupon' });
  }
});

// GET /api/coupons - List coupons
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as string,
      type: req.query.type as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20
    };

    const result = await couponService.list(filters);
    res.json({
      success: true,
      data: result.coupons,
      pagination: { page: filters.page, limit: filters.limit, total: result.total, pages: Math.ceil(result.total / filters.limit) }
    });
  } catch (error) {
    logger.error('List coupons error:', error);
    res.status(500).json({ success: false, error: 'Failed to list coupons' });
  }
});

// GET /api/coupons/:id - Get coupon
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const coupon = await couponService.findById(req.params.id);
    if (!coupon) {
      res.status(404).json({ success: false, error: 'Coupon not found' });
      return;
    }
    res.json({ success: true, data: coupon });
  } catch (error) {
    logger.error('Get coupon error:', error);
    res.status(500).json({ success: false, error: 'Failed to get coupon' });
  }
});

// PUT /api/coupons/:id - Update coupon
router.put('/:id', authMiddleware, validateBody(updateCouponSchema), async (req: Request, res: Response) => {
  try {
    const coupon = await couponService.update(req.params.id, req.body as UpdateCouponInput);
    if (!coupon) {
      res.status(404).json({ success: false, error: 'Coupon not found' });
      return;
    }
    res.json({ success: true, data: coupon });
  } catch (error) {
    logger.error('Update coupon error:', error);
    res.status(500).json({ success: false, error: 'Failed to update coupon' });
  }
});

// POST /api/coupons/:id/validate - Validate coupon
router.post('/:id/validate', async (req: Request, res: Response) => {
  try {
    const { userId, orderValue } = req.body;
    if (!userId || orderValue === undefined) {
      res.status(400).json({ success: false, error: 'userId and orderValue are required' });
      return;
    }

    const coupon = await couponService.findById(req.params.id);
    if (!coupon) {
      res.status(404).json({ success: false, error: 'Coupon not found' });
      return;
    }

    const result = await couponService.validate(coupon.code, userId, orderValue);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Validate coupon error:', error);
    res.status(500).json({ success: false, error: 'Failed to validate coupon' });
  }
});

// POST /api/coupons/validate - Validate coupon by code
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { code, userId, orderValue } = req.body;
    if (!code || !userId || orderValue === undefined) {
      res.status(400).json({ success: false, error: 'code, userId, and orderValue are required' });
      return;
    }

    const result = await couponService.validate(code, userId, orderValue);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Validate coupon error:', error);
    res.status(500).json({ success: false, error: 'Failed to validate coupon' });
  }
});

// POST /api/coupons/:id/redeem - Redeem coupon
router.post('/:id/redeem', async (req: Request, res: Response) => {
  try {
    const { userId, orderId, orderValue } = req.body;
    if (!userId || !orderId || orderValue === undefined) {
      res.status(400).json({ success: false, error: 'userId, orderId, and orderValue are required' });
      return;
    }

    const coupon = await couponService.findById(req.params.id);
    if (!coupon) {
      res.status(404).json({ success: false, error: 'Coupon not found' });
      return;
    }

    const result = await couponService.redeem(coupon.code, userId, orderId, orderValue);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Redeem coupon error:', error);
    res.status(500).json({ success: false, error: 'Failed to redeem coupon' });
  }
});

// DELETE /api/coupons/:id - Delete coupon
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const deleted = await couponService.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Coupon not found' });
      return;
    }
    res.json({ success: true, data: { expired: true } });
  } catch (error) {
    logger.error('Delete coupon error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete coupon' });
  }
});

export default router;