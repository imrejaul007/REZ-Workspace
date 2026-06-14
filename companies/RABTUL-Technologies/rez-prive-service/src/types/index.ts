/**
 * Prive Service - Core Types
 */

// Pillar IDs
export type PillarId = 'engagement' | 'trust' | 'influence' | 'economic' | 'brand_affinity' | 'network';

// Pillar weights (sum to 1.0)
export const PILLAR_WEIGHTS: Record<PillarId, number> = {
  engagement: 0.25,
  trust: 0.20,
  influence: 0.20,
  economic: 0.15,
  brand_affinity: 0.10,
  network: 0.10,
};

// Prive tiers
export type PriveTier = 'none' | 'entry' | 'signature' | 'elite';

// Access states
export type AccessState = 'active' | 'grace_period' | 'paused' | 'suspended' | 'revoked';

// Pillar score interface
export interface PillarScore {
  id: PillarId;
  name: string;
  shortName: string;
  score: number;           // 0-100
  weight: number;         // 0-1
  weightedScore: number;   // score * weight
  trend: 'up' | 'down' | 'stable';
  icon: string;
  color: string;
  description: string;
  improvementTips: string[];
}

// Engagement metrics
export interface EngagementMetrics {
  transactions30d: number;
  activeDays30d: number;
  categoriesUsed: number;
  hasRedeemedCoins: boolean;
  loginStreak: number;
}

// Trust metrics
export interface TrustMetrics {
  fakeBillDetected: boolean;
  duplicateAccount: boolean;
  cashbackAbuse: boolean;
  disputeRate: number;
  flaggedReviews: number;
  missedDeadlines: number;
}

// Influence metrics
export interface InfluenceMetrics {
  totalFollowers: number;
  engagementRate: number;
  isNicheConsistent: boolean;
  pastCampaignSuccess: boolean;
  hasFakeFollowers: boolean;
}

// Economic metrics
export interface EconomicMetrics {
  gmv30d: number;
  avgOrderValue: number;
  repeatMerchants: number;
  hasPremiumCategorySpend: boolean;
}

// Brand affinity metrics
export interface BrandAffinityMetrics {
  brandInvitations: number;
  campaignAcceptanceRate: number;
  brandFeedbackScore: number;
  brandLoyaltyScore: number;
}

// Network metrics
export interface NetworkMetrics {
  referralCount: number;
  referralQuality: number;
  communityEngagement: number;
  networkGrowth: number;
}

// All pillar metrics
export interface PillarMetrics {
  engagement?: EngagementMetrics;
  trust?: TrustMetrics;
  influence?: InfluenceMetrics;
  economic?: EconomicMetrics;
  brandAffinity?: BrandAffinityMetrics;
  network?: NetworkMetrics;
}

// Eligibility response
export interface EligibilityResponse {
  isEligible: boolean;
  score: number;
  tier: PriveTier;
  accessState: AccessState;
  trustScore: number;
  pillars: PillarScore[];
  metrics: PillarMetrics;
  gracePeriodEnds?: Date;
  reason?: string;
}

// Coin bonus result
export interface CoinBonusResult {
  eligible: boolean;
  tier: PriveTier;
  bonusPercent: number;
  bonusCoins: number;
  message: string;
}

// Engagement action types
export type EngagementAction =
  | 'booking'
  | 'review'
  | 'campaign'
  | 'referral'
  | 'dooh_scan'
  | 'social_share'
  | 'checkin';

// Engagement signal
export interface EngagementSignal {
  userId: string;
  action: EngagementAction;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

// Tier configuration
export interface TierConfig {
  id: PriveTier;
  name: string;
  minScore: number;
  maxScore: number;
  coinMultiplier: number;
  monthlyBonusCoins?: number;
  benefits: string[];
}

// Prive tier configurations
export const TIER_CONFIG: TierConfig[] = [
  {
    id: 'none',
    name: 'Non-Member',
    minScore: 0,
    maxScore: 49,
    coinMultiplier: 0,
    monthlyBonusCoins: 0,
    benefits: [],
  },
  {
    id: 'entry',
    name: 'Entry',
    minScore: 50,
    maxScore: 69,
    coinMultiplier: 1.0,
    monthlyBonusCoins: 0,
    benefits: ['Standard offers', 'Basic rewards'],
  },
  {
    id: 'signature',
    name: 'Signature',
    minScore: 70,
    maxScore: 84,
    coinMultiplier: 1.25,
    benefits: ['Priority support', '25% bonus coins', 'Exclusive offers'],
  },
  {
    id: 'elite',
    name: 'Elite',
    minScore: 85,
    maxScore: 100,
    coinMultiplier: 1.5,
    benefits: ['VIP support', '50% bonus coins', 'Exclusive access', 'Concierge'],
  },
];

// Ecosystem integration types
export type EcosystemService = 'creator_qr' | 'adbazaar' | 'dooh' | 'karma' | 'rendez' | 'intent_graph';

export interface EcosystemIntegration {
  service: EcosystemService;
  connected: boolean;
  lastSync?: Date;
  config?: Record<string, unknown>;
}

// Unified score response
export interface UnifiedScoreResponse {
  userId: string;
  priveScore: number;
  priveTier: PriveTier;
  karmaLevel?: string;
  karmaScore?: number;
  combinedMultiplier: number;
  pillarBreakdown: PillarScore[];
  ecosystemConnections: EcosystemIntegration[];
}
