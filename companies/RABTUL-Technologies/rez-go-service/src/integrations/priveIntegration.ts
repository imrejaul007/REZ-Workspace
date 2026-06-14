/**
 * REZ Prive Integration
 * Connect REZ Go cashback to REZ Prive eligibility scoring
 */

import axios, { AxiosError } from 'axios';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';

export interface PriveEligibility {
  isEligible: boolean;
  score: number;
  tier: 'none' | 'entry' | 'signature' | 'elite';
  accessState: string;
}

export interface PriveCoinReward {
  amount: number;
  type: 'base' | 'bonus' | 'streak';
  tierMultiplier: number;
}

/**
 * Get user Prive eligibility
 */
export async function getPriveEligibility(userId: string): Promise<PriveEligibility | null> {
  try {
    const response = await axios.get(`${config.PRIVE_SERVICE_URL}/api/eligibility`, {
      headers: {
        'X-User-Id': userId,
        'X-Internal-Token': config.INTERNAL_SERVICE_TOKEN,
      },
      timeout: 5000,
    });

    return {
      isEligible: response.data.isEligible,
      score: response.data.score,
      tier: response.data.tier,
      accessState: response.data.accessState,
    };
  } catch (error) {
    const err = error as AxiosError;
    logger.warn('Failed to get Prive eligibility', { userId, error: err.message });
    return null;
  }
}

/**
 * Calculate Prive coin bonus for REZ Go transactions
 */
export function calculatePriveBonus(
  baseAmount: number,
  priveTier: string
): PriveCoinReward {
  const tierMultipliers: Record<string, number> = {
    elite: 2.0,
    signature: 1.5,
    entry: 1.2,
    none: 1.0,
  };

  const multiplier = tierMultipliers[priveTier] || 1.0;

  return {
    amount: Math.round(baseAmount * multiplier),
    type: 'bonus',
    tierMultiplier: multiplier,
  };
}

/**
 * Record Prive engagement signal
 */
export async function recordPriveEngagement(
  userId: string,
  action: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await axios.post(
      `${config.PRIVE_SERVICE_URL}/api/engagement/signal`,
      {
        action,
        metadata: {
          source: 'rez-go',
          ...metadata,
        },
      },
      {
        headers: {
          'X-User-Id': userId,
          'X-Internal-Token': config.INTERNAL_SERVICE_TOKEN,
        },
        timeout: 5000,
      }
    );
  } catch (error) {
    const err = error as AxiosError;
    logger.warn('Failed to record Prive engagement', { userId, action, error: err.message });
  }
}

/**
 * Get Prive campaign offers for REZ Go
 */
export async function getPriveOffers(userId: string): Promise<unknown[]> {
  try {
    const response = await axios.get(`${config.PRIVE_SERVICE_URL}/api/offers`, {
      headers: {
        'X-User-Id': userId,
        'X-Internal-Token': config.INTERNAL_SERVICE_TOKEN,
      },
      timeout: 5000,
    });

    return response.data.offers || [];
  } catch (error) {
    const err = error as AxiosError;
    logger.warn('Failed to get Prive offers', { userId, error: err.message });
    return [];
  }
}
