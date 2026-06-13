/**
 * Rider Routes
 *
 * API routes for rider management
 */

import { Router, Request, Response } from 'express';
import { RiderTwinService } from '../../services/rider-twin.service';
import { asyncHandler, NotFoundError, ValidationError } from '../../utils/error-handler';
import {
  CreateRiderRequest,
  UpdateRiderRequest,
  RiderListParams,
  getRiderTwinId,
} from '../../models/types';

const router = Router();
const riderService = new RiderTwinService();

// ============================================
// RIDER CRUD
// ============================================

/**
 * GET /api/v1/riders
 * List all riders with pagination
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const params: RiderListParams = {
    page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
    tier: req.query.tier as any,
    sort_by: req.query.sort_by as any,
    sort_order: req.query.sort_order as any,
  };

  const result = await riderService.list(params);
  res.json(result);
}));

/**
 * GET /api/v1/riders/search
 * Search riders
 */
router.get('/search', asyncHandler(async (req: Request, res: Response) => {
  const query = req.query.q as string;
  if (!query) {
    throw new ValidationError('Search query is required');
  }

  const riders = await riderService.search(query);
  res.json({ data: riders, count: riders.length });
}));

/**
 * POST /api/v1/riders
 * Create a new rider
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreateRiderRequest;

  if (!body.profile?.email || !body.profile?.phone) {
    throw new ValidationError('Profile email and phone are required');
  }

  const rider = await riderService.create(body);
  res.status(201).json({
    rider,
    twin_id: getRiderTwinId(rider.rider_id),
  });
}));

/**
 * GET /api/v1/riders/:riderId
 * Get rider by ID
 */
router.get('/:riderId', asyncHandler(async (req: Request, res: Response) => {
  const { riderId } = req.params;

  const rider = await riderService.get(riderId);
  if (!rider) {
    throw new NotFoundError(`Rider ${riderId} not found`);
  }

  res.json({
    rider,
    twin_id: getRiderTwinId(riderId),
  });
}));

/**
 * PATCH /api/v1/riders/:riderId
 * Update rider
 */
router.patch('/:riderId', asyncHandler(async (req: Request, res: Response) => {
  const { riderId } = req.params;
  const body = req.body as UpdateRiderRequest;

  const rider = await riderService.update(riderId, body);
  if (!rider) {
    throw new NotFoundError(`Rider ${riderId} not found`);
  }

  res.json({ rider });
}));

/**
 * DELETE /api/v1/riders/:riderId
 * Delete rider
 */
router.delete('/:riderId', asyncHandler(async (req: Request, res: Response) => {
  const { riderId } = req.params;

  const deleted = await riderService.delete(riderId);
  if (!deleted) {
    throw new NotFoundError(`Rider ${riderId} not found`);
  }

  res.status(204).send();
}));

// ============================================
// TWINOS INTEGRATION
// ============================================

/**
 * GET /api/v1/riders/:riderId/twin
 * Get TwinOS entity ID for rider
 */
router.get('/:riderId/twin', asyncHandler(async (req: Request, res: Response) => {
  const { riderId } = req.params;

  const rider = await riderService.get(riderId);
  if (!rider) {
    throw new NotFoundError(`Rider ${riderId} not found`);
  }

  res.json({
    twin_id: getRiderTwinId(riderId),
    twin_type: 'twin.transport.rider',
    entity_id: riderId,
    managed_by: 'agent.rider_intelligence',
    created_at: rider.created_at,
    updated_at: rider.updated_at,
  });
}));

// ============================================
// ANALYTICS
// ============================================

/**
 * GET /api/v1/riders/:riderId/analytics
 * Get rider analytics
 */
router.get('/:riderId/analytics', asyncHandler(async (req: Request, res: Response) => {
  const { riderId } = req.params;

  const analytics = await riderService.getAnalytics(riderId);
  if (!analytics) {
    throw new NotFoundError(`Rider ${riderId} not found`);
  }

  res.json(analytics);
}));

/**
 * GET /api/v1/riders/:riderId/stats
 * Get rider statistics
 */
router.get('/:riderId/stats', asyncHandler(async (req: Request, res: Response) => {
  const { riderId } = req.params;
  const period = (req.query.period as 'day' | 'week' | 'month' | 'all') || 'all';

  const stats = await riderService.getStats(riderId, period);
  res.json(stats);
}));

export { router as riderRoutes };
