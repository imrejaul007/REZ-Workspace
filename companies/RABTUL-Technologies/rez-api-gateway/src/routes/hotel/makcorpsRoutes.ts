/**
 * Makcorps Hotel OTA Routes
 *
 * Integration with Makcorps API for corporate hotel bookings.
 * Handles property search, booking, and cancellation.
 *
 * This file contains only route definitions that delegate to controllers.
 * Business logic is extracted into services and controllers.
 */

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { searchController } from './controllers/search.controller';
import { bookingController } from './controllers/booking.controller';
import { cancellationController } from './controllers/cancellation.controller';
import { pricingController } from './controllers/pricing.controller';

const router = Router();

// ============================================
// PROPERTY SEARCH
// ============================================

/**
 * Search hotels
 * GET /api/hotels/search
 */
router.get('/search', requireAuth, (req, res) => searchController.search(req, res));

/**
 * Get property details
 * GET /api/hotels/:propertyId
 */
router.get('/:propertyId', requireAuth, (req, res) => searchController.getProperty(req, res));

/**
 * Get room availability
 * GET /api/hotels/:propertyId/availability
 */
router.get('/:propertyId/availability', requireAuth, (req, res) => searchController.getAvailability(req, res));

// ============================================
// BOOKINGS
// ============================================

/**
 * Create booking
 * POST /api/hotels/bookings
 */
router.post('/bookings', requireAuth, (req, res) => bookingController.createBooking(req, res));

/**
 * Get bookings
 * GET /api/hotels/bookings
 */
router.get('/bookings', requireAuth, (req, res) => bookingController.getBookings(req, res));

/**
 * Get single booking
 * GET /api/hotels/bookings/:bookingId
 */
router.get('/bookings/:bookingId', requireAuth, (req, res) => bookingController.getBooking(req, res));

/**
 * Cancel booking
 * POST /api/hotels/bookings/:bookingId/cancel
 */
router.post('/bookings/:bookingId/cancel', requireAuth, (req, res) => cancellationController.cancelBooking(req, res));

// ============================================
// PRICING
// ============================================

/**
 * Calculate price
 * POST /api/hotels/pricing/calculate
 */
router.post('/pricing/calculate', requireAuth, (req, res) => pricingController.calculatePricing(req, res));

export default router;
