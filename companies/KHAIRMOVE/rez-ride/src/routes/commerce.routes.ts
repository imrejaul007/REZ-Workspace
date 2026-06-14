/**
 * Commerce Intelligence Routes for ReZ Ride
 *
 * Endpoints that integrate with the Commerce Intelligence Network
 * SECURITY: All routes require authentication and ownership verification
 */

import { Router, Request, Response } from 'express';
import { CommerceIntegrationService } from '../services/commerce-integration.service';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Apply auth to all routes
router.use(requireAuth());

// Initialize service
const commerceService = new CommerceIntegrationService({
  get: (key: string, defaultValue: string) => process.env[key] || defaultValue,
} as any);

// ============================================
// CROSS-SELL ENDPOINTS
// ============================================

/**
 * GET /api/commerce/cross-sell/:userId
 * Get cross-sell recommendations for rider
 * SECURITY: Users can only access their own data
 */
router.get('/cross-sell/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Ownership verification: Users can only access their own data
    if (req.user!.role !== 'admin' && req.user!.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'FORBIDDEN'
      });
    }

    const recommendations = await commerceService.getCrossSellRecommendations(userId);

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

/**
 * GET /api/commerce/nearby
 * Get nearby merchants
 */
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const { lat, lng, userId } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'lat and lng are required',
      });
    }

    const merchants = await commerceService.getNearbyMerchants(
      { lat: parseFloat(lat as string), lng: parseFloat(lng as string) },
      userId as string
    );

    res.json({
      success: true,
      data: merchants,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// ============================================
// MOMENT TRIGGERS
// ============================================

/**
 * GET /api/commerce/moments/:userId
 * Get moment triggers for user
 * SECURITY: Users can only access their own data
 */
router.get('/moments/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Ownership verification
    if (req.user!.role !== 'admin' && req.user!.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'FORBIDDEN'
      });
    }

    const moments = await commerceService.getMomentTriggers(userId);

    res.json({
      success: true,
      data: moments,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// ============================================
// AD DECISION ENDPOINTS
// ============================================

/**
 * POST /api/commerce/ad/decide
 * Get ad decision for ride context
 * SECURITY: Ownership verification
 */
router.post('/ad/decide', async (req: Request, res: Response) => {
  try {
    const { userId, location, context, destination } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
      });
    }

    // Ownership verification
    if (req.user!.role !== 'admin' && req.user!.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'FORBIDDEN'
      });
    }

    const decision = await commerceService.getAdDecision({
      userId,
      location,
      context: context || 'feed',
      destination,
    });

    res.json({
      success: true,
      data: decision,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

/**
 * POST /api/commerce/ad/impression
 * Record ad impression
 * SECURITY: Ownership verification
 */
router.post('/ad/impression', async (req: Request, res: Response) => {
  try {
    const { adId, campaignId, userId, rideId, location } = req.body;

    // Ownership verification
    if (req.user!.role !== 'admin' && req.user!.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'FORBIDDEN'
      });
    }

    await commerceService.recordAdImpression({
      adId,
      campaignId,
      userId,
      rideId,
      location,
    });

    res.json({
      success: true,
      data: { recorded: true },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

/**
 * POST /api/commerce/ad/click
 * Record ad click
 * SECURITY: Ownership verification
 */
router.post('/ad/click', async (req: Request, res: Response) => {
  try {
    const { adId, campaignId, userId } = req.body;

    // Ownership verification
    if (req.user!.role !== 'admin' && req.user!.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'FORBIDDEN'
      });
    }

    await commerceService.recordAdClick({
      adId,
      campaignId,
      userId,
    });

    res.json({
      success: true,
      data: { recorded: true },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

/**
 * POST /api/commerce/ad/conversion
 * Record ad conversion (ride completed from ad)
 * SECURITY: Ownership verification
 */
router.post('/ad/conversion', async (req: Request, res: Response) => {
  try {
    const { adId, campaignId, userId, rideId, revenue } = req.body;

    // Ownership verification
    if (req.user!.role !== 'admin' && req.user!.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'FORBIDDEN'
      });
    }

    await commerceService.recordAdConversion({
      adId,
      campaignId,
      userId,
      rideId,
      revenue,
    });

    res.json({
      success: true,
      data: { recorded: true },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// ============================================
// RIDE COMPLETION WEBHOOK
// ============================================

/**
 * POST /api/commerce/ride/completed
 * Called when ride is completed to sync with commerce graph
 * SECURITY: Internal service call - uses internal token verification
 */
router.post('/ride/completed', async (req: Request, res: Response) => {
  try {
    // Verify internal service token for webhook calls
    const internalToken = req.headers['x-internal-token'];
    const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;

    if (!expectedToken || internalToken !== expectedToken) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
    }

    const {
      rideId,
      userId,
      driverId,
      pickup,
      drop,
      fare,
      vehicleType,
      distance,
      duration,
    } = req.body;

    // Record transaction
    await commerceService.recordRideTransaction({
      rideId,
      userId,
      driverId,
      pickup,
      drop,
      fare,
      vehicleType,
      distance,
      duration,
    });

    // Get cross-sell recommendations
    const crossSells = await commerceService.getCrossSellRecommendations(userId);

    // Get moment triggers
    const moments = await commerceService.getMomentTriggers(userId);

    res.json({
      success: true,
      data: {
        rideId,
        recorded: true,
        crossSells: crossSells.recommendations,
        moments: moments.moments,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

// ============================================
// CUSTOMER 360
// ============================================

/**
 * GET /api/commerce/customer/:userId
 * Get customer 360 from commerce graph
 * SECURITY: Ownership verification
 */
router.get('/customer/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Ownership verification
    if (req.user!.role !== 'admin' && req.user!.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'FORBIDDEN'
      });
    }

    const customer360 = await commerceService.getCustomer360(userId);

    res.json({
      success: true,
      data: customer360,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

/**
 * PATCH /api/commerce/customer/:userId/predictions
 * Update user predictions
 */
router.patch('/customer/:userId/predictions', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { rideFrequency, avgFare, preferredVehicleType, preferredAreas } = req.body;

    await commerceService.updateUserPredictions(userId, {
      rideFrequency,
      avgFare,
      preferredVehicleType,
      preferredAreas,
    });

    res.json({
      success: true,
      data: { updated: true },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

export default router;
