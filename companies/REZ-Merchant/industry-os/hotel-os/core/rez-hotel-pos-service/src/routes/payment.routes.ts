import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { paymentService } from '../services/PaymentService';
import { POSPaymentMethod } from '../models/Transaction';
import { logger } from '../config/logger';

const router = Router();

/**
 * Validation schemas
 */
const ProcessPaymentSchema = z.object({
  transactionId: z.string().min(1),
  paymentMethod: z.nativeEnum(POSPaymentMethod),
  amount: z.number().positive(),
  currency: z.string().default('INR'),
  guestId: z.string().optional(),
  reference: z.string().optional(),
  staffId: z.string().optional(),
});

const ProcessRefundSchema = z.object({
  originalTransactionId: z.string().min(1),
  refundAmount: z.number().positive(),
  reason: z.string().min(1),
  staffId: z.string().optional(),
});

const CreateChargeSchema = z.object({
  propertyId: z.string().min(1),
  outletType: z.string().min(1),
  outletId: z.string().min(1),
  items: z.array(
    z.object({
      itemId: z.string().min(1),
      itemName: z.string().min(1),
      category: z.string().min(1),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
      taxRate: z.number().default(18),
      taxAmount: z.number().optional(),
      discountRate: z.number().default(0),
      discountAmount: z.number().optional(),
      modifiers: z.array(z.string()).optional(),
      notes: z.string().optional(),
    })
  ).min(1),
  guestId: z.string().optional(),
  guestName: z.string().optional(),
  roomNumber: z.string().optional(),
  tableNumber: z.string().optional(),
  staffId: z.string().optional(),
  staffName: z.string().optional(),
  guestCount: z.number().int().positive().optional(),
  folioId: z.string().optional(),
  notes: z.string().optional(),
  orderId: z.string().optional(),
  splitGroupId: z.string().optional(),
});

/**
 * Process payment for a transaction
 * POST /api/payment/process
 */
router.post('/process', async (req: Request, res: Response) => {
  const data = ProcessPaymentSchema.parse(req.body);

  const result = await paymentService.processPayment(data);

  if (result.success) {
    logger.info('Payment processed via API', {
      transactionId: data.transactionId,
      paymentId: result.paymentId,
      amount: data.amount,
    });

    res.json({
      success: true,
      data: {
        paymentId: result.paymentId,
        transaction: result.transaction,
      },
    });
  } else {
    res.status(400).json({
      success: false,
      error: result.error,
    });
  }
});

/**
 * Process refund
 * POST /api/payment/refund
 */
router.post('/refund', async (req: Request, res: Response) => {
  const data = ProcessRefundSchema.parse(req.body);

  const result = await paymentService.processRefund(data);

  if (result.success) {
    logger.info('Refund processed via API', {
      originalTransactionId: data.originalTransactionId,
      refundId: result.refundId,
      amount: data.refundAmount,
    });

    res.json({
      success: true,
      data: {
        refundId: result.refundId,
      },
    });
  } else {
    res.status(400).json({
      success: false,
      error: result.error,
    });
  }
});

/**
 * Create a charge transaction
 * POST /api/payment/charge
 */
router.post('/charge', async (req: Request, res: Response) => {
  const data = CreateChargeSchema.parse(req.body);

  const transaction = await paymentService.createCharge(data as unknown);

  logger.info('Charge transaction created via API', {
    transactionId: transaction.transactionId,
    outletType: data.outletType,
    amount: transaction.totalAmount,
  });

  res.status(201).json({
    success: true,
    data: transaction,
  });
});

/**
 * Get transaction by ID
 * GET /api/payment/transaction/:transactionId
 */
router.get('/transaction/:transactionId', async (req: Request, res: Response) => {
  const { transactionId } = req.params;
  const transaction = await paymentService.getTransaction(transactionId);

  if (!transaction) {
    res.status(404).json({
      success: false,
      message: 'Transaction not found',
    });
    return;
  }

  res.json({
    success: true,
    data: transaction,
  });
});

/**
 * Get transactions by folio
 * GET /api/payment/folio/:folioId
 */
router.get('/folio/:folioId', async (req: Request, res: Response) => {
  const { folioId } = req.params;
  const transactions = await paymentService.getTransactionsByFolio(folioId);

  res.json({
    success: true,
    data: transactions,
    count: transactions.length,
  });
});

/**
 * Get transactions by guest
 * GET /api/payment/guest/:guestId
 */
router.get('/guest/:guestId', async (req: Request, res: Response) => {
  const { guestId } = req.params;
  const { propertyId } = req.query;

  const transactions = await paymentService.getTransactionsByGuest(
    guestId,
    propertyId as string | undefined
  );

  res.json({
    success: true,
    data: transactions,
    count: transactions.length,
  });
});

/**
 * Get payment methods available
 * GET /api/payment/methods
 */
router.get('/methods', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: Object.values(POSPaymentMethod).map((method) => ({
      code: method,
      name: method.replace(/_/g, ' '),
    })),
  });
});

export default router;
