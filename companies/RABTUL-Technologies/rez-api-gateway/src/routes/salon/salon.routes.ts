/**
 * Salon Routes
 *
 * Routes for salon-specific operations.
 */

import { Router } from 'express';
import {
  getSalon,
  getSalonServices,
  getSalonStylists,
  getSalonAvailability,
} from './controllers/salon.controller';
import { createBooking } from './controllers/booking.controller';

const router = Router();

/**
 * Get salon by ID
 * GET /salons/:id
 */
router.get('/:id', getSalon);

/**
 * Get salon services
 * GET /salons/:id/services
 */
router.get('/:id/services', getSalonServices);

/**
 * Get salon stylists
 * GET /salons/:id/stylists
 */
router.get('/:id/stylists', getSalonStylists);

/**
 * Get salon availability
 * GET /salons/:id/availability
 */
router.get('/:id/availability', getSalonAvailability);

/**
 * Create a booking at salon
 * POST /salons/:id/bookings
 */
router.post('/:id/bookings', createBooking);

export default router;
