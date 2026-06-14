import { z } from 'zod';

// Base event schema
const baseEventSchema = z.object({
  version: z.string().default('1.0'),
  timestamp: z.string().datetime(),
  service: z.string().default('rez-referral-os'),
});

// Referral Events
export const referralRegisteredSchema = baseEventSchema.extend({
  type: z.literal('referral.registered'),
  data: z.object({
    referralId: z.string(),
    referrerId: z.string(),
    refereeId: z.string(),
    referralCode: z.string(),
    type: z.enum(['consumer', 'merchant', 'creator']),
    companyId: z.string(),
    campaignId: z.string().optional(),
    ip: z.string().optional(),
    deviceId: z.string().optional(),
  }),
});

export const referralQualifiedSchema = baseEventSchema.extend({
  type: z.literal('referral.qualified'),
  data: z.object({
    referralId: z.string(),
    referrerId: z.string(),
    refereeId: z.string(),
    referralCode: z.string(),
    qualifiedAt: z.string().datetime(),
    rewardAmount: z.number(),
  }),
});

export const referralRewardedSchema = baseEventSchema.extend({
  type: z.literal('referral.rewarded'),
  data: z.object({
    referralId: z.string(),
    referrerId: z.string(),
    refereeId: z.string(),
    rewardId: z.string(),
    amount: z.number(),
    coinType: z.string(),
    source: z.enum(['referral', 'ambassador_bonus', 'campaign']),
  }),
});

export const referralExpiredSchema = baseEventSchema.extend({
  type: z.literal('referral.expired'),
  data: z.object({
    referralId: z.string(),
    referrerId: z.string(),
    refereeId: z.string(),
    reason: z.string(),
    expiredAt: z.string().datetime(),
  }),
});

// Creator Events
export const creatorProfileCreatedSchema = baseEventSchema.extend({
  type: z.literal('creator.profile_created'),
  data: z.object({
    creatorId: z.string(),
    handle: z.string(),
    companyId: z.string(),
    tier: z.enum(['starter', 'pro', 'elite', 'partner', 'ambassador']),
  }),
});

export const creatorCollectionCreatedSchema = baseEventSchema.extend({
  type: z.literal('creator.collection_created'),
  data: z.object({
    creatorId: z.string(),
    collectionId: z.string(),
    name: z.string(),
    slug: z.string(),
  }),
});

export const creatorQRScanSchema = baseEventSchema.extend({
  type: z.literal('creator.qr_scanned'),
  data: z.object({
    creatorId: z.string(),
    collectionSlug: z.string().optional(),
    userId: z.string().optional(),
    ip: z.string().optional(),
    deviceId: z.string().optional(),
    location: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }),
});

export const creatorCommissionEarnedSchema = baseEventSchema.extend({
  type: z.literal('creator.commission_earned'),
  data: z.object({
    creatorId: z.string(),
    referralId: z.string(),
    commissionAmount: z.number(),
    orderValue: z.number(),
    commissionRate: z.number(),
  }),
});

// Campaign Events
export const campaignCreatedSchema = baseEventSchema.extend({
  type: z.literal('campaign.created'),
  data: z.object({
    campaignId: z.string(),
    name: z.string(),
    sponsorId: z.string(),
    type: z.enum(['consumer', 'merchant', 'creator']),
    budget: z.number(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional(),
  }),
});

export const campaignActivatedSchema = baseEventSchema.extend({
  type: z.literal('campaign.activated'),
  data: z.object({
    campaignId: z.string(),
    activatedAt: z.string().datetime(),
  }),
});

export const campaignDeactivatedSchema = baseEventSchema.extend({
  type: z.literal('campaign.deactivated'),
  data: z.object({
    campaignId: z.string(),
    reason: z.string(),
    deactivatedAt: z.string().datetime(),
  }),
});

export const campaignBudgetExhaustedSchema = baseEventSchema.extend({
  type: z.literal('campaign.budget_exhausted'),
  data: z.object({
    campaignId: z.string(),
    totalSpent: z.number(),
    exhaustedAt: z.string().datetime(),
  }),
});

// Ambassador Events
export const ambassadorTierUpgradedSchema = baseEventSchema.extend({
  type: z.literal('ambassador.tier_upgraded'),
  data: z.object({
    userId: z.string(),
    previousTier: z.enum(['bronze', 'silver', 'gold', 'platinum', 'diamond']),
    newTier: z.enum(['bronze', 'silver', 'gold', 'platinum', 'diamond']),
    totalReferrals: z.number(),
    upgradedAt: z.string().datetime(),
  }),
});

export const ambassadorBenefitUnlockedSchema = baseEventSchema.extend({
  type: z.literal('ambassador.benefit_unlocked'),
  data: z.object({
    userId: z.string(),
    tier: z.enum(['bronze', 'silver', 'gold', 'platinum', 'diamond']),
    benefit: z.string(),
  }),
});

// Fraud Events
export const fraudBlockedSchema = baseEventSchema.extend({
  type: z.literal('fraud.blocked'),
  data: z.object({
    referralId: z.string(),
    referrerId: z.string(),
    refereeId: z.string(),
    riskScore: z.number(),
    flags: z.array(z.string()),
    blockedAt: z.string().datetime(),
  }),
});

export const fraudFlaggedSchema = baseEventSchema.extend({
  type: z.literal('fraud.flagged'),
  data: z.object({
    referralId: z.string(),
    riskScore: z.number(),
    flags: z.array(z.string()),
    flaggedAt: z.string().datetime(),
  }),
});

// Team Referral Events
export const teamReferralEarnedSchema = baseEventSchema.extend({
  type: z.literal('team.referral_earned'),
  data: z.object({
    level: z.number().min(1).max(3),
    referrerId: z.string(),
    originalReferrerId: z.string(),
    amount: z.number(),
    source: z.literal('team_bonus'),
  }),
});

// Type exports
export type ReferralRegisteredEvent = z.infer<typeof referralRegisteredSchema>;
export type ReferralQualifiedEvent = z.infer<typeof referralQualifiedSchema>;
export type ReferralRewardedEvent = z.infer<typeof referralRewardedSchema>;
export type ReferralExpiredEvent = z.infer<typeof referralExpiredSchema>;
export type CreatorProfileCreatedEvent = z.infer<typeof creatorProfileCreatedSchema>;
export type CreatorCollectionCreatedEvent = z.infer<typeof creatorCollectionCreatedSchema>;
export type CreatorQRScanEvent = z.infer<typeof creatorQRScanSchema>;
export type CreatorCommissionEarnedEvent = z.infer<typeof creatorCommissionEarnedSchema>;
export type CampaignCreatedEvent = z.infer<typeof campaignCreatedSchema>;
export type CampaignActivatedEvent = z.infer<typeof campaignActivatedSchema>;
export type CampaignDeactivatedEvent = z.infer<typeof campaignDeactivatedSchema>;
export type CampaignBudgetExhaustedEvent = z.infer<typeof campaignBudgetExhaustedSchema>;
export type AmbassadorTierUpgradedEvent = z.infer<typeof ambassadorTierUpgradedSchema>;
export type AmbassadorBenefitUnlockedEvent = z.infer<typeof ambassadorBenefitUnlockedSchema>;
export type FraudBlockedEvent = z.infer<typeof fraudBlockedSchema>;
export type FraudFlaggedEvent = z.infer<typeof fraudFlaggedSchema>;
export type TeamReferralEarnedEvent = z.infer<typeof teamReferralEarnedSchema>;

// Union type for all events
export type ReferralEvent =
  | ReferralRegisteredEvent
  | ReferralQualifiedEvent
  | ReferralRewardedEvent
  | ReferralExpiredEvent
  | CreatorProfileCreatedEvent
  | CreatorCollectionCreatedEvent
  | CreatorQRScanEvent
  | CreatorCommissionEarnedEvent
  | CampaignCreatedEvent
  | CampaignActivatedEvent
  | CampaignDeactivatedEvent
  | CampaignBudgetExhaustedEvent
  | AmbassadorTierUpgradedEvent
  | AmbassadorBenefitUnlockedEvent
  | FraudBlockedEvent
  | FraudFlaggedEvent
  | TeamReferralEarnedEvent;

// Event type registry for validation
export const EVENT_REGISTRY: Record<string, z.ZodType> = {
  'referral.registered': referralRegisteredSchema,
  'referral.qualified': referralQualifiedSchema,
  'referral.rewarded': referralRewardedSchema,
  'referral.expired': referralExpiredSchema,
  'creator.profile_created': creatorProfileCreatedSchema,
  'creator.collection_created': creatorCollectionCreatedSchema,
  'creator.qr_scanned': creatorQRScanSchema,
  'creator.commission_earned': creatorCommissionEarnedSchema,
  'campaign.created': campaignCreatedSchema,
  'campaign.activated': campaignActivatedSchema,
  'campaign.deactivated': campaignDeactivatedSchema,
  'campaign.budget_exhausted': campaignBudgetExhaustedSchema,
  'ambassador.tier_upgraded': ambassadorTierUpgradedSchema,
  'ambassador.benefit_unlocked': ambassadorBenefitUnlockedSchema,
  'fraud.blocked': fraudBlockedSchema,
  'fraud.flagged': fraudFlaggedSchema,
  'team.referral_earned': teamReferralEarnedSchema,
};
