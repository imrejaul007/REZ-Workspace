import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { paymentService } from '../services/paymentService';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const createPaymentSchema = z.object({
  influencerId: z.string(),
  campaignId: z.string().optional(),
  contractId: z.string().optional(),
  brandId: z.string(),
  type: z.enum(['fixed', 'milestone', 'performance', 'retainer']).default('fixed'),
  currency: z.string().default('INR'),
  amount: z.number(),
  tax: z.object({
    rate: z.number().optional(),
    type: z.enum(['gst', 'tds', 'both']).optional()
  }).optional(),
  lineItems: z.array(z.object({
    description: z.string(),
    quantity: z.number().default(1),
    unitPrice: z.number(),
    amount: z.number(),
    deliverableId: z.string().optional(),
    milestone: z.string().optional()
  })),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional()
});

const processPaymentSchema = z.object({
  paymentMethod: z.enum(['bank_transfer', 'upi', 'paytm', 'razorpay', 'wallet']),
  paymentReference: z.string().optional()
});

// POST /api/payments - Create payment
router.post('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = createPaymentSchema.parse(req.body);
    const payment = await paymentService.createPayment({
      ...validatedData,
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
      totalAmount: validatedData.amount
    } as any);
    logger.info('Payment created via API', { userId: req.userId, paymentId: payment._id });
    res.status(201).json(payment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      next(error);
    }
  }
});

// GET /api/payments/pending - Get pending payments
router.get('/pending', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await paymentService.getPendingPayments(page, limit);
    res.json({
      payments: result.payments,
      total: result.total,
      page,
      limit
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/payments/:id - Get payment by ID
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    next(error);
  }
});

// POST /api/payments/:id/process - Process payment
router.post('/:id/process', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = processPaymentSchema.parse(req.body);
    const payment = await paymentService.processPayment(req.params.id, {
      ...validatedData,
      processedBy: (req as AuthRequest).userId
    });
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    logger.info('Payment processing', { paymentId: req.params.id });
    res.json(payment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      next(error);
    }
  }
});

// POST /api/payments/:id/approve - Approve payment
router.post('/:id/approve', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const payment = await paymentService.approvePayment(req.params.id, req.userId!);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    next(error);
  }
});

// POST /api/payments/:id/cancel - Cancel payment
router.post('/:id/cancel', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    const payment = await paymentService.cancelPayment(req.params.id, reason);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    next(error);
  }
});

// POST /api/payments/:id/refund - Refund payment
router.post('/:id/refund', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    const payment = await paymentService.refundPayment(req.params.id, reason);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    next(error);
  }
});

// GET /api/payments/:influencerId/history - Get influencer payment history
router.get('/:influencerId/history', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await paymentService.getInfluencerPaymentHistory(req.params.influencerId);
    res.json(history);
  } catch (error) {
    next(error);
  }
});

// POST /api/payments/:id/invoice - Create invoice for payment
router.post('/:id/invoice', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { billingAddress } = req.body;
    const invoice = await paymentService.createInvoice(req.params.id, billingAddress);
    res.status(201).json(invoice);
  } catch (error) {
    next(error);
  }
});

// POST /api/payments/calculate - Calculate payment amount
router.post('/calculate', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { influencerId, deliverables } = req.body;
    const calculation = await paymentService.calculatePayment(influencerId, deliverables);
    res.json(calculation);
  } catch (error) {
    next(error);
  }
});

// POST /api/payments/rates - Set influencer rate
router.post('/rates', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rate = await paymentService.setRate(req.body);
    res.status(201).json(rate);
  } catch (error) {
    next(error);
  }
});

// GET /api/payments/rates/:influencerId - Get influencer rates
router.get('/rates/:influencerId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rates = await paymentService.getInfluencerRates(req.params.influencerId);
    res.json(rates);
  } catch (error) {
    next(error);
  }
});

export { router as paymentRoutes };