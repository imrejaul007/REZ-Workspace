// Tier Configuration
export const TIER_THRESHOLDS = {
  BRONZE: 0,
  SILVER: 1000,
  GOLD: 5000,
  PLATINUM: 15000,
} as const;

export const TIER_MULTIPLIERS = {
  BRONZE: 1.0,
  SILVER: 1.25,
  GOLD: 1.5,
  PLATINUM: 2.0,
} as const;

export const TIER_NAMES = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'] as const;
export type TierName = (typeof TIER_NAMES)[number];

// Points Configuration
export const POINTS_PER_RUPEE = 1; // 1 point per ₹ spent
export const MINIMUM_SPEND_FOR_POINTS = 10; // Minimum ₹ spend to earn points
export const MAX_POINTS_PER_TRANSACTION = 10000;

// Expiry Configuration
export const POINTS_EXPIRY_MONTHS = 12; // Points expire after 12 months
export const EXPIRY_CHECK_CRON = '0 0 * * *'; // Daily at midnight

// Birthday Bonus
export const BIRTHDAY_BONUS_POINTS = 500;
export const BIRTHDAY_BONUS_WINDOW_DAYS = 7; // Bonus available 7 days before/after birthday

// Referral Rewards
export const REFERRED_USER_BONUS_POINTS = 200;
export const REFERRER_BONUS_POINTS = 100;
export const REFERRAL_MIN_SPEND = 500; // Referred user must spend this much for referrer bonus

// Redemption Multipliers by Tier
export const REDEMPTION_RATIO = 100; // 100 points = ₹1 redemption
export const MAX_REDEMPTION_PERCENTAGE = {
  BRONZE: 25,
  SILVER: 50,
  GOLD: 75,
  PLATINUM: 100,
} as const;

// Welcome Bonus
export const WELCOME_BONUS_POINTS = 100;

// Transaction Types
export const TRANSACTION_TYPES = {
  EARN: 'EARN',
  REDEEM: 'REDEEM',
  EXPIRE: 'EXPIRE',
  ADJUST: 'ADJUST',
  BONUS: 'BONUS',
  REFERRAL: 'REFERRAL',
  BIRTHDAY: 'BIRTHDAY',
} as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[keyof typeof TRANSACTION_TYPES];

// Status Types
export const STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  INSUFFICIENT_POINTS: 'Insufficient points for redemption',
  INVALID_TIER: 'Invalid tier specified',
  USER_NOT_FOUND: 'User not found',
  PROGRAM_NOT_FOUND: 'Loyalty program not found',
  POINTS_EXPIRED: 'Points have expired',
  INVALID_REDEMPTION_VALUE: 'Invalid redemption value',
  RESTAURANT_NOT_PARTICIPATING: 'Restaurant does not participate in this program',
  ALREADY_REDEEMED_TODAY: 'Daily redemption limit reached',
} as const;
