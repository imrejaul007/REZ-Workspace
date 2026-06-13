/**
 * Payment Routes
 *
 * API routes for rider payment methods
 */

import { Router, Request, Response } from 'express';
import { RiderTwinService } from '../../services/rider-twin.service';
import { asyncHandler, NotFoundError, ValidationError } from '../../utils/error-handler';
import { AddPaymentMethodRequest } from '../../models/types';

const router = Router();
const riderService = new RiderTwinService();

/**
 * GET /api/v1/riders/:riderId/payment
 * Get rider payment methods
 */
router.get('/:riderId/payment', asyncHandler(async (req: Request, res: Response) => {
  const { riderId } = req.params;

  const rider = await riderService.get(riderId);
  if (!rider) {
    throw new NotFoundError(`Rider ${riderId} not found`);
  }

  res.json({
    default_payment_method: rider.payment.default_payment_method,
    saved_cards: rider.payment.saved_cards,
    cash_enabled: rider.payment.cash_enabled,
  });
}));

/**
 * POST /api/v1/riders/:riderId/payment
 * Add a payment method
 */
router.post('/:riderId/payment', asyncHandler(async (req: Request, res: Response) => {
  const { riderId } = req.params;
  const body = req.body as AddPaymentMethodRequest;

  if (!body.card_id || !body.last_four || !body.brand) {
    throw new ValidationError('card_id, last_four, and brand are required');
  }

  const rider = await riderService.addPaymentMethod(riderId, body);
  if (!rider) {
    throw new NotFoundError(`Rider ${riderId} not found`);
  }

  res.status(201).json({
    message: 'Payment method added successfully',
    default_payment_method: rider.payment.default_payment_method,
    saved_cards: rider.payment.saved_cards,
  });
}));

/**
 * DELETE /api/v1/riders/:riderId/payment/:cardId
 * Remove a payment method
 */
router.delete('/:riderId/payment/:cardId', asyncHandler(async (req: Request, res: Response) => {
  const { riderId, cardId } = req.params;

  const rider = await riderService.removePaymentMethod(riderId, cardId);
  if (!rider) {
    throw new NotFoundError(`Rider ${riderId} not found`);
  }

  res.json({
    message: 'Payment method removed successfully',
    default_payment_method: rider.payment.default_payment_method,
    saved_cards: rider.payment.saved_cards,
  });
}));

/**
 * PATCH /api/v1/riders/:riderId/payment/default
 * Set default payment method
 */
router.patch('/:riderId/payment/default', asyncHandler(async (req: Request, res: Response) => {
  const { riderId } = req.params;
  const { card_id } = req.body;

  if (!card_id) {
    throw new ValidationError('card_id is required');
  }

  const rider = await riderService.setDefaultPaymentMethod(riderId, card_id);
  if (!rider) {
    throw new NotFoundError(`Rider ${riderId} not found or card not found`);
  }

  res.json({
    message: 'Default payment method updated',
    default_payment_method: rider.payment.default_payment_method,
  });
}));

export { router as paymentRoutes };
