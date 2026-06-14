import { z } from 'zod';

// Transaction Types
export type TransactionType = 'booking_deposit' | 'order' | 'appointment' | 'subscription' | 'tip';
export type TransactionStatus = 'initiated' | 'pending_payment' | 'completed' | 'failed' | 'cancelled' | 'refunded';
export type PaymentMethod = 'wallet' | 'upi' | 'card' | 'netbanking';

// Transaction Interface
export interface ITransactionMetadata {
  productIds?: string[];
  bookingId?: string;
  adClickId?: string;
  intentSignalId?: string;
  [key: string]: unknown;
}

export interface IEcosystemTransaction {
  transactionId: string;
  adId: string;
  campaignId?: string;
  advertiserId: string;
  userId: string;
  businessId?: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  metadata: ITransactionMetadata;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response DTOs
export interface InitiateTransactionRequest {
  adId: string;
  campaignId?: string;
  advertiserId: string;
  userId: string;
  businessId?: string;
  type: TransactionType;
  amount: number;
  currency?: string;
  paymentMethod?: PaymentMethod;
  metadata?: ITransactionMetadata;
}

export interface TransactionResponse {
  success: boolean;
  data?: IEcosystemTransaction;
  error?: string;
}

export interface TransactionListResponse {
  success: boolean;
  data: {
    transactions: IEcosystemTransaction[];
    total: number;
    page: number;
    limit: number;
  };
  error?: string;
}

// Redis Cache Types
export interface TransactionCache {
  transactionId: string;
  status: TransactionStatus;
  amount: number;
  userId: string;
  adId: string;
  createdAt: string;
}

// Event Types
export interface TransactionEvent {
  type: 'transaction.initiated' | 'transaction.completed' | 'transaction.cancelled' | 'transaction.refunded';
  transactionId: string;
  adId: string;
  userId: string;
  advertiserId: string;
  amount: number;
  status: TransactionStatus;
  timestamp: Date;
}

// Analytics Types
export interface TransactionAnalytics {
  totalTransactions: number;
  totalAmount: number;
  completedCount: number;
  pendingCount: number;
  failedCount: number;
  cancelledCount: number;
  refundedCount: number;
  averageAmount: number;
  byType: Record<TransactionType, { count: number; amount: number }>;
  byPaymentMethod: Record<PaymentMethod, { count: number; amount: number }>;
}

// Zod Schemas for Validation
export const TransactionTypeSchema = z.enum(['booking_deposit', 'order', 'appointment', 'subscription', 'tip']);
export const TransactionStatusSchema = z.enum(['initiated', 'pending_payment', 'completed', 'failed', 'cancelled', 'refunded']);
export const PaymentMethodSchema = z.enum(['wallet', 'upi', 'card', 'netbanking']);

export const InitiateTransactionSchema = z.object({
  adId: z.string().min(1),
  campaignId: z.string().optional(),
  advertiserId: z.string().min(1),
  userId: z.string().min(1),
  businessId: z.string().optional(),
  type: TransactionTypeSchema,
  amount: z.number().positive(),
  currency: z.string().default('INR'),
  paymentMethod: PaymentMethodSchema.optional(),
  metadata: z.object({
    productIds: z.array(z.string()).optional(),
    bookingId: z.string().optional(),
    adClickId: z.string().optional(),
    intentSignalId: z.string().optional(),
  }).optional(),
});

export const ConfirmTransactionSchema = z.object({
  paymentReference: z.string().min(1),
  paymentMethod: PaymentMethodSchema.optional(),
});

export const CancelTransactionSchema = z.object({
  reason: z.string().optional(),
});

export const RefundTransactionSchema = z.object({
  reason: z.string().optional(),
  refundAmount: z.number().optional(),
});

// Express Request Extension
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        advertiserId?: string;
        role?: string;
      };
    }
  }
}