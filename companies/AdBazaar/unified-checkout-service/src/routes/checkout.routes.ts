import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { checkoutService, CreateCheckoutInput, UpdateCheckoutInput } from '../services/checkout.service';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const createCheckoutSchema = z.object({
  sessionId: z.string().optional(),
  items: z.array(z.object({
    itemId: z.string().min(1),
    name: z.string().min(1),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0),
    sku: z.string().optional(),
    imageUrl: z.string().optional(),
    metadata: z.record(z.unknown()).optional()
  })).min(1),
  currency: z.string().optional(),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

const updateCheckoutSchema = z.object({
  items: z.array(z.object({
    itemId: z.string().min(1),
    name: z.string().min(1),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0),
    sku: z.string().optional(),
    imageUrl: z.string().optional(),
    metadata: z.record(z.unknown()).optional()
  })).optional(),
  shippingAddress: z.object({
    name: z.string().min(1),
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(1),
    phone: z.string().optional()
  }).optional(),
  billingAddress: z.object({
    name: z.string().min(1),
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(1),
    phone: z.string().optional()
  }).optional(),
  couponCode: z.string().optional(),
  notes: z.string().optional()
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

// POST /api/checkout - Create checkout
router.post('/', authMiddleware, validateBody(createCheckoutSchema), async (req: Request, res: Response) => {
  try {
    const input: CreateCheckoutInput = { ...req.body, userId: req.user!.userId };
    const checkout = await checkoutService.create(input);
    res.status(201).json({ success: true, data: checkout });
  } catch (error) {
    logger.error('Create checkout error:', error);
    res.status(500).json({ success: false, error: 'Failed to create checkout' });
  }
});

// GET /api/checkout/:id - Get checkout
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const checkout = await checkoutService.findById(req.params.id);
    if (!checkout) {
      res.status(404).json({ success: false, error: 'Checkout not found' });
      return;
    }
    res.json({ success: true, data: checkout });
  } catch (error) {
    logger.error('Get checkout error:', error);
    res.status(500).json({ success: false, error: 'Failed to get checkout' });
  }
});

// PUT /api/checkout/:id - Update checkout
router.put('/:id', authMiddleware, validateBody(updateCheckoutSchema), async (req: Request, res: Response) => {
  try {
    const checkout = await checkoutService.update(req.params.id, req.body as UpdateCheckoutInput);
    if (!checkout) {
      res.status(404).json({ success: false, error: 'Checkout not found' });
      return;
    }
    res.json({ success: true, data: checkout });
  } catch (error) {
    logger.error('Update checkout error:', error);
    res.status(500).json({ success: false, error: 'Failed to update checkout' });
  }
});

// POST /api/checkout/:id/payment - Initiate payment
router.post('/:id/payment', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { method } = req.body;
    if (!method) {
      res.status(400).json({ success: false, error: 'Payment method is required' });
      return;
    }

    const result = await checkoutService.initiatePayment(req.params.id, method);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Initiate payment error:', error);
    res.status(500).json({ success: false, error: 'Failed to initiate payment' });
  }
});

// POST /api/checkout/:id/complete - Complete checkout
router.post('/:id/complete', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.body;
    const checkout = await checkoutService.completeCheckout(req.params.id, transactionId);
    if (!checkout) {
      res.status(404).json({ success: false, error: 'Checkout not found or payment not initiated' });
      return;
    }
    res.json({ success: true, data: checkout });
  } catch (error) {
    logger.error('Complete checkout error:', error);
    res.status(500).json({ success: false, error: 'Failed to complete checkout' });
  }
});

// GET /api/checkout/:id/status - Get checkout status
router.get('/:id/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const status = await checkoutService.getStatus(req.params.id);
    if (!status) {
      res.status(404).json({ success: false, error: 'Checkout not found' });
      return;
    }
    res.json({ success: true, data: status });
  } catch (error) {
    logger.error('Get status error:', error);
    res.status(500).json({ success: false, error: 'Failed to get checkout status' });
  }
});

// POST /api/checkout/:id/cancel - Cancel checkout
router.post('/:id/cancel', authMiddleware, async (req: Request, res: Response) => {
  try {
    const checkout = await checkoutService.cancelCheckout(req.params.id);
    if (!checkout) {
      res.status(404).json({ success: false, error: 'Checkout not found or already completed' });
      return;
    }
    res.json({ success: true, data: checkout });
  } catch (error) {
    logger.error('Cancel checkout error:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel checkout' });
  }
});

// GET /api/checkout - List user checkouts
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await checkoutService.listUserCheckouts(req.user!.userId, page, limit);
    res.json({
      success: true,
      data: result.checkouts,
      pagination: { page, limit, total: result.total, pages: Math.ceil(result.total / limit) }
    });
  } catch (error) {
    logger.error('List checkouts error:', error);
    res.status(500).json({ success: false, error: 'Failed to list checkouts' });
  }
});

export default router;