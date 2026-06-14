/**
 * Zod validation schemas for Order service.
 * These schemas validate all incoming requests at the API boundary.
 * Aligns with canonical enums from shared-types.
 */

import { z } from 'zod';

// Order status enum (11 states)
export const ORDER_STATUS = z.enum([
  'placed',
  'confirmed',
  'preparing',
  'ready',
  'dispatched',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'cancelling',
  'returned',
  'refunded',
]);

// Payment status enum (11 states)
export const PAYMENT_STATUS = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
  'expired',
  'refund_initiated',
  'refund_processing',
  'refunded',
  'refund_failed',
  'partially_refunded',
]);

// Payment method enum (4 types)
export const PAYMENT_METHOD = z.enum([
  'upi',
  'card',
  'wallet',
  'netbanking',
]);

/**
 * Order item schema.
 * @field price — Item unit price in **rupees** (not paise). The order total is
 *   computed server-side from authoritative catalog prices; client-supplied prices
 *   are advisory only and overridden by the backend during order creation.
 */
export const OrderItemSchema = z.object({
  itemId: z.string().optional(),
  name: z.string().optional(),
  quantity: z.number().int().positive().optional(),
  price: z.number().positive().optional(),
}).passthrough();

/**
 * Order totals schema.
 * All monetary fields are in **rupees** (INR major unit).
 * Razorpay integration converts to paise (×100) internally when creating payment orders.
 */
export const OrderTotalsSchema = z.object({
  subtotal: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  deliveryFee: z.number().min(0).optional(),
  total: z.number().min(0).optional(),
}).passthrough();

/**
 * Order payment schema.
 * @field amount — Payment amount in **rupees** (not paise).
 * @field method — One of: upi, card, wallet, netbanking.
 * @field status — Canonical PaymentStatus (11 states, see PAYMENT_STATUS enum above).
 */
export const OrderPaymentSchema = z.object({
  method: PAYMENT_METHOD.optional(),
  status: PAYMENT_STATUS.optional(),
  amount: z.number().min(0).optional(),
}).passthrough();

export const OrderDeliverySchema = z.object({
  type: z.string().optional(),
  address: z.record(z.unknown()).optional(),
}).passthrough();

// Create Order Request
export const CreateOrderSchema = z.object({
  user: z.string().min(1, 'User ID is required'),
  store: z.string().min(1, 'Store ID is required'),
  items: z.array(OrderItemSchema).min(1, 'At least one item is required'),
  totals: OrderTotalsSchema.optional(),
  payment: OrderPaymentSchema.optional(),
  delivery: OrderDeliverySchema.optional(),
  currency: z.string().optional().default('INR'),
});

// Update Order Status Request
export const OrderStatusUpdateSchema = z.object({
  status: ORDER_STATUS,
  reason: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Alias for consistency
export const UpdateOrderStatusSchema = OrderStatusUpdateSchema;

export const OrderCancelSchema = z.object({
  reason: z.string().optional(),
});

// Order Response
export const OrderResponseSchema = z.object({
  _id: z.string().optional(),
  orderNumber: z.string().optional(),
  status: ORDER_STATUS,
  user: z.string(),
  store: z.string(),
  items: z.array(OrderItemSchema),
  totals: OrderTotalsSchema.optional(),
  payment: OrderPaymentSchema.optional(),
  delivery: OrderDeliverySchema.optional(),
  currency: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
}).passthrough();

// Order Query/List
export const OrderQuerySchema = z.object({
  merchantId: z.string().optional(),
  userId: z.string().optional(),
  status: ORDER_STATUS.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const StreamQuerySchema = z.object({
  merchantId: z.string(),
});
