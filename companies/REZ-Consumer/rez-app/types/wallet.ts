// @ts-nocheck
/**
 * types/wallet.ts
 *
 * B02 FIX: Canonical wallet type definitions for the consumer frontend.
 * CoinType is now imported from @/types/rez-shared-types (which re-exports
 * from packages/shared-types/src/enums/index.ts). This eliminates the local
 * type duplication that violated architecture governance rules.
 *
 * Canonical values:
 *   'rez'      — Universal coin, usable anywhere on the platform
 *   'promo'    — Promotional coin, limited-time from campaigns
 *   'branded'  — Merchant-specific loyalty coin
 *   'prive'    — Privé exclusive coin (premium/elite tier)
 */

import { ImageSourcePropType } from 'react-native';
import { CoinType } from './enums/index';
import { colors } from '../constants/theme';

// ---------------------------------------------------------------------------
// Coin type literal — re-exported from canonical shared-types
// ---------------------------------------------------------------------------

/** B02: Re-exported from @/types/rez-shared-types (canonical source). */
export type { CoinType } from './rez-shared-types';

// ---------------------------------------------------------------------------
// WalletTransaction — per-transaction record in the wallet feed
// ---------------------------------------------------------------------------

export interface WalletTransaction {
  id: string;
  type: 'earned' | 'spent';
  coinType: CoinType;
  amount: number;
  currency: string;
  formattedAmount: string;
  description: string;
  timestamp: Date;
  status: string;
  merchantName?: string;
  orderId?: string;
  balanceAfter: number;
}

// ---------------------------------------------------------------------------
// DEFAULT_CURRENCY — single source of truth for currency symbol
// ---------------------------------------------------------------------------

export const DEFAULT_CURRENCY = 'RC';

// ---------------------------------------------------------------------------
// Per-coin-type display metadata (used by CoinDetailCard, CoinChip, etc.)
// ---------------------------------------------------------------------------

export interface CoinTypeInfo {
  /** Short display name shown on cards/chips */
  name: string;
  /** Primary text/icon color */
  color: string;
  /** Background tint for the coin icon container */
  backgroundColor: string;
  /** Amount text color (may differ from icon color for emphasis) */
  amountColor: string;
  /** Longer description shown on coin detail pages */
  description: string;
}

/**
 * B02: COIN_TYPES maps each backend coin type to its display metadata.
 * Used everywhere a coin's label/icon/color needs to be resolved from its type.
 *
 * Usage:
 *   const info = COIN_TYPES[coin.type] || COIN_TYPES.rez;
 *   // → { name: '...', color: '...', backgroundColor: '...', amountColor: '...', description: '...' }
 *
 * Colors sourced from @rez/brand-tokens
 */

export const COIN_TYPES: Record<CoinType, CoinTypeInfo> = {
  rez: {
    name: 'ReZ Coins',        // actual brand name injected at runtime via BRAND.COIN_NAME
    color: '#B45309',         // amberDeep
    backgroundColor: '#FFF9E6',
    amountColor: '#B45309',
    description: 'Universal rewards usable anywhere on the platform',
  },
  promo: {
    name: 'Promo Coins',
    color: '#EAB308',         // warningScale[500]
    backgroundColor: '#FEF9E7',
    amountColor: '#D97706',
    description: 'Limited-time bonus coins from campaigns (max 20% per bill)',
  },
  branded: {
    name: 'Branded Coins',
    color: colors.brand.indigo,         // brand.indigo
    backgroundColor: '#EEF2FF',
    amountColor: colors.brand.navyDark,
    description: 'Merchant-specific loyalty rewards — earn and redeem at specific stores',
  },
  prive: {
    name: 'Privé Coins',
    color: colors.brand.goldWarm,          // goldWarm / brand.goldBright
    backgroundColor: '#FFFBEB',
    amountColor: '#B8860B',
    description: 'Premium coins for elite members — exclusive perks and higher value',
  },
  cashback: {
    name: 'Cashback Coins',
    color: '#10B981',          // emerald
    backgroundColor: '#ECFDF5',
    amountColor: '#059669',
    description: 'Cashback earned from purchases',
  },
  referral: {
    name: 'Referral Coins',
    color: colors.brand.purple,          // purple
    backgroundColor: '#F5F3FF',
    amountColor: colors.brand.purpleDeep,
    description: 'Coins earned from referring friends',
  },
};

// ---------------------------------------------------------------------------
// CoinBalance — the canonical per-coin object used throughout the UI
// ---------------------------------------------------------------------------

/** Branded-coin details embedded inside a CoinBalance entry */
export interface CoinBrandedDetails {
  merchantId: string;
  merchantName: string;
  merchantLogo?: string;
  merchantColor?: string;
}

/** BrandedCoin item used in BrandedCoinsScreen */
export interface BrandedCoinItem {
  merchantId: string;
  merchantName: string;
  merchantLogo?: string;
  merchantColor?: string;
  amount: number;
}

/** Promo-coin campaign details embedded inside a CoinBalance entry */
export interface CoinPromoDetails {
  campaignId?: string;
  campaignName?: string;
  maxRedemptionPercentage: number;
  expiryDate: string;
}

/**
 * A single coin balance entry.
 *
 * B02: `type` is a literal union matching the backend COIN_TYPE_VALUES enum.
 * Previously the codebase had no central definition — `CoinBalance` was effectively
 * `unknown`, which let mismatched strings (e.g. 'wasil', 'cashback', 'reward') pass
 * TypeScript checks and silently fail at runtime.
 */
export interface CoinBalance {
  /** Unique identifier for this coin entry (e.g. 'rez-0', 'promo-0') */
  id: string;
  /** B02: Must be one of 'rez' | 'promo' | 'branded' | 'prive' | 'cashback' | 'referral' — never anything else */
  type: CoinType;
  name: string;
  amount: number;
  currency: string;
  formattedAmount: string;
  description?: string;
  iconPath?: ImageSourcePropType | number | string;
  backgroundColor: string;
  color: string;
  isActive: boolean;
  earnedDate?: Date | string;
  lastUsed?: Date | string;
  expiryDate?: Date | string;
  /** Human-readable countdown string for promo coins (e.g. "3 days left") */
  expiryCountdown?: string;
  /** For branded coins: which merchant issued this coin */
  brandedDetails?: CoinBrandedDetails;
  /** For promo coins: campaign metadata including max redemption % */
  promoDetails?: CoinPromoDetails;
  /** Legacy field — still read by WalletBalanceCard for pending-status checks */
  restrictions?: string[];
}

// ---------------------------------------------------------------------------
// WalletData — the complete wallet state returned by the backend
// ---------------------------------------------------------------------------

export interface SavingsInsights {
  totalSaved: number;
  thisMonth: number;
  avgPerVisit: number;
  lastCalculated?: Date | string;
}

export interface WalletData {
  userId: string;
  totalBalance: number;
  availableBalance: number;
  cashbackBalance: number;
  pendingRewards: number;
  currency: string;
  formattedTotalBalance: string;
  /** Transformed CoinBalance[] — aligned to backend coin types */
  coins: CoinBalance[];
  /** Raw branded-coin entries from the backend (separate from coins[]) */
  brandedCoins: unknown[];
  brandedCoinsTotal: number;
  savingsInsights: SavingsInsights;
  recentTransactions: unknown[];
  lastUpdated: Date | string;
  isActive: boolean;
  isFrozen: boolean;
  frozenReason?: string;
}

// ---------------------------------------------------------------------------
// WalletState — wraps WalletData with loading/error state
// ---------------------------------------------------------------------------

export type WalletErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'SERVER_ERROR'
  | 'UNAUTHORIZED'
  | 'WALLET_FROZEN'
  | 'FEATURE_DISABLED'
  | 'VELOCITY_LIMIT'
  | 'REAUTH_REQUIRED'
  | 'INSUFFICIENT_BALANCE'
  | 'UNKNOWN';

export interface WalletError {
  code: WalletErrorCode;
  message: string;
  details?: string;
  timestamp: Date;
  recoverable: boolean;
}

export interface WalletState {
  data: WalletData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: WalletError | null;
  lastFetched: Date | null;
}

// ---------------------------------------------------------------------------
// Re-exports for convenience (avoids breaking existing import sites)
// ---------------------------------------------------------------------------

/** @deprecated Use CoinBalance from this file directly */
export type { CoinBalance as OldCoinBalance };

/** @deprecated Use WalletBalanceCardProps from types/WalletBalanceCard.ts */
export interface WalletBalanceCardProps {
  coin: CoinBalance;
  onPress?: (coin: CoinBalance) => void;
  isLoading?: boolean;
  showChevron?: boolean;
  testID?: string;
}

/** Props for the wallet screen (wallet-screen.tsx) */
export interface WalletScreenProps {
  onNavigateBack?: () => void;
  onCoinPress?: (coin: CoinBalance) => void;
}
