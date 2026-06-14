// @ts-nocheck
/**
 * REZ Loyalty Integration for Consumer App
 *
 * Connects consumer app to unified loyalty system
 */

export {
  useUniversalLoyalty,
  useQRLoyalty,
  useLoyaltyBenefits,
  useOfferEligibility,
} from '@rez/loyalty-client';

// Re-export types
export type {
  LoyaltyProfile,
  KarmaLoyaltyProfile,
  EnrichedLoyaltyProfile,
  LoyaltyOffer,
  KarmaEnhancedOffer,
  LoyaltyBadge,
  StreakData,
  CoinBalance,
  Badge,
  LoyaltyTier,
  KarmaLevel,
  Streak,
  StreakMilestone,
  AllStreaks,
  VisitStreak,
  CoinTransaction,
  CoinBalance as CoinBalanceType,
  BrandLoyalty,
  UserLoyalty,
  Mission,
  UniversalLoyaltyConfig,
  UseUniversalLoyaltyReturn,
  UseQRLoyaltyReturn,
  LoyaltyBenefits,
} from '@rez/loyalty-client';

// Default config
export const loyaltyConfig = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
  mindApiUrl: process.env.NEXT_PUBLIC_MIND_API_URL,
  mindApiKey: process.env.NEXT_PUBLIC_MIND_API_KEY,
};
