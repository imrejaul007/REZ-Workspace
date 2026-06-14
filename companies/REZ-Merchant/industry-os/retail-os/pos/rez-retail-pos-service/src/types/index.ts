import { z } from 'zod';

// Payment Methods
export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  UPI = 'upi',
  WALLET = 'wallet',
  MIXED = 'mixed',
}

// Transaction Status
export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  VOIDED = 'voided',
  FAILED = 'failed',
}

// Transaction Item
export const TransactionItemSchema = z.object({
  productId: z.string().uuid(),
  sku: z.string(),
  name: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  total: z.number().positive(),
  variantId: z.string().uuid().optional(),
});

export type TransactionItem = z.infer<typeof TransactionItemSchema>;

// Payment Detail
export const PaymentDetailSchema = z.object({
  method: z.nativeEnum(PaymentMethod),
  amount: z.number().positive(),
  reference: z.string().optional(),
  cardLast4: z.string().optional(),
  transactionRef: z.string().optional(),
});

export type PaymentDetail = z.infer<typeof PaymentDetailSchema>;

// Transaction Schema
export const TransactionSchema = z.object({
  id: z.string().uuid(),
  transactionNumber: z.string(),
  type: z.enum(['sale', 'return', 'void', 'exchange']).default('sale'),
  status: z.nativeEnum(TransactionStatus).default(TransactionStatus.PENDING),
  items: z.array(TransactionItemSchema),
  subtotal: z.number().positive(),
  taxAmount: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),
  loyaltyPointsApplied: z.number().int().min(0).default(0),
  loyaltyPointsValue: z.number().min(0).default(0),
  total: z.number().positive(),
  paidAmount: z.number().positive(),
  changeGiven: z.number().min(0).default(0),
  payments: z.array(PaymentDetailSchema),
  customerId: z.string().uuid().optional(),
  customerName: z.string().optional(),
  cashierId: z.string(),
  storeId: z.string().uuid().optional(),
  registerId: z.string().optional(),
  notes: z.string().optional(),
  refundedAmount: z.number().min(0).default(0),
  refundReason: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Transaction = z.infer<typeof TransactionSchema>;

// Receipt Schema
export const ReceiptSchema = z.object({
  id: z.string().uuid(),
  transactionId: z.string().uuid(),
  transactionNumber: z.string(),
  storeName: z.string(),
  storeAddress: z.string().optional(),
  storePhone: z.string().optional(),
  storeGst: z.string().optional(),
  items: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    total: z.number(),
  })),
  subtotal: z.number(),
  taxAmount: z.number(),
  discountAmount: z.number(),
  total: z.number(),
  paymentMethod: z.string(),
  customerName: z.string().optional(),
  cashierName: z.string(),
  date: z.date(),
  footerMessage: z.string().optional(),
});

export type Receipt = z.infer<typeof ReceiptSchema>;

// Cart Item (for POS interface)
export const CartItemSchema = z.object({
  productId: z.string().uuid(),
  sku: z.string(),
  name: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  discount: z.number().min(0).default(0),
  variantId: z.string().uuid().optional(),
});

export type CartItem = z.infer<typeof CartItemSchema>;

// Create Transaction Request
export const CreateTransactionSchema = z.object({
  type: z.enum(['sale', 'return']).default('sale'),
  items: z.array(CartItemSchema),
  customerId: z.string().uuid().optional(),
  payments: z.array(PaymentDetailSchema).min(1),
  loyaltyPointsApplied: z.number().int().min(0).default(0),
  cashierId: z.string(),
  storeId: z.string().uuid().optional(),
  registerId: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
