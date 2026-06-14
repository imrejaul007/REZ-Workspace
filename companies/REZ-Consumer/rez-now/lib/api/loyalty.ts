/**
 * Loyalty API for Order Flow
 *
 * This module provides the loyalty recording functions used by order.ts.
 * Re-exports from the unified loyalty integration.
 */

import { logger } from '@/lib/utils/logger';

export { recordVisit } from '@/lib/loyalty';
export type { RecordVisitOptions, RecordVisitResult, LoyaltyEvent, UnlockedMilestone } from '@/lib/loyalty';

// ── Additional Loyalty Functions ──────────────────────────────────────────────

export interface LoyaltyStatus {
  userId: string;
  stamps: number;
  tier: string;
  canRedeem: boolean;
  activeReward: {
    code: string;
    description: string;
    expiresAt: string;
  } | null;
}

export interface RedeemResult {
  success: boolean;
  rewardCode: string;
  description: string;
  expiresAt: string;
  alreadyActive?: boolean;
  error?: string;
}

/**
 * Redeem stamps for a reward
 * Called from LoyaltyWidget when user wants to redeem their stamps
 */
export async function redeemStamps(
  storeSlug: string
): Promise<RedeemResult> {
  try {
    const response = await fetch('/api/loyalty/redeem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ storeSlug }),
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        rewardCode: '',
        description: '',
        expiresAt: '',
        error: data.message || 'Failed to redeem stamps',
      };
    }

    return {
      success: true,
      rewardCode: data.data.rewardCode,
      description: data.data.description,
      expiresAt: data.data.expiresAt,
    };
  } catch (error) {
    logger.error('Error redeeming stamps:', { error });
    return {
      success: false,
      rewardCode: '',
      description: '',
      expiresAt: '',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}
