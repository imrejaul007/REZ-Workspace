import { z } from 'zod';

export const ReturnReasonSchema = z.enum([
  'defective',
  'wrong_item',
  'not_as_described',
  'changed_mind',
  'late_delivery',
  'damaged_in_transit',
  'other'
]);
export type ReturnReason = z.infer<typeof ReturnReasonSchema>;

export const ReturnStatusSchema = z.enum([
  'requested',
  'approved',
  'rejected',
  'pickup_scheduled',
  'picked_up',
  'received',
  'inspected',
  'refund_initiated',
  'refund_completed',
  'exchange_initiated',
  'exchange_completed',
  'cancelled'
]);
export type ReturnStatus = z.infer<typeof ReturnStatusSchema>;

export const ReturnRequestSchema = z.object({
  orderId: z.string(),
  itemId: z.string(),
  reason: ReturnReasonSchema,
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  refundAmount: z.number().optional(),
  preferredResolution: z.enum(['refund', 'exchange', 'store_credit']).default('refund')
});
export type ReturnRequest = z.infer<typeof ReturnRequestSchema>;

export const ReturnSchema = z.object({
  id: z.string(),
  returnNumber: z.string(),
  orderId: z.string(),
  itemId: z.string(),
  reason: ReturnReasonSchema,
  description: z.string().optional(),
  status: ReturnStatusSchema,
  refundAmount: z.number(),
  refundMethod: z.enum(['original_payment', 'store_credit', 'bank_transfer']).optional(),
  pickupAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    pincode: z.string()
  }).optional(),
  pickupDate: z.string().optional(),
  trackingId: z.string().optional(),
  timeline: z.array(z.object({
    status: z.string(),
    timestamp: z.string(),
    note: z.string().optional()
  })).default([]),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type Return = z.infer<typeof ReturnSchema>;
