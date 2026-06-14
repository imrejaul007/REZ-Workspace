/**
 * Feature Control - Tier and Feature Definitions
 *
 * Static tier and feature configurations for Profile Service.
 * These can be overridden by REE responses at runtime.
 */

// User tier definitions
export const USER_TIERS = {
  starter: {
    name: 'starter',
    minSpend: 0,
    maxSpend: 999,
    benefits: {
      canEarnRez: true,
      canEarnBranded: false,
      canEarnPromo: false,
      canEarnPrive: false,
      canConvertKarma: false,
      hasPrioritySupport: false,
      hasEarlyAccess: false,
      hasExclusiveEvents: false,
      hasVipKarmaEvents: false,
      maxSocialSharesPerDay: 1,
      maxCashbackPercent: 3,
      maxReferralsPerMonth: 5,
    },
  },
  silver: {
    name: 'silver',
    minSpend: 1000,
    maxSpend: 4999,
    benefits: {
      canEarnRez: true,
      canEarnBranded: true,
      canEarnPromo: false,
      canEarnPrive: false,
      canConvertKarma: false,
      hasPrioritySupport: false,
      hasEarlyAccess: false,
      hasExclusiveEvents: false,
      hasVipKarmaEvents: false,
      maxSocialSharesPerDay: 2,
      maxCashbackPercent: 5,
      maxReferralsPerMonth: 10,
    },
  },
  gold: {
    name: 'gold',
    minSpend: 5000,
    maxSpend: 19999,
    benefits: {
      canEarnRez: true,
      canEarnBranded: true,
      canEarnPromo: true,
      canEarnPrive: false,
      canConvertKarma: true,
      hasPrioritySupport: true,
      hasEarlyAccess: true,
      hasExclusiveEvents: false,
      hasVipKarmaEvents: false,
      maxSocialSharesPerDay: 3,
      maxCashbackPercent: 7,
      maxReferralsPerMonth: 20,
    },
  },
  platinum: {
    name: 'platinum',
    minSpend: 20000,
    maxSpend: 49999,
    benefits: {
      canEarnRez: true,
      canEarnBranded: true,
      canEarnPromo: true,
      canEarnPrive: true,
      canConvertKarma: true,
      hasPrioritySupport: true,
      hasEarlyAccess: true,
      hasExclusiveEvents: true,
      hasVipKarmaEvents: false,
      maxSocialSharesPerDay: 5,
      maxCashbackPercent: 10,
      maxReferralsPerMonth: 50,
    },
  },
  vip: {
    name: 'vip',
    minSpend: 50000,
    maxSpend: Infinity,
    benefits: {
      canEarnRez: true,
      canEarnBranded: true,
      canEarnPromo: true,
      canEarnPrive: true,
      canConvertKarma: true,
      hasPrioritySupport: true,
      hasEarlyAccess: true,
      hasExclusiveEvents: true,
      hasVipKarmaEvents: true,
      maxSocialSharesPerDay: 10,
      maxCashbackPercent: 15,
      maxReferralsPerMonth: 100,
    },
  },
} as const;

// Merchant tier definitions
export const MERCHANT_TIERS = {
  basic: {
    name: 'basic',
    commissionRate: 15,
    minVolume: 0,
    maxVolume: 99999,
    features: {
      canUseStandardPayments: true,
      canUseInstantPayouts: false,
      canUseAnalytics: false,
      canUsePromotions: false,
      canUseWhiteLabel: false,
      canUseApiAccess: false,
      canUseMultiLocation: false,
    },
  },
  growth: {
    name: 'growth',
    commissionRate: 12,
    minVolume: 100000,
    maxVolume: 499999,
    features: {
      canUseStandardPayments: true,
      canUseInstantPayouts: true,
      canUseAnalytics: true,
      canUsePromotions: true,
      canUseWhiteLabel: false,
      canUseApiAccess: false,
      canUseMultiLocation: false,
    },
  },
  professional: {
    name: 'professional',
    commissionRate: 10,
    minVolume: 500000,
    maxVolume: 1999999,
    features: {
      canUseStandardPayments: true,
      canUseInstantPayouts: true,
      canUseAnalytics: true,
      canUsePromotions: true,
      canUseWhiteLabel: true,
      canUseApiAccess: true,
      canUseMultiLocation: true,
    },
  },
  enterprise: {
    name: 'enterprise',
    commissionRate: 8,
    minVolume: 2000000,
    maxVolume: Infinity,
    features: {
      canUseStandardPayments: true,
      canUseInstantPayouts: true,
      canUseAnalytics: true,
      canUsePromotions: true,
      canUseWhiteLabel: true,
      canUseApiAccess: true,
      canUseMultiLocation: true,
    },
  },
} as const;

// Type exports
export type UserTierName = keyof typeof USER_TIERS;
export type MerchantTierName = keyof typeof MERCHANT_TIERS;

/**
 * Get user tier based on lifetime spend
 */
export function getUserTierBySpend(spend: number): (typeof USER_TIERS)[keyof typeof USER_TIERS] {
  const tiers = Object.values(USER_TIERS);
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (spend >= tiers[i].minSpend) {
      return tiers[i];
    }
  }
  return USER_TIERS.starter;
}

/**
 * Get merchant tier based on monthly volume
 */
export function getMerchantTierByVolume(volume: number): (typeof MERCHANT_TIERS)[keyof typeof MERCHANT_TIERS] {
  const tiers = Object.values(MERCHANT_TIERS);
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (volume >= tiers[i].minVolume) {
      return tiers[i];
    }
  }
  return MERCHANT_TIERS.basic;
}
