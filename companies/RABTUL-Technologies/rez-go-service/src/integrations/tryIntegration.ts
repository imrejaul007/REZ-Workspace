/**
 * REZ Try Integration
 * Connect REZ Go with REZ Try for trial products
 */

import axios, { AxiosError } from 'axios';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';

export interface TrialProduct {
  trialId: string;
  merchantId: string;
  merchantName: string;
  title: string;
  category: string;
  coinReward: number;
}

/**
 * Check if a product has an associated trial
 */
export async function checkProductTrial(productId: string): Promise<TrialProduct | null> {
  try {
    const response = await axios.get(`${config.TRY_SERVICE_URL}/api/trials/check-product/${productId}`, {
      headers: {
        'X-Internal-Token': config.INTERNAL_SERVICE_TOKEN,
      },
      timeout: 5000,
    });

    if (response.data.trial) {
      return {
        trialId: response.data.trial._id,
        merchantId: response.data.trial.merchantId,
        merchantName: response.data.trial.merchantName,
        title: response.data.trial.title,
        category: response.data.trial.category,
        coinReward: response.data.trial.coinReward || 10,
      };
    }

    return null;
  } catch (error) {
    const err = error as AxiosError;
    logger.warn('Failed to check product trial', { productId, error: err.message });
    return null;
  }
}

/**
 * Record trial conversion from REZ Go
 */
export async function recordTrialConversion(
  userId: string,
  trialId: string,
  sessionId: string
): Promise<void> {
  try {
    await axios.post(
      `${config.TRY_SERVICE_URL}/api/conversions/record`,
      {
        userId,
        trialId,
        sessionId,
        source: 'rez-go',
      },
      {
        headers: {
          'X-Internal-Token': config.INTERNAL_SERVICE_TOKEN,
        },
        timeout: 5000,
      }
    );

    logger.info('Recorded trial conversion', { userId, trialId, sessionId });
  } catch (error) {
    const err = error as AxiosError;
    logger.warn('Failed to record trial conversion', { userId, trialId, error: err.message });
  }
}

/**
 * Get trial recommendations based on cart items
 */
export async function getTrialRecommendations(
  userId: string,
  cartItems: Array<{ productId: string; category: string }>
): Promise<TrialProduct[]> {
  try {
    const response = await axios.post(
      `${config.TRY_SERVICE_URL}/api/recommendations/trials`,
      {
        userId,
        cartItems,
      },
      {
        headers: {
          'X-Internal-Token': config.INTERNAL_SERVICE_TOKEN,
        },
        timeout: 5000,
      }
    );

    return response.data.trials || [];
  } catch (error) {
    const err = error as AxiosError;
    logger.warn('Failed to get trial recommendations', { userId, error: err.message });
    return [];
  }
}
