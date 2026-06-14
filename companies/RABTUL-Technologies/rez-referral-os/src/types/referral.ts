import mongoose, { Schema, Types } from 'mongoose';

// Referral Type
export const REFERRAL_TYPE = {
  CONSUMER: 'consumer',
  MERCHANT: 'merchant',
  CREATOR: 'creator',
} as const;
export type ReferralType = typeof REFERRAL_TYPE[keyof typeof REFERRAL_TYPE];

// Referral Status
export const REFERRAL_STATUS = {
  PENDING: 'pending',
  CLICKED: 'clicked',
  REGISTERED: 'registered',
  VERIFIED: 'verified',
  QUALIFIED: 'qualified',
  REWARDED: 'rewarded',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
} as const;
export type ReferralStatus = typeof REFERRAL_STATUS[keyof typeof REFERRAL_STATUS];

// Ambassador Tier
export const AMBASSADOR_TIER = {
  BRONZE: 'bronze', // 0-25 referrals
  SILVER: 'silver', // 26-100
  GOLD: 'gold', // 101-500
  PLATINUM: 'platinum', // 501-5000
  DIAMOND: 'diamond', // 5000+
} as const;
export type AmbassadorTier = typeof AMBASSADOR_TIER[keyof typeof AMBASSADOR_TIER];

// Creator Tier
export const CREATOR_TIER = {
  STARTER: 'starter', // 0-100 users
  PRO: 'pro', // 100-1000
  ELITE: 'elite', // 1000-5000
  PARTNER: 'partner', // 5000-50000
  AMBASSADOR: 'ambassador', // 50000+
} as const;
export type CreatorTier = typeof CREATOR_TIER[keyof typeof CREATOR_TIER];

// Reward Type
export const REWARD_TYPE = {
  COINS: 'coins',
  CASHBACK: 'cashback',
  DISCOUNT: 'discount',
  COMMISSION: 'commission',
} as const;
export type RewardType = typeof REWARD_TYPE[keyof typeof REWARD_TYPE];

// Share Channel
export const SHARE_CHANNEL = {
  WHATSAPP: 'whatsapp',
  INSTAGRAM: 'instagram',
  FACEBOOK: 'facebook',
  TELEGRAM: 'telegram',
  X: 'x',
  EMAIL: 'email',
  COPY_LINK: 'copy_link',
  QR: 'qr',
  NFC: 'nfc',
} as const;
export type ShareChannel = typeof SHARE_CHANNEL[keyof typeof SHARE_CHANNEL];

// Touchpoint Source
export const TOUCHPOINT_SOURCE = {
  LINK: 'link',
  QR: 'qr',
  NFC: 'nfc',
  POST: 'post',
  STORY: 'story',
  DM: 'dm',
  EMAIL: 'email',
  SMS: 'sms',
} as const;
export type TouchpointSource = typeof TOUCHPOINT_SOURCE[keyof typeof TOUCHPOINT_SOURCE];

// Fraud Check Types
export const FRAUD_CHECKS = {
  SAME_DEVICE: 'same_device',
  SAME_IP: 'same_ip',
  SAME_UPI: 'same_upi',
  SAME_BANK: 'same_bank',
  SAME_PHONE: 'same_phone',
  SAME_EMAIL_DOMAIN: 'same_email_domain',
  EMULATOR_DETECTED: 'emulator',
  VPN_DETECTED: 'vpn',
  MASS_ACCOUNT_CREATION: 'mass_accounts',
  CIRCULAR_REFERRAL: 'circular_referral',
  SELF_REFERRAL: 'self_referral',
  RAPID_SIGNUPS: 'rapid_signups',
} as const;
export type FraudCheckType = typeof FRAUD_CHECKS[keyof typeof FRAUD_CHECKS];

// Risk Level (added 'critical')
export const RISK_LEVEL = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;
export type RiskLevel = typeof RISK_LEVEL[keyof typeof RISK_LEVEL];

// Default Rewards Configuration
export const DEFAULT_REFERRAL_REWARDS: {
  consumer: { referrer: { type: 'coins'; value: number; coinType: string }; referee: { type: 'coins'; value: number; coinType: string } };
  merchant: { referrer: { type: 'discount'; value: number; coinType?: string }; referee: { type: 'coins'; value: number; coinType: string } };
  creator: { referrer: { type: 'commission'; value: number; coinType?: string }; referee: { type: 'coins'; value: number; coinType: string } };
} = {
  consumer: {
    referrer: { type: 'coins', value: 100, coinType: 'referral' },
    referee: { type: 'coins', value: 50, coinType: 'referral' },
  },
  merchant: {
    referrer: { type: 'discount', value: 10, coinType: 'referral' },
    referee: { type: 'coins', value: 500, coinType: 'referral' },
  },
  creator: {
    referrer: { type: 'commission', value: 5, coinType: 'referral' },
    referee: { type: 'coins', value: 25, coinType: 'referral' },
  },
};

// Team Referral Depth (optional multi-level rewards)
export const TEAM_REFERRAL_DEPTH = {
  level1: 1.0, // 100% of base reward
  level2: 0.1, // 10% of base reward
  level3: 0.05, // 5% of base reward
} as const;

// Creator Commission by Tier
export const CREATOR_COMMISSION_TIER = {
  [CREATOR_TIER.STARTER]: 5, // 5% (0-50 conversions)
  [CREATOR_TIER.PRO]: 7, // 7% (51-200)
  [CREATOR_TIER.ELITE]: 10, // 10% (201-1000)
  [CREATOR_TIER.PARTNER]: 12, // 12% (1000+)
  [CREATOR_TIER.AMBASSADOR]: 15, // 15% (5000+)
} as const;

// Ambassador Tier Thresholds
export const AMBASSADOR_THRESHOLDS = {
  [AMBASSADOR_TIER.BRONZE]: 0,
  [AMBASSADOR_TIER.SILVER]: 26,
  [AMBASSADOR_TIER.GOLD]: 101,
  [AMBASSADOR_TIER.PLATINUM]: 501,
  [AMBASSADOR_TIER.DIAMOND]: 5000,
} as const;

// Interfaces
export interface IReferralCode {
  _id: Types.ObjectId;
  code: string;
  type: ReferralType;
  ownerId: Types.ObjectId;
  ownerType: 'user' | 'merchant' | 'creator';
  companyId: string;
  isActive: boolean;
  isPublic: boolean;
  tier?: AmbassadorTier;
  totalReferrals: number;
  qualifiedReferrals: number;
  lifetimeEarnings: number;
  trustScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReferral {
  _id: Types.ObjectId;
  type: ReferralType;
  campaignId?: Types.ObjectId;
  referrerId: Types.ObjectId;
  refereeId: Types.ObjectId;
  referralCodeId: Types.ObjectId;
  firstTouch: { source: string; timestamp: Date } | null;
  lastTouch: { source: string; timestamp: Date } | null;
  touchpoints: Types.DocumentArray<ITouchpoint>;
  riskScore: number;
  riskFlags: string[];
  status: ReferralStatus;
  rewardAmount: number;
  rewardType: RewardType;
  coinType?: string;
  paidAt?: Date;
  companyId: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  qualifiedAt?: Date;
  rewardedAt?: Date;
}

export interface ITouchpoint {
  source: string;
  medium: string;
  timestamp: Date;
  ip?: string;
  deviceId?: string;
  userAgent?: string;
  location?: { lat: number; lng: number };
}

export interface IPayoutMethod {
  type: 'bank' | 'upi' | 'wallet';
  details: Record<string, unknown>;
  isDefault: boolean;
}

export interface ICreatorProfile {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  companyId: string;
  handle: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  tier: CreatorTier;
  totalViews: number;
  totalScans: number;
  totalClicks: number;
  totalInstalls: number;
  totalRegistrations: number;
  totalOrders: number;
  totalRevenue: number;
  pendingEarnings: number;
  approvedEarnings: number;
  paidEarnings: number;
  payoutEnabled: boolean;
  payoutMethods: IPayoutMethod[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreatorCollection {
  _id: Types.ObjectId;
  creatorId: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  items: ICollectionItem[];
  referralCodeId: Types.ObjectId;
  totalScans: number;
  totalConversions: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICollectionItem {
  type: 'product' | 'merchant' | 'service' | 'event' | 'guide';
  name: string;
  description?: string;
  imageUrl?: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

export interface ICampaign {
  _id: Types.ObjectId;
  type: ReferralType;
  companyId: string;
  name: string;
  description?: string;
  sponsorId?: Types.ObjectId;
  sponsorType?: 'merchant' | 'brand';
  budget?: number;
  spent?: number;
  referrerReward: {
    type: 'fixed' | 'percentage' | 'coins' | 'discount';
    value: number;
    coinType?: string;
  };
  refereeReward?: {
    type: 'fixed' | 'percentage' | 'coins' | 'discount';
    value: number;
    coinType?: string;
  };
  targetSegments?: string[];
  categories?: string[];
  companies?: string[];
  maxRewards?: number;
  maxRewardsPerUser?: number;
  minPurchaseAmount?: number;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAmbassadorTier {
  _id: Types.ObjectId;
  tier: AmbassadorTier;
  minReferrals: number;
  maxReferrals?: number;
  benefits: string[];
  bonusMultiplier: number;
  isActive: boolean;
}

// Fraud Engine Types
export interface FraudCheckInput {
  referrerId: string;
  refereeId: string;
  ip?: string;
  deviceId?: string;
  phone?: string;
  email?: string;
  bankAccount?: string;
  upiId?: string;
  referralCode: string;
  timestamp: Date;
}

export interface FraudCheckResult {
  riskScore: number;
  riskLevel: RiskLevel;
  flags: string[];
  recommendation: 'allow' | 'flag' | 'block';
  checks: FraudCheck[];
}

export interface FraudCheck {
  type: FraudCheckType;
  passed: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details?: string;
}

// Company IDs
export const COMPANY_IDS = {
  REZ: 'rez',
  CORPPERKS: 'corpperks',
  MYTALENT: 'mytalent',
  RIDZA: 'ridza',
  RISNAESTATE: 'risnaestate',
  RISACARE: 'risacare',
  AIRZY: 'airzy',
  BUZZLOCAL: 'buzzlocal',
  REZ_MEDIA: 'rez-media',
  MERCHANT_OS: 'merchant-os',
} as const;
export type CompanyId = typeof COMPANY_IDS[keyof typeof COMPANY_IDS];
