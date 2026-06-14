import { z } from 'zod';

export const ReferralProgramSchema = z.object({
  id: z.string().optional(),
  shopifyShopId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  referralCode: z.string().optional(),
  rewardType: z.enum(['fixed', 'percentage', 'points', 'free_shipping']),
  rewardValue: z.number(),
  rewardThreshold: z.number().optional(),
  maxRewards: z.number().optional(),
  maxRewardsPerUser: z.number().optional(),
  minPurchaseAmount: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  terms: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});
export type ReferralProgram = z.infer<typeof ReferralProgramSchema>;

export const ReferralSchema = z.object({
  id: z.string().optional(),
  programId: z.string(),
  referrerId: z.string(),
  refereeId: z.string().optional(),
  referralCode: z.string(),
  status: z.enum(['pending', 'converted', 'rewarded', 'expired', 'cancelled']),
  rewardAmount: z.number().optional(),
  rewardType: z.enum(['fixed', 'percentage', 'points', 'free_shipping']).optional(),
  conversionDate: z.string().optional(),
  metadata: z.record(z.any()).default({}),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});
export type Referral = z.infer<typeof ReferralSchema>;

export const ReferralShareSchema = z.object({
  referralId: z.string(),
  channel: z.enum(['email', 'sms', 'whatsapp', 'facebook', 'twitter', 'instagram', 'copy_link']),
  recipient: z.string().optional(),
  message: z.string().optional(),
  sharedAt: z.string().optional()
});
export type ReferralShare = z.infer<typeof ReferralShareSchema>;

export const ReferralStatsSchema = z.object({
  programId: z.string(),
  totalReferrals: z.number(),
  convertedReferrals: z.number(),
  pendingReferrals: z.number(),
  conversionRate: z.number(),
  totalRewardsGiven: z.number(),
  avgRewardValue: z.number(),
  topReferrers: z.array(z.object({
    referrerId: z.string(),
    referralCount: z.number(),
    totalRewards: z.number()
  })).default([])
});
export type ReferralStats = z.infer<typeof ReferralStatsSchema>;
