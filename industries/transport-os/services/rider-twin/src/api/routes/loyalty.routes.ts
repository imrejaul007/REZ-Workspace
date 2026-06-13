/**
 * Loyalty Routes
 *
 * API routes for rider loyalty programs
 */

import { Router, Request, Response } from 'express';
import { RiderTwinService } from '../../services/rider-twin.service';
import { asyncHandler, NotFoundError, ValidationError } from '../../utils/error-handler';
import { SetPreferencesRequest, AddFavoriteRouteRequest } from '../../models/types';

const router = Router();
const riderService = new RiderTwinService();

// ============================================
// LOYALTY
// ============================================

/**
 * GET /api/v1/riders/:riderId/loyalty
 * Get rider loyalty status
 */
router.get('/:riderId/loyalty', asyncHandler(async (req: Request, res: Response) => {
  const { riderId } = req.params;

  const loyalty = await riderService.getLoyalty(riderId);
  if (!loyalty) {
    throw new NotFoundError(`Rider ${riderId} not found`);
  }

  res.json({
    member_id: loyalty.member_id,
    tier: loyalty.tier,
    points_balance: loyalty.points_balance,
    lifetime_points: loyalty.lifetime_points,
    points_multiplier: riderService.getPointsMultiplier(loyalty.tier),
  });
}));

/**
 * POST /api/v1/riders/:riderId/loyalty/points
 * Add loyalty points (internal/admin only)
 */
router.post('/:riderId/loyalty/points', asyncHandler(async (req: Request, res: Response) => {
  const { riderId } = req.params;
  const { points, reason } = req.body;

  if (!points || typeof points !== 'number' || points <= 0) {
    throw new ValidationError('Valid points value is required');
  }

  const rider = await riderService.addLoyaltyPoints(riderId, points, reason);
  if (!rider) {
    throw new NotFoundError(`Rider ${riderId} not found`);
  }

  res.json({
    message: 'Points added successfully',
    points_added: points,
    new_balance: rider.loyalty.points_balance,
    tier: rider.loyalty.tier,
  });
}));

/**
 * POST /api/v1/riders/:riderId/loyalty/redeem
 * Redeem loyalty points
 */
router.post('/:riderId/loyalty/redeem', asyncHandler(async (req: Request, res: Response) => {
  const { riderId } = req.params;
  const { points } = req.body;

  if (!points || typeof points !== 'number' || points <= 0) {
    throw new ValidationError('Valid points value is required');
  }

  const result = await riderService.redeemLoyaltyPoints(riderId, points);

  if (!result.success) {
    throw new ValidationError(result.message);
  }

  const rider = await riderService.get(riderId);

  res.json({
    message: result.message,
    points_redeemed: points,
    new_balance: rider?.loyalty.points_balance,
  });
}));

// ============================================
// PREFERENCES
// ============================================

/**
 * GET /api/v1/riders/:riderId/preferences
 * Get rider preferences
 */
router.get('/:riderId/preferences', asyncHandler(async (req: Request, res: Response) => {
  const { riderId } = req.params;

  const rider = await riderService.get(riderId);
  if (!rider) {
    throw new NotFoundError(`Rider ${riderId} not found`);
  }

  res.json(rider.preferences);
}));

/**
 * PATCH /api/v1/riders/:riderId/preferences
 * Update rider preferences
 */
router.patch('/:riderId/preferences', asyncHandler(async (req: Request, res: Response) => {
  const { riderId } = req.params;
  const body = req.body as SetPreferencesRequest;

  const rider = await riderService.setPreferences(riderId, body);
  if (!rider) {
    throw new NotFoundError(`Rider ${riderId} not found`);
  }

  res.json({
    message: 'Preferences updated successfully',
    preferences: rider.preferences,
  });
}));

// ============================================
// FAVORITE ROUTES
// ============================================

/**
 * GET /api/v1/riders/:riderId/routes
 * Get rider's favorite routes
 */
router.get('/:riderId/routes', asyncHandler(async (req: Request, res: Response) => {
  const { riderId } = req.params;

  const rider = await riderService.get(riderId);
  if (!rider) {
    throw new NotFoundError(`Rider ${riderId} not found`);
  }

  res.json({
    favorite_routes: rider.activity.favorite_routes,
  });
}));

/**
 * POST /api/v1/riders/:riderId/routes
 * Add a favorite route
 */
router.post('/:riderId/routes', asyncHandler(async (req: Request, res: Response) => {
  const { riderId } = req.params;
  const body = req.body as AddFavoriteRouteRequest;

  if (!body.from || !body.to) {
    throw new ValidationError('from and to addresses are required');
  }

  const rider = await riderService.addFavoriteRoute(riderId, body);
  if (!rider) {
    throw new NotFoundError(`Rider ${riderId} not found`);
  }

  res.status(201).json({
    message: 'Favorite route added successfully',
    favorite_routes: rider.activity.favorite_routes,
  });
}));

export { router as loyaltyRoutes };
