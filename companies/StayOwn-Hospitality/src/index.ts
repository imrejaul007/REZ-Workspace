import { logger } from '../../shared/logger';
/**
 * StayOwn Hospitality API
 *
 * Hospitality OS - Hotels, Vacation Rentals, Habixo
 * Port: 4801
 */

import express, { Request, Response } from 'express';
import { stayOwnHub } from './hub-client';

const app = express();
app.use(express.json());

// ============================================
// HEALTH ENDPOINTS
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'StayOwn-Hospitality',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/ready', async (req: Request, res: Response) => {
  const checks = {
    unifiedHub: false,
    hojaiMemory: false,
    hojaiAgents: false,
    rabtulAuth: false,
    rabtulWallet: false,
  };

  try {
    // Quick health checks
    const balance = await stayOwnHub.getWalletBalance('health-check');
    checks.unifiedHub = true;
  } catch {}

  res.json({ status: 'ready', checks });
});

// ============================================
// GUEST AUTHENTICATION
// ============================================

app.post('/api/guests/auth', async (req: Request, res: Response) => {
  try {
    const { phone, name } = req.body;
    const result = await stayOwnHub.authenticateGuest(phone, name);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/guests/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const result = await stayOwnHub.verifyGuest(token);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// HOTEL BOOKINGS
// ============================================

app.post('/api/bookings', async (req: Request, res: Response) => {
  try {
    const { guest_id, hotel_id, room_type, check_in, check_out, payment_method } = req.body;

    // Get pricing recommendation from HOJAI
    const pricing = await stayOwnHub.getPricingRecommendation(hotel_id, check_in);

    // Create booking
    const booking = await stayOwnHub.createBooking({
      guest_id,
      hotel_id,
      room_type,
      check_in,
      check_out,
      pricing,
    });

    // Process payment
    if (payment_method === 'wallet') {
      const payment = await stayOwnHub.processPayment(guest_id, pricing.total, 'wallet');
      await stayOwnHub.creditGuestWallet(guest_id, pricing.total * 0.1, 'booking_cashback');
    }

    // Store preference
    await stayOwnHub.storeGuestPreference(guest_id, {
      preferred_room_type: room_type,
      check_in,
      check_out,
    });

    // Track event
    await stayOwnHub.trackEvent(guest_id, 'booking.created', { booking_id: booking?.id });

    // Award loyalty points
    await stayOwnHub.awardLoyaltyPoints(guest_id, 100, 'hotel_booking');

    // Publish booking event
    await stayOwnHub.publishBookingEvent(booking?.id, 'booking.created', booking);

    res.json({ success: true, data: booking, pricing });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/bookings/:bookingId', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const booking = await stayOwnHub.getBooking(bookingId);
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/bookings/:bookingId/cancel', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;
    const result = await stayOwnHub.cancelBooking(bookingId, reason);

    // Publish cancellation event
    await stayOwnHub.publishBookingEvent(bookingId, 'booking.cancelled', { reason });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// ROOM AVAILABILITY
// ============================================

app.post('/api/hotels/:hotelId/availability', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { check_in, check_out, room_type } = req.body;

    const availability = await stayOwnHub.checkRoomAvailability(hotelId, check_in, check_out, room_type);
    res.json({ success: true, data: availability });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// AI CONCIERGE
// ============================================

app.post('/api/concierge/query', async (req: Request, res: Response) => {
  try {
    const { guest_id, query } = req.body;

    // Get guest preferences first
    const preferences = await stayOwnHub.getGuestPreferences(guest_id);

    // Get AI concierge response
    const response = await stayOwnHub.getAICociergeResponse(guest_id, query);

    // Store interaction as memory
    await stayOwnHub.storeGuestMemory(guest_id, `Concierge query: ${query}`);

    res.json({ success: true, data: response, preferences });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// GUEST PREFERENCES
// ============================================

app.post('/api/guests/:guestId/preferences', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const preference = req.body;

    await stayOwnHub.storeGuestPreference(guestId, preference);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/guests/:guestId/preferences', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const preferences = await stayOwnHub.getGuestPreferences(guestId);
    res.json({ success: true, data: preferences });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// ROOM SERVICE (QR)
// ============================================

app.post('/api/room-service', async (req: Request, res: Response) => {
  try {
    const { guest_id, room_id, items } = req.body;

    // Process order
    const order = await stayOwnHub.processRoomService({
      guest_id,
      room_id,
      items,
    });

    // Charge wallet
    await stayOwnHub.creditGuestWallet(guest_id, -order.total, 'room_service');

    // Track event
    await stayOwnHub.trackEvent(guest_id, 'room_service.ordered', order);

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// HABIXO (VACATION RENTALS)
// ============================================

app.post('/api/habixo/listings', async (req: Request, res: Response) => {
  try {
    const filters = req.body;
    const listings = await stayOwnHub.getHabixoListings(filters);

    // Get personalized recommendations
    if (filters.user_id) {
      const recommendations = await stayOwnHub.getRecommendations(filters.user_id, {
        industry: 'hospitality',
        type: 'vacation_rental',
      });
      return res.json({ success: true, data: listings, recommendations });
    }

    res.json({ success: true, data: listings });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// LOYALTY & WALLET
// ============================================

app.get('/api/guests/:guestId/wallet', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const balance = await stayOwnHub.getWalletBalance(guestId);
    const points = await stayOwnHub.getLoyaltyPoints(guestId);

    res.json({ success: true, data: { balance, points } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// ANALYTICS
// ============================================

app.post('/api/analytics/track', async (req: Request, res: Response) => {
  try {
    const { guest_id, event, data } = req.body;
    await stayOwnHub.trackEvent(guest_id, event, data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// RECOMMENDATIONS
// ============================================

app.get('/api/guests/:guestId/recommendations', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const recommendations = await stayOwnHub.getRecommendations(guestId, { industry: 'hospitality' });
    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 4801;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(parseInt(PORT as string), HOST as string, () => {
  logger.info(`[StayOwn] Hospitality API running on http://${HOST}:${PORT}`);
  logger.info(`[StayOwn] Connected to Unified Hub: ${process.env.UNIFIED_HUB_URL || 'http://localhost:4600'}`);
  logger.info(`[StayOwn] HOJAI Memory: ${process.env.HOJAI_MEMORY || 'http://localhost:4520'}`);
});

export { app };
export default app;