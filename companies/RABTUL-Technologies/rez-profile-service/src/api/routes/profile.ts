import { Router, Request, Response } from 'express';
import { profileService } from '../../services/profile';
import { jwtAuthMiddleware, requireOwnership, internalAuthMiddleware, AuthenticatedRequest } from '../../middleware/auth';
import { generalLimiter, profileReadLimiter, profileWriteLimiter } from '../../middleware/rateLimiter';
import { validateUserIdParam, validateProfileUpdate, validateAddress, validatePaymentMethod } from '../../middleware/validation';
import { createServiceLogger } from '../../config/logger';

const logger = createServiceLogger('routes');
const profileRouter = Router();

// Mount rate limiters
profileRouter.use(generalLimiter);

// ─── Public Routes (Internal Service Only) ─────────────────────────────────────

// GET /profile/:userId - Get profile (requires auth or internal token)
profileRouter.get(
  '/:userId',
  profileReadLimiter,
  validateUserIdParam,
  async (req: Request, res: Response) => {
    try {
      const userId = String(req.params.userId);
      const profile = await profileService.getProfile(userId);

      if (!profile) {
        return res.status(404).json({ success: false, error: 'Profile not found' });
      }

      res.json({ success: true, data: profile });
    } catch (error) {
      logger.error('Get profile error', { error, userId: req.params.userId });
      res.status(500).json({ success: false, error: 'Failed to get profile' });
    }
  }
);

// PATCH /profile/:userId - Update profile (requires auth)
profileRouter.patch(
  '/:userId',
  profileWriteLimiter,
  validateUserIdParam,
  validateProfileUpdate,
  jwtAuthMiddleware,
  requireOwnership,
  async (req: Request, res: Response) => {
    try {
      const userId = String(req.params.userId);
      const updates = req.body;

      // Check if profile exists
      let profile = await profileService.getProfile(userId);
      if (!profile) {
        // Create profile if it doesn't exist
        profile = await profileService.createProfile(userId, updates);
        return res.status(201).json({ success: true, data: profile });
      }

      // Update existing profile
      const updated = await profileService.updateProfile(userId, updates);
      res.json({ success: true, data: updated });
    } catch (error) {
      logger.error('Update profile error', { error, userId: req.params.userId });
      res.status(500).json({ success: false, error: 'Failed to update profile' });
    }
  }
);

// ─── Preferences Routes ────────────────────────────────────────────────────────

// GET /profile/:userId/preferences - Get preferences
profileRouter.get(
  '/:userId/preferences',
  profileReadLimiter,
  validateUserIdParam,
  async (req: Request, res: Response) => {
    try {
      const userId = String(req.params.userId);
      const prefs = await profileService.getPreferences(userId);
      res.json({ success: true, data: prefs });
    } catch (error) {
      logger.error('Get preferences error', { error, userId: req.params.userId });
      res.status(500).json({ success: false, error: 'Failed to get preferences' });
    }
  }
);

// PATCH /profile/:userId/preferences - Update preferences
profileRouter.patch(
  '/:userId/preferences',
  profileWriteLimiter,
  validateUserIdParam,
  jwtAuthMiddleware,
  requireOwnership,
  async (req: Request, res: Response) => {
    try {
      const userId = String(req.params.userId);
      const updates = req.body;
      const prefs = await profileService.updatePreferences(userId, updates);
      res.json({ success: true, data: prefs });
    } catch (error) {
      logger.error('Update preferences error', { error, userId: req.params.userId });
      res.status(500).json({ success: false, error: 'Failed to update preferences' });
    }
  }
);

// ─── Address Routes ────────────────────────────────────────────────────────────

// GET /profile/:userId/addresses - Get addresses
profileRouter.get(
  '/:userId/addresses',
  profileReadLimiter,
  validateUserIdParam,
  async (req: Request, res: Response) => {
    try {
      const userId = String(req.params.userId);
      const addresses = await profileService.getAddresses(userId);
      res.json({ success: true, data: { addresses } });
    } catch (error) {
      logger.error('Get addresses error', { error, userId: req.params.userId });
      res.status(500).json({ success: false, error: 'Failed to get addresses' });
    }
  }
);

// POST /profile/:userId/addresses - Add address
profileRouter.post(
  '/:userId/addresses',
  profileWriteLimiter,
  validateUserIdParam,
  validateAddress,
  jwtAuthMiddleware,
  requireOwnership,
  async (req: Request, res: Response) => {
    try {
      const userId = String(req.params.userId);
      const addressData = req.body;
      const address = await profileService.addAddress(userId, addressData);
      res.status(201).json({ success: true, data: address });
    } catch (error) {
      logger.error('Add address error', { error, userId: req.params.userId });
      res.status(500).json({ success: false, error: 'Failed to add address' });
    }
  }
);

// DELETE /profile/:userId/addresses/:addressId - Remove address
profileRouter.delete(
  '/:userId/addresses/:addressId',
  profileWriteLimiter,
  jwtAuthMiddleware,
  requireOwnership,
  async (req: Request, res: Response) => {
    try {
      const userId = String(req.params.userId);
      const addressId = String(req.params.addressId);
      const removed = await profileService.removeAddress(userId, addressId);
      res.json({ success: true, removed });
    } catch (error) {
      logger.error('Remove address error', { error, userId: req.params.userId, addressId: req.params.addressId });
      res.status(500).json({ success: false, error: 'Failed to remove address' });
    }
  }
);

// ─── Payment Method Routes ────────────────────────────────────────────────────

// GET /profile/:userId/payment-methods - Get payment methods
profileRouter.get(
  '/:userId/payment-methods',
  profileReadLimiter,
  validateUserIdParam,
  async (req: Request, res: Response) => {
    try {
      const userId = String(req.params.userId);
      const methods = await profileService.getPaymentMethods(userId);
      res.json({ success: true, data: { methods } });
    } catch (error) {
      logger.error('Get payment methods error', { error, userId: req.params.userId });
      res.status(500).json({ success: false, error: 'Failed to get payment methods' });
    }
  }
);

// POST /profile/:userId/payment-methods - Add payment method
profileRouter.post(
  '/:userId/payment-methods',
  profileWriteLimiter,
  validateUserIdParam,
  validatePaymentMethod,
  jwtAuthMiddleware,
  requireOwnership,
  async (req: Request, res: Response) => {
    try {
      const userId = String(req.params.userId);
      const methodData = req.body;
      const method = await profileService.addPaymentMethod(userId, methodData);
      res.status(201).json({ success: true, data: method });
    } catch (error) {
      logger.error('Add payment method error', { error, userId: req.params.userId });
      res.status(500).json({ success: false, error: 'Failed to add payment method' });
    }
  }
);

// DELETE /profile/:userId/payment-methods/:methodId - Remove payment method
profileRouter.delete(
  '/:userId/payment-methods/:methodId',
  profileWriteLimiter,
  jwtAuthMiddleware,
  requireOwnership,
  async (req: Request, res: Response) => {
    try {
      const userId = String(req.params.userId);
      const methodId = String(req.params.methodId);
      const removed = await profileService.removePaymentMethod(userId, methodId);
      res.json({ success: true, removed });
    } catch (error) {
      logger.error('Remove payment method error', { error, userId: req.params.userId, methodId: req.params.methodId });
      res.status(500).json({ success: false, error: 'Failed to remove payment method' });
    }
  }
);

// ─── Tier Cache Route ─────────────────────────────────────────────────────────

// GET /profile/:userId/tier - Get cached tier
profileRouter.get(
  '/:userId/tier',
  profileReadLimiter,
  validateUserIdParam,
  async (req: Request, res: Response) => {
    try {
      const userId = String(req.params.userId);
      const tier = await profileService.getCachedTier(userId);
      res.json({ success: true, data: { tier: tier || null } });
    } catch (error) {
      logger.error('Get tier error', { error, userId: req.params.userId });
      res.status(500).json({ success: false, error: 'Failed to get tier' });
    }
  }
);

export { profileRouter };
