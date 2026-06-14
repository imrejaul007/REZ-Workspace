import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { paymentService } from '../services/PaymentService';
import { PaymentStatus, PaymentMethod } from '../models/Payment';

const router = Router();

const processPaymentSchema = z.object({
  billId: z.string().min(1, 'Bill ID is required'),
  restaurantId: z.string().min(1, 'Restaurant ID is required'),
  customerId: z.string().optional(),
  amount: z.number().min(0, 'Amount cannot be negative'),
  tipAmount: z.number().min(0).optional(),
  paymentMethod: z.enum(Object.values(PaymentMethod)),
  splitPayments: z.array(
    z.object({
      method: z.enum(Object.values(PaymentMethod)),
      amount: z.number().min(0),
      reference: z.string().optional(),
      cardType: z.string().optional(),
      lastFourDigits: z.string().optional(),
      bankName: z.string().optional(),
      walletName: z.string().optional(),
    })
  ).optional(),
  cardDetails: z.object({
    cardType: z.enum(['DEBIT', 'CREDIT']),
    cardNetwork: z.string(),
    lastFourDigits: z.string().length(4),
    bankName: z.string().optional(),
  }).optional(),
  upiDetails: z.object({
    vpa: z.string(),
    provider: z.string(),
  }).optional(),
  walletDetails: z.object({
    walletName: z.string(),
    walletId: z.string().optional(),
  }).optional(),
  cashDetails: z.object({
    amountTendered: z.number().min(0),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const processRefundSchema = z.object({
  amount: z.number().min(0.01, 'Refund amount must be positive'),
  reason: z.string().min(1, 'Refund reason is required'),
});

const getPaymentsQuerySchema = z.object({
  status: z.enum(Object.values(PaymentStatus)).optional(),
  method: z.enum(Object.values(PaymentMethod)).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  skip: z.coerce.number().min(0).optional(),
});

const paymentSummaryQuerySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

async function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = processPaymentSchema.parse(req.body);

    let payment;
    if (validatedData.splitPayments && validatedData.splitPayments.length > 1) {
      payment = await paymentService.processSplitPayment({
        ...validatedData,
        createdBy: req.headers['x-user-id'] as string || 'system',
      });
    } else {
      payment = await paymentService.processPayment({
        ...validatedData,
        createdBy: req.headers['x-user-id'] as string || 'system',
      });
    }

    res.status(201).json({ success: true, data: payment });
  })
);

router.get(
  '/:paymentId',
  asyncHandler(async (req: Request, res: Response) => {
    const payment = await paymentService.getPayment(req.params.paymentId);
    if (!payment) {
      res.status(404).json({ success: false, error: 'Payment not found' });
      return;
    }
    res.json({ success: true, data: payment });
  })
);

router.get(
  '/bill/:billId',
  asyncHandler(async (req: Request, res: Response) => {
    const payments = await paymentService.getPaymentsByBill(req.params.billId);
    res.json({ success: true, data: payments });
  })
);

router.post(
  '/:paymentId/refund',
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = processRefundSchema.parse(req.body);
    const payment = await paymentService.processRefund({
      paymentId: req.params.paymentId,
      amount: validatedData.amount,
      reason: validatedData.reason,
      processedBy: req.headers['x-user-id'] as string || 'system',
    });
    res.json({ success: true, data: payment });
  })
);

router.post(
  '/upi/initiate',
  asyncHandler(async (req: Request, res: Response) => {
    const { method, amount, reference } = req.body;
    const result = await paymentService.initiateUpiPayment({
      method: method || PaymentMethod.UPI,
      amount,
      reference,
    });
    res.json({ success: true, data: result });
  })
);

router.post(
  '/upi/verify/:transactionId',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await paymentService.verifyUpiPayment(req.params.transactionId);
    res.json({ success: true, data: result });
  })
);

router.get(
  '/restaurant/:restaurantId/payments',
  asyncHandler(async (req: Request, res: Response) => {
    const query = getPaymentsQuerySchema.parse(req.query);
    const result = await paymentService.getPaymentsByRestaurant(req.params.restaurantId, {
      status: query.status,
      method: query.method,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      limit: query.limit,
      skip: query.skip,
    });
    res.json({ success: true, data: result });
  })
);

router.get(
  '/restaurant/:restaurantId/summary',
  asyncHandler(async (req: Request, res: Response) => {
    const query = paymentSummaryQuerySchema.parse(req.query);
    const summary = await paymentService.getPaymentSummary(
      req.params.restaurantId,
      new Date(query.startDate),
      new Date(query.endDate)
    );
    res.json({ success: true, data: summary });
  })
);

export default router;
