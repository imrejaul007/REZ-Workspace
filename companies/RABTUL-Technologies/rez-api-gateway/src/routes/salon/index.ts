/**
 * Salon Routes Index
 *
 * Unified entry point for all salon-related routes.
 */

import { Router } from 'express';
import searchRoutes from './search.routes';
import salonRoutes from './salon.routes';
import bookingRoutes from './booking.routes';

const router = Router();

// Mount sub-routes
// Search: /salons/search
router.use('/salons/search', searchRoutes);

// Salon CRUD: /salons/:id, /salons/:id/services, etc.
router.use('/salons', salonRoutes);

// Bookings: /bookings/:id
router.use('/bookings', bookingRoutes);

export default router;

// Re-export route types for documentation
export { salonRoutes, searchRoutes, bookingRoutes };
