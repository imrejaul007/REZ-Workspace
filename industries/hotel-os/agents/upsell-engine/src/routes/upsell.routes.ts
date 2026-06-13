import { Router, Request, Response, NextFunction } from 'express';
import { upsellService, pricingService } from '../services';
import {
  validateOfferContext,
  validateOfferResponse,
  validatePricingContext,
  validateUpgradePricing,
} from '../schemas/twin.schemas';

const router = Router();

// Validation middleware helper
const validate = (validator: (data: unknown) => boolean) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const valid = validator(req.body);
    if (!valid) {
      const errors = (validator as any).errors;
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
      return;
    }
    next();
  };
};

// ============ OFFER ROUTES ============

/**
 * POST /api/upsell/check-eligibility
 * Check if a guest is eligible for upsell offers
 */
router.post(
  '/check-eligibility',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { guest_id, room_id } = req.body;
      if (!guest_id || !room_id) {
        res.status(400).json({
          success: false,
          error: 'guest_id and room_id are required',
        });
        return;
      }

      const eligibility = await upsellService.checkEligibility(guest_id, room_id);
      res.json({
        success: true,
        data: eligibility,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/upsell/offers
 * Generate personalized upsell offers for a guest
 */
router.post(
  '/offers',
  validate(validateOfferContext),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const offers = await upsellService.generateOffers(req.body);
      res.status(201).json({
        success: true,
        data: offers,
        message: `Generated ${offers.length} upsell offers`,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }
      next(error);
    }
  }
);

/**
 * GET /api/upsell/offers/:guest_id
 * Get active offers for a guest
 */
router.get(
  '/offers/:guest_id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const offers = await upsellService.getActiveOffers(req.params.guest_id);
      res.json({
        success: true,
        data: offers,
        count: offers.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/upsell/offers/:offer_id/respond
 * Respond to an upsell offer (accept/decline)
 */
router.post(
  '/offers/:offer_id/respond',
  validate(validateOfferResponse),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { response } = req.body;
      const offer = await upsellService.respondToOffer(req.params.offer_id, response);
      if (!offer) {
        res.status(404).json({
          success: false,
          error: 'Offer not found',
        });
        return;
      }
      res.json({
        success: true,
        data: offer,
        message: `Offer ${response}`,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('already responded')) {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }
      next(error);
    }
  }
);

/**
 * POST /api/upsell/offers/:offer_id/shown
 * Mark an offer as shown to the guest
 */
router.post(
  '/offers/:offer_id/shown',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await upsellService.markOfferShown(req.params.offer_id);
      res.json({
        success: true,
        message: 'Offer marked as shown',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============ PRICING ROUTES ============

/**
 * POST /api/pricing/calculate
 * Calculate dynamic pricing for a room
 */
router.post(
  '/pricing/calculate',
  validate(validatePricingContext),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const decision = await pricingService.calculateDynamicPricing(req.body);
      res.json({
        success: true,
        data: decision,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }
      next(error);
    }
  }
);

/**
 * POST /api/pricing/upgrade
 * Optimize upgrade pricing for a guest
 */
router.post(
  '/pricing/upgrade',
  validate(validateUpgradePricing),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { guest_id, current_room_id, target_room_type } = req.body;
      const offer = await pricingService.optimizeUpgradePricing(
        guest_id,
        current_room_id,
        target_room_type
      );
      res.status(201).json({
        success: true,
        data: offer,
        message: 'Upgrade offer generated',
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }
      next(error);
    }
  }
);

/**
 * POST /api/pricing/bundle
 * Calculate bundle pricing for packages
 */
router.post(
  '/pricing/bundle',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { guest_id, items } = req.body;
      if (!guest_id || !items || !Array.isArray(items)) {
        res.status(400).json({
          success: false,
          error: 'guest_id and items array are required',
        });
        return;
      }

      const bundlePricing = await pricingService.calculateBundlePricing(guest_id, items);
      res.json({
        success: true,
        data: bundlePricing,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }
      next(error);
    }
  }
);

export default router;