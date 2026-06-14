/**
 * @fileoverview Consolidated transaction type definitions.
 *
 * CV-31 FIX: Previously there were 4 parallel transaction type definitions:
 *   1. PointTransaction       — services/pointsApi.ts
 *   2. PointsTransaction     — services/loyaltyApi.ts
 *   3. EarningTransaction     — services/earningsApi.ts
 *   4. TransactionResponse    — services/walletApi.ts (kept separate — includes balance tracking)
 *
 * These served different domains (points/coins, loyalty, earnings, wallet) but used
 * inconsistent field names (id vs _id, type values, status shapes). This file provides
 * a canonical type per domain. Wallet's TransactionResponse is kept separate because
 * it includes balanceBefore/balanceAfter and is a different API shape.
 *
 * All consumer app services should import from here. Backend alignment is tracked in
 * docs/Gaps/15-VERIFIED-FIX-STATUS.md (CV-31).
 */

// ─── Shared base ────────────────────────────────────────────────────────────────

/** Fields common to all transaction types across domains */
export interface BaseTransaction {
  id: string;
  description: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

// ─── Points / Coins domain ──────────────────────────────────────────────────────

export type PointSource =
  | 'purchase'
  | 'review'
  | 'referral'
  | 'daily_login'
  | 'achievement'
  | 'challenge'
  | 'spin_wheel'
  | 'scratch_card'
  | 'quiz'
  | 'bill_upload'
  | 'video_upload'
  | 'social_share'
  | 'bonus'
  | 'admin';

export type PointType = 'earned' | 'spent' | 'expired' | 'refunded' | 'bonus';

export type PointStatus = 'pending' | 'completed' | 'cancelled' | 'expired';

/**
 * PointTransaction — canonical type for the points/coins domain.
 * Mirrors the shape returned by /points/transactions on the backend.
 */
export interface PointTransaction extends BaseTransaction {
  id: string;
  userId: string;
  type: PointType;
  amount: number;
  source: PointSource;
  description: string;
  metadata?: {
    orderId?: string;
    reviewId?: string;
    referralId?: string;
    achievementId?: string;
    challengeId?: string;
    productId?: string;
    storeId?: string;
    [key: string]: unknown;
  };
  status: PointStatus;
  expiresAt?: string;
  completedAt?: string;
}

// ─── Loyalty domain ─────────────────────────────────────────────────────────────

export type LoyaltyTransactionType = 'earned' | 'redeemed' | 'expired' | 'adjusted';

export type LoyaltyEntityType = 'order' | 'review' | 'referral' | 'reward';

/**
 * PointsTransaction — canonical type for the loyalty domain.
 * Mirrors the shape returned by /loyalty/transactions on the backend.
 * NOTE: This is a simplified shape compared to PointTransaction. If a richer
 * transaction shape is needed, use PointTransaction instead.
 */
export interface LoyaltyTransaction extends BaseTransaction {
  _id: string;
  type: LoyaltyTransactionType;
  points: number;
  description: string;
  relatedEntity?: {
    type: LoyaltyEntityType;
    id: string;
  };
}

// ─── Earnings domain ────────────────────────────────────────────────────────────

/**
 * EarningTransaction — canonical type for the consolidated earnings domain.
 * Mirrors the shape returned by /earnings/history on the backend.
 */
export interface EarningTransaction extends BaseTransaction {
  _id: string;
  type: string;
  source: string;
  category: string;
  amount: number;
  description: string;
}
