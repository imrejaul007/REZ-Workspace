/**
 * REZ Unified Hub - Hospitality Routes
 * Hotel booking and hospitality services
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { apiClient } from '../services/apiClient';
import { logger } from '../utils/logger';

const router = Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const BookHotelSchema = z.object({
  guest_id: z.string().min(1, 'guest_id is required'),
  hotel_id: z.string().min(1, 'hotel_id is required'),
  room_type: z.string().min(1, 'room_type is required'),
  check_in: z.string().min(1, 'check_in is required'),
  check_out: z.string().min(1, 'check_out is required'),
  use_karma: z.boolean().optional(),
});

// ============================================
// ROUTES
// ============================================

/**
 * POST /api/v1/hospitality/book
 * Book hotel with loyalty benefits
 */
router.post('/book', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = BookHotelSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: validation.error.errors,
      });
      return;
    }

    const { guest_id, hotel_id, room_type, check_in, check_out, use_karma } = validation.data;

    // Get guest profile for personalization
    const [cdpProfile, rfmScore] = await Promise.allSettled([
      apiClient.getCDPProfile(guest_id),
      apiClient.getRFMScore(guest_id),
    ]);

    const guest = {
      profile: cdpProfile.status === 'fulfilled' ? cdpProfile.value : null,
      rfm: rfmScore.status === 'fulfilled' ? rfmScore.value : null,
    };

    // Book room
    const booking = await apiClient.call('BOOKING', '/api/v1/bookings', 'POST', {
      guest_id,
      hotel_id,
      room_type,
      check_in,
      check_out,
      guest_profile: guest,
    });

    const bookingData = booking as { id?: string; total?: number; guest_karma_points?: number } | null;

    // Apply karma discount if requested
    if (use_karma && bookingData) {
      const rfm = rfmScore.status === 'fulfilled' ? rfmScore.value as { karma_points?: number } : null;
      const karmaPoints = rfm?.karma_points || 0;
      const discount = Math.min(karmaPoints, (bookingData.total || 0) * 0.1);

      if (discount > 0) {
        await apiClient.call('KARMA', '/api/v1/redeem', 'POST', {
          user_id: guest_id,
          points: Math.floor(discount),
          source: 'StayOwn',
          item_id: `booking_discount_${bookingData.id}`,
        });
      }
    }

    // Setup room QR for guest
    await apiClient.call('ROOM_QR', '/api/v1/rooms/setup', 'POST', {
      booking_id: bookingData?.id,
      guest_id,
    });

    // Track for intelligence
    await apiClient.collectSignal('hospitality', 'booking_created', guest_id, {
      hotel_id,
      room_type,
      booking_id: bookingData?.id,
    });

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    logger.error('Error booking hotel:', error);
    next(error);
  }
});

/**
 * GET /api/v1/hospitality/hotels/recommendations/:userId
 * Get hotel recommendations based on user history
 */
router.get('/hotels/recommendations/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { location, limit = '10' } = req.query;

    // Fetch recommendations and history in parallel
    const [recommendations, history] = await Promise.allSettled([
      apiClient.call('RECOMMEND', '/api/v1/hotels', 'POST', {
        user_id: userId,
        location: location ? JSON.parse(location as string) : undefined,
        limit: parseInt(limit as string, 10),
      }),
      apiClient.collectSignal('hotel', 'recommendation_requested', userId, {
        location: location ? JSON.parse(location as string) : null,
      }),
    ]);

    const recData = recommendations.status === 'fulfilled' ? recommendations.value as {
      hotels?: unknown[];
      similar_bookings?: unknown[];
    } : null;

    res.json({
      success: true,
      data: {
        recommended: recData?.hotels || [],
        similar_users_booked: recData?.similar_bookings || [],
      },
    });
  } catch (error) {
    logger.error('Error fetching hotel recommendations:', error);
    next(error);
  }
});

/**
 * GET /api/v1/hospitality/bookings/:userId
 * Get booking history for a user
 */
router.get('/bookings/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { limit = '20', offset = '0' } = req.query;

    const result = await apiClient.call('BOOKING', '/api/v1/bookings', 'POST', {
      guest_id: userId,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error fetching bookings:', error);
    next(error);
  }
});

/**
 * POST /api/v1/hospitality/checkout
 * Express hotel checkout
 */
router.post('/checkout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      booking_id: z.string().min(1),
      payment_method: z.enum(['wallet', 'upi', 'card']).default('wallet'),
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: validation.error.errors,
      });
      return;
    }

    const { booking_id, payment_method } = validation.data;

    // Get booking details
    const booking = (await apiClient.call('BOOKING', `/api/v1/bookings/${booking_id}`, 'GET')) as { total_due?: number; guest_id?: string } | null;

    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found' });
      return;
    }

    // Process payment if needed
    if (booking.total_due && booking.total_due > 0) {
      await apiClient.call('PAYMENT', '/api/v1/payments/initiate', 'POST', {
        user_id: booking.guest_id,
        amount: booking.total_due,
        method: payment_method,
        reference: `booking_${booking_id}`,
      });
    }

    // Generate final folio
    const folio = await apiClient.call('BOOKING', `/api/v1/bookings/${booking_id}/folio`, 'GET');

    // Track checkout
    await apiClient.collectSignal('hospitality', 'express_checkout', booking.guest_id || '', {
      booking_id,
    });

    res.json({
      success: true,
      data: { booking, folio },
    });
  } catch (error) {
    logger.error('Error processing checkout:', error);
    next(error);
  }
});

export default router;
