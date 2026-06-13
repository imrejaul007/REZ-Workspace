/**
 * Address Routes
 *
 * API routes for rider saved addresses
 */

import { Router, Request, Response } from 'express';
import { RiderTwinService } from '../../services/rider-twin.service';
import { asyncHandler, NotFoundError, ValidationError } from '../../utils/error-handler';
import { AddAddressRequest } from '../../models/types';

const router = Router();
const riderService = new RiderTwinService();

/**
 * GET /api/v1/riders/:riderId/addresses
 * Get all saved addresses
 */
router.get('/:riderId/addresses', asyncHandler(async (req: Request, res: Response) => {
  const { riderId } = req.params;

  const rider = await riderService.get(riderId);
  if (!rider) {
    throw new NotFoundError(`Rider ${riderId} not found`);
  }

  res.json({
    home: rider.addresses.home,
    work: rider.addresses.work,
    favorites: rider.addresses.favorites,
  });
}));

/**
 * POST /api/v1/riders/:riderId/addresses
 * Add a saved address
 */
router.post('/:riderId/addresses', asyncHandler(async (req: Request, res: Response) => {
  const { riderId } = req.params;
  const body = req.body as AddAddressRequest;

  if (!body.type || !body.label || !body.address || body.lat === undefined || body.lng === undefined) {
    throw new ValidationError('type, label, address, lat, and lng are required');
  }

  if (!['home', 'work', 'favorite'].includes(body.type)) {
    throw new ValidationError('type must be home, work, or favorite');
  }

  const rider = await riderService.addAddress(riderId, body);
  if (!rider) {
    throw new NotFoundError(`Rider ${riderId} not found`);
  }

  res.status(201).json({
    message: 'Address added successfully',
    addresses: rider.addresses,
  });
}));

/**
 * DELETE /api/v1/riders/:riderId/addresses/:type
 * Remove a saved address
 */
router.delete('/:riderId/addresses/:type', asyncHandler(async (req: Request, res: Response) => {
  const { riderId, type } = req.params;
  const label = req.query.label as string | undefined;

  if (!['home', 'work', 'favorite'].includes(type)) {
    throw new ValidationError('type must be home, work, or favorite');
  }

  const rider = await riderService.removeAddress(riderId, type as 'home' | 'work', label);
  if (!rider) {
    throw new NotFoundError(`Rider ${riderId} not found`);
  }

  res.json({
    message: 'Address removed successfully',
    addresses: rider.addresses,
  });
}));

export { router as addressRoutes };
