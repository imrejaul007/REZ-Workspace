// Unified Loyalty Account - single wallet across all industries
export interface UnifiedLoyaltyAccount {
  accountId: string;
  userId: string;
  phone: string;
  email?: string;
  totalPoints: number;
  tier: LoyaltyTierName;
  verticals: LoyaltyVertical[];
  createdAt: Date;
  updatedAt: Date;
}

// Industries the user has engaged with
export interface LoyaltyVertical {
  vertical: string;
  points: number;
  lastActivity: Date;
  transactions: number;
}

// Transaction records
export interface LoyaltyTransaction {
  transactionId: string;
  accountId: string;
  userId: string;
  merchantId: string;
  vertical: string;
  type: TransactionType;
  points: number;
  source: string;
  sourceId?: string;
  description: string;
  expiresAt?: Date;
  createdAt: Date;
}

// Tier system
export type LoyaltyTierName = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface LoyaltyTier {
  name: LoyaltyTierName;
  minPoints: number;
  maxPoints: number;
  multiplier: number;
  benefits: string[];
  color: string;
}

// Cross-industry redemption
export interface CrossIndustryRedemption {
  redemptionId: string;
  accountId: string;
  fromVertical: string;
  toVertical: string;
  points: number;
  convertedValue: number;
  targetVertical: string;
  targetMerchantId: string;
  status: RedemptionStatus;
  createdAt: Date;
}

export type RedemptionStatus = 'pending' | 'completed' | 'cancelled';

// Campaign management
export type CampaignType = 'points_boost' | 'bonus' | 'double';

export interface LoyaltyCampaign {
  campaignId: string;
  name: string;
  merchantId: string;
  vertical: string;
  type: CampaignType;
  multiplier: number;
  startDate: Date;
  endDate: Date;
  maxParticipants?: number;
  participantCount: number;
  participants: string[];
  status: CampaignStatus;
  createdAt: Date;
}

export type CampaignStatus = 'active' | 'paused' | 'completed' | 'cancelled';

// API Request/Response types
export interface EarnPointsRequest {
  accountId: string;
  userId: string;
  merchantId: string;
  vertical: string;
  points: number;
  source: string;
  sourceId?: string;
  description: string;
  expiresInDays?: number;
}

export interface RedeemPointsRequest {
  accountId: string;
  merchantId: string;
  vertical: string;
  points: number;
  sourceId?: string;
  description: string;
}

export interface TransferPointsRequest {
  accountId: string;
  fromVertical: string;
  toVertical: string;
  points: number;
}

export interface CrossIndustryRedemptionRequest {
  accountId: string;
  fromVertical: string;
  toVertical: string;
  points: number;
  targetMerchantId: string;
}

export interface ConversionResult {
  originalPoints: number;
  fromVertical: string;
  toVertical: string;
  conversionRate: number;
  convertedValue: number;
  targetVertical: string;
  targetMerchantId: string;
}

// Analytics types
export interface AccountSummary {
  accountId: string;
  totalPoints: number;
  tier: LoyaltyTierName;
  verticalsCount: number;
  totalTransactions: number;
  totalEarned: number;
  totalRedeemed: number;
  topVertical: string;
  averagePointsPerTransaction: number;
}

export interface MerchantPerformance {
  merchantId: string;
  totalAccounts: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  averagePointsPerTransaction: number;
  activeCampaigns: number;
  redemptionRate: number;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Industry vertical URLs (for service discovery)
export const INDUSTRY_VERTICALS = [
  'restaurant',
  'spa',
  'retail',
  'hotel',
  'travel',
  'transportation',
  'entertainment',
  'healthcare',
  'fitness',
  'beauty',
  'education',
  'automotive',
  'home_services',
  'grocery',
  'pharmacy',
  'events',
  'gaming'
] as const;

export type IndustryVertical = typeof INDUSTRY_VERTICALS[number];