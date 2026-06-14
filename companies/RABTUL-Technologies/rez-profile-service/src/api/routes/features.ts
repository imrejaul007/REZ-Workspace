/**
 * Features Routes - REE Integration
 *
 * Exposes REE feature flags to Profile Service
 */

import { Router } from 'express';
import { reeClient, REEUserFeatures } from '../../services/reeClient';
import { USER_TIERS, MERCHANT_TIERS } from '../../services/featureControl';

export const featuresRouter = Router();

/**
 * GET /features/tiers/user
 * Get all user tiers from REE
 */
featuresRouter.get('/tiers/user', async (req, res) => {
  try {
    const tiers = await reeClient.getAllUserTiers();
    res.json({ tiers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tiers' });
  }
});

/**
 * GET /features/tiers/merchant
 * Get all merchant tiers from REE
 */
featuresRouter.get('/tiers/merchant', async (req, res) => {
  try {
    const tiers = await reeClient.getAllMerchantTiers();
    res.json({ tiers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tiers' });
  }
});

/**
 * POST /features/user
 * Check user features from REE
 */
featuresRouter.post('/user', async (req, res) => {
  const { userId, lifetimeSpend, features } = req.body;

  try {
    if (features && Array.isArray(features)) {
      // Return specific features
      const all = await reeClient.getUserFeatures(lifetimeSpend);
      const result: Record<string, boolean | number | string | undefined> = {};
      for (const feature of features) {
        result[feature] = all?.[feature as keyof REEUserFeatures];
      }
      res.json({ features: result });
    } else {
      // Return all features
      const result = await reeClient.getUserFeatures(lifetimeSpend);
      res.json({ features: result });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to get features' });
  }
});

/**
 * POST /features/merchant
 * Check merchant features from REE
 */
featuresRouter.post('/merchant', async (req, res) => {
  const { merchantId, tier, features } = req.body;

  try {
    if (features && Array.isArray(features)) {
      const all = await reeClient.getMerchantFeatures(tier);
      const result: Record<string, unknown> = {};
      for (const feature of features) {
        result[feature] = all?.[feature];
      }
      res.json({ features: result });
    } else {
      const result = await reeClient.getMerchantFeatures(tier);
      res.json({ features: result });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to get features' });
  }
});

/**
 * POST /features/cashback
 * Calculate user cashback from REE
 */
featuresRouter.post('/cashback', async (req, res) => {
  const { lifetimeSpend, amount } = req.body;

  try {
    const result = await reeClient.calculateCashback(lifetimeSpend, amount);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate cashback' });
  }
});

/**
 * POST /features/commission
 * Calculate merchant commission from REE
 */
featuresRouter.post('/commission', async (req, res) => {
  const { tier, amount } = req.body;

  try {
    const result = await reeClient.getMerchantCommission(tier, amount);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate commission' });
  }
});

/**
 * POST /features/karma
 * Get karma info from REE
 */
featuresRouter.post('/karma', async (req, res) => {
  const { userId } = req.body;

  try {
    const result = await reeClient.getKarmaInfo(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get karma info' });
  }
});

/**
 * POST /features/social-check
 * Check if user can social share
 */
featuresRouter.post('/social-check', async (req, res) => {
  const { lifetimeSpend, platform } = req.body;

  try {
    const result = await reeClient.canSocialShare(lifetimeSpend, platform);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check social sharing' });
  }
});
