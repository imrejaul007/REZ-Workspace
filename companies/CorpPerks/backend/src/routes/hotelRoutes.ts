/**
 * Hotel Booking Routes for Corporate Travel
 * Extends CorpPerks with StayOwn Hotel OS integration
 */

import { Router, Request, Response } from 'express';
import stayOwnClient from '../integrations/stayOwnClient.js';
import { verifyToken } from '../integrations/rabtulClient.js';

const router = Router();

/**
 * GET /api/hotels/search
 * Search hotels for corporate travel
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { city, checkIn, checkOut, guests, rooms } = req.query;

    if (!city || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: 'city, checkIn, and checkOut are required' },
      });
    }

    const results = await stayOwnClient.searchHotels({
      city: String(city),
      checkIn: String(checkIn),
      checkOut: String(checkOut),
      guests: Number(guests) || 1,
      rooms: Number(rooms) || 1,
      corporateId: req.headers['x-corporate-id'] as string,
    });

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Hotel search error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SEARCH_ERROR', message: 'Failed to search hotels' },
    });
  }
});

/**
 * POST /api/hotels/book
 * Book hotel for corporate traveler
 */
router.post('/book', async (req: Request, res: Response) => {
  try {
    const {
      hotelId,
      roomType,
      checkIn,
      checkOut,
      guestName,
      guestEmail,
      corporateId,
      employeeId,
      billingType,
      costCenter,
    } = req.body;

    if (!hotelId || !roomType || !checkIn || !checkOut || !guestName || !guestEmail) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: 'Missing required booking fields' },
      });
    }

    const booking = await stayOwnClient.bookHotel({
      hotelId,
      roomType,
      checkIn,
      checkOut,
      guestName,
      guestEmail,
      corporateId: corporateId || req.headers['x-corporate-id'] as string,
      employeeId: employeeId || req.headers['x-employee-id'] as string,
      billingType: billingType || 'corporate',
      costCenter,
    });

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    console.error('Hotel booking error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'BOOKING_ERROR', message: 'Failed to book hotel' },
    });
  }
});

/**
 * GET /api/hotels/bookings/:bookingId
 * Get booking status
 */
router.get('/bookings/:bookingId', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const booking = await stayOwnClient.getBookingStatus(bookingId);
    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'GET_ERROR', message: 'Failed to get booking status' },
    });
  }
});

/**
 * POST /api/hotels/bookings/:bookingId/cancel
 * Cancel hotel booking
 */
router.post('/bookings/:bookingId/cancel', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    const result = await stayOwnClient.cancelBooking(bookingId, reason || 'Corporate cancellation');
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CANCEL_ERROR', message: 'Failed to cancel booking' },
    });
  }
});

/**
 * GET /api/hotels/recommendations
 * Get hotel recommendations for employee
 */
router.get('/recommendations', async (req: Request, res: Response) => {
  try {
    const { employeeId, city } = req.query;

    if (!employeeId || !city) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: 'employeeId and city are required' },
      });
    }

    const recommendations = await stayOwnClient.getRecommendations(
      String(employeeId),
      String(city)
    );
    res.json({ success: true, data: recommendations });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'RECOMMENDATION_ERROR', message: 'Failed to get recommendations' },
    });
  }
});

/**
 * GET /api/hotels/integration-status
 * Check StayOwn integration health
 */
router.get('/integration-status', async (_req: Request, res: Response) => {
  try {
    const health = await stayOwnClient.checkHealth();
    res.json({
      success: true,
      data: {
        stayOwnConnected: health.connected,
        capabilities: [
          'hotel_search',
          'corporate_booking',
          'policy_enforcement',
          'travel_recommendations',
        ],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'STATUS_ERROR', message: 'Failed to check integration status' },
    });
  }
});

/**
 * POST /api/hotels/travel-policy
 * Sync corporate travel policy
 */
router.post('/travel-policy', async (req: Request, res: Response) => {
  try {
    const { corporateId, policy } = req.body;

    if (!corporateId || !policy) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: 'corporateId and policy are required' },
      });
    }

    const result = await stayOwnClient.syncTravelPolicy(corporateId, policy);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Sync travel policy error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'POLICY_ERROR', message: 'Failed to sync travel policy' },
    });
  }
});

export default router;