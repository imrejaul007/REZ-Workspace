import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import axios from 'axios';

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Initialize router
export const paymentsRouter = Router();

// Configuration
const RABTUL_WALLET_URL = process.env.RABTUL_WALLET_URL || 'http://localhost:4002';
const PLATFORM_FEE_PERCENT = 10; // 10% platform fee

// Types
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum PaymentMethod {
  REZ_WALLET = 'rez_wallet',
  CARD = 'card',
  UPI = 'upi',
  NET_BANKING = 'net_banking'
}

interface PriceBreakdown {
  basePrice: number;
  serviceCharge: number;
  tax: number;
  discount: number;
  platformFee: number;
  total: number;
}

interface Refund {
  id: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'processed' | 'rejected';
  createdAt: string;
  processedAt?: string;
}

interface Dispute {
  id: string;
  bookingId: string;
  userId: string;
  providerId: string;
  reason: string;
  evidence: string[];
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

interface Settlement {
  id: string;
  providerId: string;
  period: {
    start: string;
    end: string;
  };
  totalEarnings: number;
  platformFee: number;
  netPayable: number;
  status: 'pending' | 'processing' | 'completed';
  scheduledDate: string;
  processedAt?: string;
  createdAt: string;
}

interface Payment {
  id: string;
  bookingId: string;
  userId: string;
  providerId: string;
  amount: PriceBreakdown;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  providerPayout: number;
  platformRevenue: number;
  refunds: Refund[];
  createdAt: string;
  updatedAt: string;
}

interface Wallet {
  providerId: string;
  balance: number;
  pendingBalance: number;
  totalEarnings: number;
  totalPayouts: number;
  transactions: Transaction[];
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  referenceType?: 'payment' | 'payout' | 'refund' | 'adjustment';
  referenceId?: string;
  createdAt: string;
}

// In-memory storage
const payments: Map<string, Payment> = new Map();
const disputes: Map<string, Dispute> = new Map();
const settlements: Map<string, Settlement> = new Map();
const wallets: Map<string, Wallet> = new Map();

// Zod Schemas
const initiatePaymentSchema = z.object({
  bookingId: z.string().uuid(),
  userId: z.string().uuid(),
  providerId: z.string().uuid(),
  amount: z.object({
    basePrice: z.number().positive(),
    serviceCharge: z.number().min(0),
    tax: z.number().min(0),
    discount: z.number().min(0).default(0)
  }),
  paymentMethod: z.nativeEnum(PaymentMethod)
});

const refundSchema = z.object({
  reason: z.string().min(10).max(500),
  amount: z.number().positive().optional() // If not provided, full refund
});

const disputeSchema = z.object({
  bookingId: z.string().uuid(),
  providerId: z.string().uuid(),
  reason: z.string().min(10).max(1000),
  evidence: z.array(z.string()).max(5).optional()
});

// Helper functions
const calculatePrice = (amount: {
  basePrice: number;
  serviceCharge: number;
  tax: number;
  discount: number;
}): PriceBreakdown => {
  const subtotal = amount.basePrice + amount.serviceCharge + amount.tax - amount.discount;
  const platformFee = Math.round(subtotal * PLATFORM_FEE_PERCENT / 100);
  const total = subtotal + platformFee;

  return {
    ...amount,
    platformFee,
    total
  };
};

const getOrCreateWallet = (providerId: string): Wallet => {
  let wallet = wallets.get(providerId);
  if (!wallet) {
    wallet = {
      providerId,
      balance: 0,
      pendingBalance: 0,
      totalEarnings: 0,
      totalPayouts: 0,
      transactions: []
    };
    wallets.set(providerId, wallet);
  }
  return wallet;
};

// RABTUL Wallet Integration
const creditToRABTULWallet = async (userId: string, amount: number, paymentId: string): Promise<boolean> => {
  try {
    // In production, this would call RABTUL wallet service
    // const response = await axios.post(`${RABTUL_WALLET_URL}/api/v1/wallet/credit`, {
    //   userId,
    //   amount,
    //   reference: `rez-home:${paymentId}`
    // });
    logger.info({
      message: 'Crediting to RABTUL wallet',
      userId,
      amount,
      paymentId
    });
    return true;
  } catch (error: any) {
    logger.error({
      message: 'Failed to credit RABTUL wallet',
      userId,
      error: error.message
    });
    return false;
  }
};

const debitFromRABTULWallet = async (userId: string, amount: number, paymentId: string): Promise<boolean> => {
  try {
    // In production, this would call RABTUL wallet service
    // const response = await axios.post(`${RABTUL_WALLET_URL}/api/v1/wallet/debit`, {
    //   userId,
    //   amount,
    //   reference: `rez-home:${paymentId}`
    // });
    logger.info({
      message: 'Debiting from RABTUL wallet',
      userId,
      amount,
      paymentId
    });
    return true;
  } catch (error: any) {
    logger.error({
      message: 'Failed to debit RABTUL wallet',
      userId,
      error: error.message
    });
    return false;
  }
};

// POST /payments/initiate - Initiate a payment
paymentsRouter.post('/initiate', async (req: Request, res: Response) => {
  try {
    const validationResult = initiatePaymentSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
      return;
    }

    const data = validationResult.data;

    // Check if payment already exists for this booking
    const existingPayment = Array.from(payments.values())
      .find(p => p.bookingId === data.bookingId && p.status !== PaymentStatus.FAILED);

    if (existingPayment) {
      res.status(409).json({
        error: 'Payment already exists for this booking',
        paymentId: existingPayment.id
      });
      return;
    }

    const priceBreakdown = calculatePrice(data.amount);

    const payment: Payment = {
      id: uuidv4(),
      bookingId: data.bookingId,
      userId: data.userId,
      providerId: data.providerId,
      amount: priceBreakdown,
      paymentMethod: data.paymentMethod,
      status: PaymentStatus.PENDING,
      providerPayout: priceBreakdown.total - priceBreakdown.platformFee,
      platformRevenue: priceBreakdown.platformFee,
      refunds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Process payment based on method
    let success = false;

    switch (data.paymentMethod) {
      case PaymentMethod.REZ_WALLET:
        success = await debitFromRABTULWallet(data.userId, priceBreakdown.total, payment.id);
        break;
      case PaymentMethod.UPI:
      case PaymentMethod.CARD:
      case PaymentMethod.NET_BANKING:
        // Mock payment gateway processing
        success = true;
        payment.status = PaymentStatus.PROCESSING;
        payment.transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        break;
    }

    if (success) {
      payment.status = PaymentStatus.COMPLETED;

      // Credit provider wallet
      const providerWallet = getOrCreateWallet(data.providerId);
      providerWallet.pendingBalance += payment.providerPayout;
      providerWallet.totalEarnings += payment.providerPayout;
      providerWallet.transactions.unshift({
        id: uuidv4(),
        type: 'credit',
        amount: payment.providerPayout,
        description: `Payment for booking ${data.bookingId}`,
        referenceType: 'payment',
        referenceId: payment.id,
        createdAt: new Date().toISOString()
      });
      wallets.set(data.providerId, providerWallet);

      logger.info({
        message: 'Payment completed',
        paymentId: payment.id,
        amount: priceBreakdown.total
      });
    } else {
      payment.status = PaymentStatus.FAILED;
      logger.warn({
        message: 'Payment failed',
        paymentId: payment.id
      });
    }

    payments.set(payment.id, payment);

    res.status(success ? 201 : 500).json({
      success,
      data: payment
    });
  } catch (error: any) {
    logger.error({ message: 'Error initiating payment', error: error.message });
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
});

// GET /payments/:id - Get payment status
paymentsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const paymentId = req.params.id;

    const payment = payments.get(paymentId);

    if (!payment) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }

    // Check ownership (user or provider)
    if (payment.userId !== userId && payment.providerId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error: any) {
    logger.error({ message: 'Error fetching payment', error: error.message });
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// POST /payments/:id/refund - Request refund
paymentsRouter.post('/:id/refund', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const paymentId = req.params.id;

    const payment = payments.get(paymentId);

    if (!payment) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }

    // Check ownership
    if (payment.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Only completed payments can be refunded
    if (payment.status !== PaymentStatus.COMPLETED) {
      res.status(400).json({
        error: 'Payment cannot be refunded',
        status: payment.status
      });
      return;
    }

    const validationResult = refundSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
      return;
    }

    const refundAmount = validationResult.data.amount || payment.amount.total;
    const reason = validationResult.data.reason;

    // Check if full refund amount is valid
    const existingRefundAmount = payment.refunds.reduce((sum, r) => sum + r.amount, 0);
    if (refundAmount > payment.amount.total - existingRefundAmount) {
      res.status(400).json({
        error: 'Refund amount exceeds available amount'
      });
      return;
    }

    const refund: Refund = {
      id: uuidv4(),
      amount: refundAmount,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    payment.refunds.push(refund);
    payment.updatedAt = new Date().toISOString();
    payments.set(paymentId, payment);

    logger.info({
      message: 'Refund requested',
      paymentId,
      refundId: refund.id,
      amount: refundAmount
    });

    res.status(201).json({
      success: true,
      data: refund
    });
  } catch (error: any) {
    logger.error({ message: 'Error processing refund', error: error.message });
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// GET /payments/settlement - Get provider settlement
paymentsRouter.get('/settlement', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const providerId = req.query.providerId as string || userId;
    const period = req.query.period as 'week' | 'month' | 'all' || 'week';

    // Get provider payments
    const providerPayments = Array.from(payments.values())
      .filter(p => p.providerId === providerId && p.status === PaymentStatus.COMPLETED);

    if (providerPayments.length === 0) {
      res.status(404).json({ error: 'No payments found for provider' });
      return;
    }

    // Calculate period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(0);
    }

    const periodPayments = providerPayments.filter(p => {
      const paymentDate = new Date(p.createdAt);
      return paymentDate >= startDate;
    });

    const totalEarnings = periodPayments.reduce((sum, p) => sum + p.providerPayout, 0);
    const platformFee = periodPayments.reduce((sum, p) => sum + p.platformRevenue, 0);
    const netPayable = totalEarnings;

    // Check if settlement already exists
    const existingSettlement = Array.from(settlements.values())
      .find(s => s.providerId === providerId && s.status !== 'completed');

    if (existingSettlement) {
      res.json({
        success: true,
        data: existingSettlement
      });
      return;
    }

    // Create new settlement
    const settlement: Settlement = {
      id: uuidv4(),
      providerId,
      period: {
        start: startDate.toISOString(),
        end: now.toISOString()
      },
      totalEarnings,
      platformFee,
      netPayable,
      status: 'pending',
      scheduledDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      createdAt: new Date().toISOString()
    };

    settlements.set(settlement.id, settlement);

    logger.info({
      message: 'Settlement created',
      settlementId: settlement.id,
      providerId,
      amount: netPayable
    });

    res.json({
      success: true,
      data: settlement
    });
  } catch (error: any) {
    logger.error({ message: 'Error fetching settlement', error: error.message });
    res.status(500).json({ error: 'Failed to fetch settlement' });
  }
});

// POST /payments/dispute - Raise a dispute
paymentsRouter.post('/dispute', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    const validationResult = disputeSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
      return;
    }

    const data = validationResult.data;

    // Find the payment for this booking
    const payment = Array.from(payments.values())
      .find(p => p.bookingId === data.bookingId);

    if (!payment) {
      res.status(404).json({ error: 'Payment not found for this booking' });
      return;
    }

    // Check ownership
    if (payment.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const dispute: Dispute = {
      id: uuidv4(),
      bookingId: data.bookingId,
      userId,
      providerId: data.providerId,
      reason: data.reason,
      evidence: data.evidence || [],
      status: 'open',
      createdAt: new Date().toISOString()
    };

    disputes.set(dispute.id, dispute);

    logger.info({
      message: 'Dispute raised',
      disputeId: dispute.id,
      bookingId: data.bookingId
    });

    res.status(201).json({
      success: true,
      data: dispute
    });
  } catch (error: any) {
    logger.error({ message: 'Error raising dispute', error: error.message });
    res.status(500).json({ error: 'Failed to raise dispute' });
  }
});

// GET /payments/wallet/:providerId - Get provider wallet
paymentsRouter.get('/wallet/:providerId', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const providerId = req.params.providerId;

    // Check ownership
    if (providerId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const wallet = getOrCreateWallet(providerId);

    // Get pending settlements
    const pendingSettlements = Array.from(settlements.values())
      .filter(s => s.providerId === providerId && s.status === 'pending');

    res.json({
      success: true,
      data: {
        wallet,
        pendingSettlements,
        stats: {
          availableBalance: wallet.balance,
          pendingBalance: wallet.pendingBalance,
          totalEarnings: wallet.totalEarnings,
          totalPayouts: wallet.totalPayouts
        }
      }
    });
  } catch (error: any) {
    logger.error({ message: 'Error fetching wallet', error: error.message });
    res.status(500).json({ error: 'Failed to fetch wallet' });
  }
});
