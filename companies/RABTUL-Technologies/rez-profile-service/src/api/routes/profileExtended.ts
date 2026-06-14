/**
 * Profile Routes - Extended with REE Integration
 */

import { Router } from 'express';
import { profileService } from '../../services/profileExtended';
import { reeClient } from '../../services/reeClient';

export const profileRouter = Router();

// ============================================
// PROFILE
// ============================================

// GET /profile/:userId - Get profile with REE data
profileRouter.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  // Get profile with REE enrichment
  const profile = await profileService.getProfileExtended(userId);

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  res.json(profile);
});

// PATCH /profile/:userId - Update profile
profileRouter.patch('/:userId', async (req, res) => {
  const { userId } = req.params;
  const updates = req.body;

  const profile = profileService.updateProfile(userId, updates);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  res.json(profile);
});

// ============================================
// TIER & FEATURES (REE)
// ============================================

// GET /profile/:userId/tier - Get user tier
profileRouter.get('/:userId/tier', async (req, res) => {
  const { userId } = req.params;

  try {
    const tier = await profileService.getUserTier(userId);
    res.json({ tier });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tier' });
  }
});

// GET /profile/:userId/features - Get user features from REE
profileRouter.get('/:userId/features', async (req, res) => {
  const { userId } = req.params;

  try {
    const profile = profileService.getProfile(userId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const features = await reeClient.getUserFeatures(profile.lifetimeSpend || 0);
    res.json({ features });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get features' });
  }
});

// GET /profile/:userId/tiers - Get all user tiers
profileRouter.get('/info/tiers', async (req, res) => {
  try {
    const tiers = await reeClient.getAllUserTiers();
    res.json({ tiers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tiers' });
  }
});

// ============================================
// CASHBACK (REE)
// ============================================

// GET /profile/:userId/cashback-preview - Preview cashback for amount
profileRouter.get('/:userId/cashback-preview', async (req, res) => {
  const { userId } = req.params;
  const { amount } = req.query;

  if (!amount || isNaN(parseFloat(amount as string))) {
    return res.status(400).json({ error: 'Amount required' });
  }

  try {
    const preview = await profileService.previewCashback(userId, parseFloat(amount as string));
    if (!preview) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json({ preview });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate cashback' });
  }
});

// POST /profile/:userId/transaction - Record transaction and get rewards
profileRouter.post('/:userId/transaction', async (req, res) => {
  const { userId } = req.params;
  const { amount, merchantId } = req.body;

  if (!amount || !merchantId) {
    return res.status(400).json({ error: 'Amount and merchantId required' });
  }

  try {
    const result = await profileService.recordTransaction(userId, amount, merchantId);
    if (!result) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json({ rewards: result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record transaction' });
  }
});

// ============================================
// SOCIAL SHARING (REE)
// ============================================

// GET /profile/:userId/social/:platform/can-share - Check if can share
profileRouter.get('/:userId/social/:platform/can-share', async (req, res) => {
  const { userId, platform } = req.params;

  try {
    const result = await profileService.canSocialShare(userId, platform);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check social share' });
  }
});

// POST /profile/:userId/social/:platform/share - Record social share
profileRouter.post('/:userId/social/:platform/share', async (req, res) => {
  const { userId, platform } = req.params;
  const { postId } = req.body;

  try {
    const result = await profileService.recordSocialShare(userId, platform, postId || 'unknown');
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to record social share' });
  }
});

// ============================================
// PREFERENCES
// ============================================

// GET /profile/:userId/preferences - Get preferences
profileRouter.get('/:userId/preferences', (req, res) => {
  const { userId } = req.params;
  const prefs = profileService.getPreferences(userId);
  res.json(prefs);
});

// PATCH /profile/:userId/preferences - Update preferences
profileRouter.patch('/:userId/preferences', (req, res) => {
  const { userId } = req.params;
  const updates = req.body;

  const prefs = profileService.updatePreferences(userId, updates);
  res.json(prefs);
});

// ============================================
// ADDRESSES
// ============================================

// GET /profile/:userId/addresses - Get addresses
profileRouter.get('/:userId/addresses', (req, res) => {
  const { userId } = req.params;
  const addresses = profileService.getAddresses(userId);
  res.json({ addresses });
});

// POST /profile/:userId/addresses - Add address
profileRouter.post('/:userId/addresses', (req, res) => {
  const { userId } = req.params;
  const address = profileService.addAddress(userId, req.body);
  res.status(201).json(address);
});

// PATCH /profile/:userId/addresses/:addressId - Update address
profileRouter.patch('/:userId/addresses/:addressId', (req, res) => {
  const { userId, addressId } = req.params;
  const updated = profileService.updateAddress(userId, addressId, req.body);

  if (!updated) {
    return res.status(404).json({ error: 'Address not found' });
  }
  res.json(updated);
});

// DELETE /profile/:userId/addresses/:addressId - Remove address
profileRouter.delete('/:userId/addresses/:addressId', (req, res) => {
  const { userId, addressId } = req.params;
  const removed = profileService.removeAddress(userId, addressId);

  if (!removed) {
    return res.status(404).json({ error: 'Address not found' });
  }
  res.json({ success: true });
});

// ============================================
// PAYMENT METHODS
// ============================================

// GET /profile/:userId/payment-methods - Get payment methods
profileRouter.get('/:userId/payment-methods', (req, res) => {
  const { userId } = req.params;
  const methods = profileService.getPaymentMethods(userId);
  res.json({ methods });
});

// POST /profile/:userId/payment-methods - Add payment method
profileRouter.post('/:userId/payment-methods', (req, res) => {
  const { userId } = req.params;
  const method = profileService.addPaymentMethod(userId, req.body);
  res.status(201).json(method);
});

// DELETE /profile/:userId/payment-methods/:methodId - Remove payment method
profileRouter.delete('/:userId/payment-methods/:methodId', (req, res) => {
  const { userId, methodId } = req.params;
  const removed = profileService.removePaymentMethod(userId, methodId);

  if (!removed) {
    return res.status(404).json({ error: 'Payment method not found' });
  }
  res.json({ success: true });
});
