/**
 * Savings Referral Integration
 *
 * Tracks referral bonuses in the savings module.
 * Records referral earnings as savings for the referrer.
 */

import { recordSavings } from './savingsService';
import { createServiceLogger } from '../config/logger';

const logger = createServiceLogger('savings:referral');

/**
 * Record referral bonus as savings for the referrer
 * Called when a referred user completes their first transaction
 */
export async function recordReferralSavings(params: {
  referrerId: string;
  refereeId: string;
  referralCode: string;
  bonusAmount: number;
  description?: string;
}): Promise<void> {
  const { referrerId, refereeId, referralCode, bonusAmount, description } = params;

  try {
    // Record the referral bonus as savings
    await recordSavings({
      userId: referrerId,
      type: 'referral',
      amount: bonusAmount,
      source: `referral_${referralCode}`,
      description: description || `Referral bonus for inviting user ${refereeId}`,
      category: 'referral',
    });

    logger.info('Referral savings recorded', {
      referrerId,
      refereeId,
      referralCode,
      bonusAmount,
    });
  } catch (error) {
    logger.error('Failed to record referral savings', {
      referrerId,
      refereeId,
      referralCode,
      bonusAmount,
      error,
    });
    // Don't throw - savings recording failure shouldn't break referral flow
  }
}

/**
 * Get referral savings summary for a user
 */
export async function getReferralSavingsSummary(userId: string): Promise<{
  totalReferralSavings: number;
  referralCount: number;
  averageBonus: number;
}> {
  const { SavingsEntry } = await import('../models/Savings');

  const referrals = await SavingsEntry.aggregate([
    {
      $match: {
        userId: userId,
        type: 'referral',
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const total = referrals[0]?.total || 0;
  const count = referrals[0]?.count || 0;

  return {
    totalReferralSavings: total,
    referralCount: count,
    averageBonus: count > 0 ? Math.round(total / count) : 0,
  };
}

/**
 * Calculate potential referral earnings
 */
export function calculateReferralPotential(
  remainingReferrals: number,
  averageBonus: number = 500,
): number {
  return remainingReferrals * averageBonus;
}
