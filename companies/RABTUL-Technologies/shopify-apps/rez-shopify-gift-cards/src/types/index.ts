import { z } from 'zod';

export const GiftCardSchema = z.object({
  id: z.string().optional(),
  code: z.string().optional(),
  shopifyGiftCardId: z.string().optional(),
  initialValue: z.number().min(0),
  currentBalance: z.number().min(0),
  currency: z.string().default('INR'),
  recipientName: z.string().optional(),
  recipientEmail: z.string().email().optional(),
  senderName: z.string(),
  message: z.string().max(500).optional(),
  theme: z.enum(['birthday', 'holiday', 'thankyou', 'celebration', 'general']).default('general'),
  status: z.enum(['active', 'redeemed', 'expired', 'cancelled']).default('active'),
  expiresAt: z.string().optional(),
  redeemedAt: z.string().optional(),
  orderId: z.string().optional(),
  metadata: z.record(z.any()).default({}),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});
export type GiftCard = z.infer<typeof GiftCardSchema>;

export const GiftCardCreateSchema = z.object({
  initialValue: z.number().min(1),
  currency: z.string().default('INR'),
  recipientName: z.string().optional(),
  recipientEmail: z.string().email().optional(),
  senderName: z.string(),
  message: z.string().max(500).optional(),
  theme: z.enum(['birthday', 'holiday', 'thankyou', 'celebration', 'general']).default('general'),
  expiresAt: z.string().optional()
});
export type GiftCardCreate = z.infer<typeof GiftCardCreateSchema>;

export const GiftCardTransactionSchema = z.object({
  id: z.string().optional(),
  giftCardId: z.string(),
  type: z.enum(['issue', 'redeem', 'refund', 'topup', 'expire']),
  amount: z.number(),
  balanceBefore: z.number(),
  balanceAfter: z.number(),
  orderId: z.string().optional(),
  note: z.string().optional(),
  createdAt: z.string().optional()
});
export type GiftCardTransaction = z.infer<typeof GiftCardTransactionSchema>;

export const GiftCardStatsSchema = z.object({
  totalIssued: z.number(),
  totalRedeemed: z.number(),
  totalBalance: z.number(),
  activeCards: z.number(),
  expiredCards: z.number(),
  avgValue: z.number()
});
export type GiftCardStats = z.infer<typeof GiftCardStatsSchema>;
