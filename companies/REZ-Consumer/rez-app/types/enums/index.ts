/**
 * REZ App Enums
 * Central enum definitions for the app
 */

// Coin Types
export enum CoinType {
  PROMO = 'PROMO',
  BRANDED = 'BRANDED',
  PRIVE = 'PRIVE',
  CASHBACK = 'CASHBACK',
  REFERRAL = 'REFERRAL',
  REZ = 'REZ',
}

export const COIN_TYPE_VALUES = [
  CoinType.PROMO,
  CoinType.BRANDED,
  CoinType.PRIVE,
  CoinType.CASHBACK,
  CoinType.REFERRAL,
  CoinType.REZ,
] as const;

export function normalizeCoinType(
  type: string | null | undefined,
  fallback: CoinType = CoinType.REZ,
): CoinType {
  if (!type) return fallback;
  const normalized = type.toLowerCase().trim();
  const aliases: Record<string, CoinType> = {
    nuqta: CoinType.REZ,
    karma_points: CoinType.REZ,
    rez_coins: CoinType.REZ,
    promo: CoinType.PROMO,
    branded: CoinType.BRANDED,
    prive: CoinType.PRIVE,
    cashback: CoinType.CASHBACK,
    referral: CoinType.REFERRAL,
  };
  return aliases[normalized] ?? fallback;
}

export function isCanonicalCoinType(value: string): value is CoinType {
  return (COIN_TYPE_VALUES as readonly string[]).includes(value);
}

export function normalizeCoinTypeAs<T extends CoinType>(
  type: string | null | undefined,
  assertType: T,
): T {
  const normalized = normalizeCoinType(type, assertType);
  return normalized === assertType ? assertType : assertType;
}

// User Roles
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MERCHANT = 'merchant',
  DRIVER = 'driver',
  SUPPORT = 'support',
}

// Gender
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

// Order Status
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

// Payment Status
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

// Payment Method
export enum PaymentMethod {
  UPI = 'upi',
  CARD = 'card',
  WALLET = 'wallet',
  NET_BANKING = 'net_banking',
  COD = 'cod',
}

// Payment Gateway
export enum PaymentGateway {
  RAZORPAY = 'razorpay',
  STRIPE = 'stripe',
  PHONEPE = 'phonepe',
  PAYTM = 'paytm',
}

// Coin Transaction Type
export enum CoinTransactionType {
  EARN = 'earn',
  BURN = 'burn',
  TRANSFER = 'transfer',
  EXPIRE = 'expire',
  REVERSAL = 'reversal',
  BONUS = 'bonus',
}

// Campaign Status
export enum CampaignStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ENDED = 'ended',
  DRAFT = 'draft',
}

// Campaign Channel
export enum CampaignChannel {
  PUSH = 'push',
  SMS = 'sms',
  EMAIL = 'email',
  IN_APP = 'in_app',
  QR = 'qr',
}

// Notification Type
export enum NotificationType {
  ORDER_UPDATE = 'order_update',
  PAYMENT = 'payment',
  PROMO = 'promo',
  REMINDER = 'reminder',
  SYSTEM = 'system',
}

// Notification Channel
export enum NotificationChannel {
  PUSH = 'push',
  SMS = 'sms',
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
}

// Offer Type
export enum OfferType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
  BUY_ONE_GET_ONE = 'bogo',
  FREE_DELIVERY = 'free_delivery',
}

// Discount Type
export enum DiscountType {
  COUPON = 'coupon',
  CAMPAIGN = 'campaign',
  LOYALTY = 'loyalty',
  REFERRAL = 'referral',
}

// Finance Transaction Type
export enum FinanceTransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
  TRANSFER = 'transfer',
}

// Finance Transaction Status
export enum FinanceTransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Verification Status
export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

// Jewelry Style
export enum JewelryStyle {
  TRADITIONAL = 'traditional',
  CONTEMPORARY = 'contemporary',
  MINIMALIST = 'minimalist',
  BRIDAL = 'bridal',
}

// Theme
export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

// Referral Tier
export enum ReferralTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
}

// REZ Plus Tier
export enum RezPlusTier {
  FREE = 'free',
  PLUS = 'plus',
  PREMIUM = 'premium',
}

// PRIVE Tier
export enum PriveTier {
  BASIC = 'basic',
  ELITE = 'elite',
  VIP = 'vip',
}

// Loyalty Tier
export enum LoyaltyTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
}

// Location Source
export enum LocationSource {
  GPS = 'gps',
  IP = 'ip',
  MANUAL = 'manual',
}

// Document Type
export enum DocumentType {
  AADHAR = 'aadhar',
  PAN = 'pan',
  VOTER_ID = 'voter_id',
  PASSPORT = 'passport',
  DRIVING_LICENSE = 'driving_license',
}

// Profession Type
export enum ProfessionType {
  EMPLOYED = 'employed',
  SELF_EMPLOYED = 'self_employed',
  BUSINESS_OWNER = 'business_owner',
  STUDENT = 'student',
  RETIRED = 'retired',
  UNEMPLOYED = 'unemployed',
}

// Service Type
export enum ServiceType {
  DELIVERY = 'delivery',
  PICKUP = 'pickup',
  DINE_IN = 'dine_in',
  TAKEAWAY = 'takeaway',
}

// Event Type
export enum EventType {
  ORDER = 'order',
  PAYMENT = 'payment',
  REFERRAL = 'referral',
  SIGNUP = 'signup',
  REVIEW = 'review',
}

// Transaction Status
export enum TransactionStatus {
  SUCCESS = 'success',
  PENDING = 'pending',
  FAILED = 'failed',
}

// Coin Priority (for display ordering)
export const COIN_PRIORITY: Record<CoinType, number> = {
  [CoinType.REZ]: 1,
  [CoinType.CASHBACK]: 2,
  [CoinType.REFERRAL]: 3,
  [CoinType.PROMO]: 4,
  [CoinType.BRANDED]: 5,
  [CoinType.PRIVE]: 6,
};
