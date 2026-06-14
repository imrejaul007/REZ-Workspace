// @ts-nocheck
// Service exports - Central hub for all consumer app services

export { default as merchantApi, merchantApi as api } from './api';
export { default as inventoryService } from './inventory';
export {
  default as customer360,
  customer360 as customer360Service,
} from './customer360';

// AI Intelligence Services
export {
  ReZIntelligence,
  IntentService,
  DemandService,
  ScarcityService,
  PersonalizationService,
  SimilarityService,
  InsightService,
  RecoveryService,
} from './rez-intelligence';

export type {
  TrendingItem,
  ScarcityStatus,
  PersonalizedRecommendation,
  PairingItem,
} from './rez-intelligence';

// Media Services (QR, Karma, Gamification)
export {
  ReZMedia,
  QRCampaignService,
  KarmaService,
  GamificationService,
  AbandonmentService,
} from './rez-media';

// CorpPerks Services (Corporate Meals)
export {
  CorpPerks,
  MealBenefitService,
  CorporateOrderService,
  CorporateWalletService,
  RestaurantPartnerService,
} from './corpperks';

export type { CustomerProfile, Transaction, LoyaltyStatus, Recommendation } from './customer360';
