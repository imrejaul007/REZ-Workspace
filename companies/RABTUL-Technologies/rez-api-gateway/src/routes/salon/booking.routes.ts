/**
 * Booking Routes
 *
 * Routes for booking-specific operations (outside salon context).
 */

import { Router } from 'express';
import {
  getBooking,
  cancelBooking,
} from './controllers/booking.controller';

const router = Router();

/**
 * Get booking by ID
 * GET /bookings/:id
 */
router.get('/:id', getBooking);

/**
 * Cancel booking
 * DELETE /bookings/:id
 */
router.delete('/:id', cancelBooking);

export default router;
