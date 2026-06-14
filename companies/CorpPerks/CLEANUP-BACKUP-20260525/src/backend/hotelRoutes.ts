/**
 * Hotel OTA Routes - Uses our own Hotel OTA
 *
 * Replaces StayOwn integration with our Hotel OTA platform.
 * Handles property search, booking, and cancellation.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireAdminAuth } from './middleware/auth';
import { logger } from './config/logger';

const router = Router();

// Environment variables
const HOTEL_OTA_URL = process.env.HOTEL_OTA_URL || 'https://hotel-ota-api.onrender.com/v1';
const HOTEL_OTA_API_KEY = process.env.HOTEL_OTA_API_KEY || '';

// Validation schemas
const searchSchema = z.object({
  city: z.string().optional(),
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.string().transform(Number).optional(),
  minRating: z.string().transform(Number).optional(),
  maxPrice: z.string().transform(Number).optional(),
});

const createBookingSchema = z.object({
  hotelId: z.string(),
  roomId: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.number(),
  guestDetails: z.array(z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string(),
  })),
  specialRequests: z.string().optional(),
  corporateCode: z.string().optional(),
});

// ============================================
// HOTEL SEARCH
// ============================================

/**
 * Search hotels
 * GET /api/hotels/search
 *
 * Uses our Hotel OTA: GET /hotels/search
 */
router.get('/search', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = searchSchema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({ success: false, message: 'Invalid search parameters' });
    }

    const { city, checkIn, checkOut, guests, minRating, maxPrice } = result.data;

    // Call our Hotel OTA API
    try {
      const response = await fetch(`${HOTEL_OTA_URL}/hotels/search?city=${city || ''}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests || 1}`, {
        headers: {
          'Authorization': `Bearer ${HOTEL_OTA_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        let hotels = data.hotels || [];

        // Apply filters
        if (minRating) {
          hotels = hotels.filter((h: any) => h.rating >= minRating);
        }
        if (maxPrice) {
          hotels = hotels.filter((h: any) => h.startingPrice <= maxPrice);
        }

        return res.json({
          success: true,
          data: {
            hotels,
            searchParams: { city, checkIn, checkOut, guests },
          },
        });
      }
    } catch (otaError) {
      logger.warn('Hotel OTA unavailable, using demo data');
    }

    // Fallback to demo data
    const demoHotels = [
      {
        id: 'demo_hotel_1',
        name: 'The Grand Palace',
        description: 'Luxury hotel in city center',
        address: { line1: '123 Main Street', city: city || 'New Delhi', state: 'Delhi', pincode: '110001', country: 'India' },
        starRating: 5,
        userRating: 4.5,
        reviewCount: 1250,
        startingPrice: 8500,
        images: ['https://example.com/hotel1.jpg'],
        amenities: ['Pool', 'Spa', 'Gym', 'Restaurant', 'WiFi'],
        policies: { checkIn: '14:00', checkOut: '12:00', childrenAllowed: true, petsAllowed: false },
        available: true,
      },
      {
        id: 'demo_hotel_2',
        name: 'Business Executive Hotel',
        description: 'Perfect for corporate travelers',
        address: { line1: '456 Business Park', city: city || 'New Delhi', state: 'Delhi', pincode: '110002', country: 'India' },
        starRating: 4,
        userRating: 4.2,
        reviewCount: 890,
        startingPrice: 5500,
        images: ['https://example.com/hotel2.jpg'],
        amenities: ['WiFi', 'Business Center', 'Restaurant', 'Parking'],
        policies: { checkIn: '12:00', checkOut: '12:00', childrenAllowed: true, petsAllowed: false },
        available: true,
      },
      {
        id: 'demo_hotel_3',
        name: 'Budget Inn',
        description: 'Comfortable stay at affordable price',
        address: { line1: '789 Market Road', city: city || 'New Delhi', state: 'Delhi', pincode: '110003', country: 'India' },
        starRating: 3,
        userRating: 3.8,
        reviewCount: 456,
        startingPrice: 2500,
        images: ['https://example.com/hotel3.jpg'],
        amenities: ['WiFi', 'Restaurant', 'Parking'],
        policies: { checkIn: '14:00', checkOut: '11:00', childrenAllowed: true, petsAllowed: false },
        available: true,
      },
    ];

    return res.json({
      success: true,
      data: {
        hotels: demoHotels,
        searchParams: { city, checkIn, checkOut, guests },
        note: 'Using demo data - connect Hotel OTA for real data',
      },
    });
  } catch (error: any) {
    logger.error('Hotel search error:', error);
    res.status(500).json({ success: false, message: 'Search failed' });
  }
});

/**
 * Get hotel details
 * GET /api/hotels/:id
 * SECURITY FIX: Added input validation for hotel ID to prevent injection attacks.
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // SECURITY FIX: Validate hotel ID format (alphanumeric, dash, underscore only)
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id) || id.length > 100) {
      return res.status(400).json({ success: false, message: 'Invalid hotel ID format' });
    }

    // Call Hotel OTA API
    try {
      const response = await fetch(`${HOTEL_OTA_URL}/hotels/${encodeURIComponent(id)}`, {
        headers: {
          'Authorization': `Bearer ${HOTEL_OTA_API_KEY}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return res.json({ success: true, data });
      }
    } catch (otaError) {
      logger.warn('Hotel OTA unavailable');
    }

    // Demo data
    return res.json({
      success: true,
      data: {
        id,
        name: 'Demo Hotel',
        description: 'Hotel description',
        starRating: 4,
        address: { line1: '123 Main St', city: 'New Delhi' },
        amenities: ['WiFi', 'Pool', 'Gym'],
      },
    });
  } catch (error: any) {
    logger.error('Hotel details error:', error);
    res.status(500).json({ success: false, message: 'Failed to get hotel details' });
  }
});

/**
 * Get room availability
 * GET /api/hotels/:id/rooms
 * SECURITY FIX: Added input validation for hotel ID and query parameters.
 */
router.get('/:id/rooms', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { checkIn, checkOut } = req.query;

    // SECURITY FIX: Validate hotel ID format
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id) || id.length > 100) {
      return res.status(400).json({ success: false, message: 'Invalid hotel ID format' });
    }

    // SECURITY FIX: Validate date formats if provided
    if (checkIn && !/^\d{4}-\d{2}-\d{2}$/.test(checkIn as string)) {
      return res.status(400).json({ success: false, message: 'Invalid checkIn date format' });
    }
    if (checkOut && !/^\d{4}-\d{2}-\d{2}$/.test(checkOut as string)) {
      return res.status(400).json({ success: false, message: 'Invalid checkOut date format' });
    }

    // Call Hotel OTA API
    try {
      const params = new URLSearchParams();
      if (checkIn) params.set('checkIn', checkIn as string);
      if (checkOut) params.set('checkOut', checkOut as string);
      const queryString = params.toString();
      const url = `${HOTEL_OTA_URL}/hotels/${encodeURIComponent(id)}/availability${queryString ? '?' + queryString : ''}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${HOTEL_OTA_API_KEY}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return res.json({ success: true, data });
      }
    } catch (otaError) {
      logger.warn('Hotel OTA unavailable');
    }

    // Demo rooms
    return res.json({
      success: true,
      data: {
        rooms: [
          {
            roomId: 'room_1',
            roomType: 'Deluxe Room',
            description: 'Spacious room with city view',
            maxOccupancy: 2,
            bedType: 'King',
            baseRate: 5000,
            corporateRate: 4500,
            discount: 10,
            amenities: ['WiFi', 'TV', 'Minibar'],
            cancellationPolicy: { freeCancellationUntil: '2024-12-31', cancellationFee: 500 },
            available: true,
            availableRooms: 5,
          },
          {
            roomId: 'room_2',
            roomType: 'Suite',
            description: 'Premium suite with lounge area',
            maxOccupancy: 4,
            bedType: 'King + Sofa',
            baseRate: 8000,
            corporateRate: 7200,
            discount: 10,
            amenities: ['WiFi', 'TV', 'Minibar', 'Bathtub'],
            cancellationPolicy: { freeCancellationUntil: '2024-12-31', cancellationFee: 1000 },
            available: true,
            availableRooms: 2,
          },
        ],
      },
    });
  } catch (error: any) {
    logger.error('Room availability error:', error);
    res.status(500).json({ success: false, message: 'Failed to get room availability' });
  }
});

// ============================================
// HOTEL BOOKING
// ============================================

/**
 * Create booking hold
 * POST /api/hotels/hold
 */
router.post('/hold', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = createBookingSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, message: 'Invalid booking parameters' });
    }

    const { hotelId, roomId, checkIn, checkOut, guestDetails } = result.data;

    // Call Hotel OTA API
    try {
      const response = await fetch(`${HOTEL_OTA_URL}/bookings/hold`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HOTEL_OTA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hotelId,
          roomId,
          checkIn,
          checkOut,
          guestName: guestDetails[0]?.firstName,
          guestEmail: guestDetails[0]?.email,
          guestPhone: guestDetails[0]?.phone,
          rooms: 1,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return res.json({
          success: true,
          data: {
            holdId: data.holdId,
            expiresAt: data.expiresAt,
            total: data.pricing?.total || 0,
          },
        });
      }
    } catch (otaError) {
      logger.warn('Hotel OTA unavailable');
    }

    // Demo hold
    const holdId = `HOLD${Date.now()}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    return res.json({
      success: true,
      data: {
        holdId,
        expiresAt,
        total: 5000,
        note: 'Demo hold - connect Hotel OTA for real bookings',
      },
    });
  } catch (error: any) {
    logger.error('Booking hold error:', error);
    res.status(500).json({ success: false, message: 'Failed to create booking hold' });
  }
});

/**
 * Confirm booking
 * POST /api/hotels/confirm
 */
router.post('/confirm', requireAuth, async (req: Request, res: Response) => {
  try {
    const { holdId, paymentMethod } = req.body;

    if (!holdId) {
      return res.status(400).json({ success: false, message: 'Hold ID required' });
    }

    // Call Hotel OTA API
    try {
      const response = await fetch(`${HOTEL_OTA_URL}/bookings/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HOTEL_OTA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ holdId, paymentMethod }),
      });

      if (response.ok) {
        const data = await response.json();
        return res.json({
          success: true,
          data: {
            bookingId: data.bookingId,
            confirmationNumber: data.confirmationNumber,
            status: data.status,
          },
        });
      }
    } catch (otaError) {
      logger.warn('Hotel OTA unavailable');
    }

    // Demo confirmation
    return res.json({
      success: true,
      data: {
        bookingId: `BOOK${Date.now()}`,
        confirmationNumber: `HT${Date.now().toString().slice(-8)}`,
        status: 'confirmed',
        note: 'Demo confirmation - connect Hotel OTA for real bookings',
      },
    });
  } catch (error: any) {
    logger.error('Booking confirm error:', error);
    res.status(500).json({ success: false, message: 'Failed to confirm booking' });
  }
});

/**
 * Cancel booking
 * POST /api/hotels/cancel
 * SECURITY FIX: Added validation for booking ID to prevent injection attacks.
 */
router.post('/cancel', requireAuth, async (req: Request, res: Response) => {
  try {
    const { bookingId, reason } = req.body;

    // SECURITY FIX: Validate booking ID format
    if (!bookingId || !/^[a-zA-Z0-9_-]+$/.test(bookingId) || bookingId.length > 100) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID format' });
    }

    // SECURITY FIX: Sanitize reason parameter
    const sanitizedReason = reason ? String(reason).slice(0, 500) : undefined;

    // Call Hotel OTA API
    try {
      const response = await fetch(`${HOTEL_OTA_URL}/bookings/${encodeURIComponent(bookingId)}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HOTEL_OTA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: sanitizedReason }),
      });

      if (response.ok) {
        return res.json({ success: true, data: response.json() });
      }
    } catch (otaError) {
      logger.warn('Hotel OTA unavailable');
    }

    // Demo cancellation
    return res.json({
      success: true,
      data: {
        bookingId,
        status: 'cancelled',
        refundAmount: 4500,
        cancellationCharge: 500,
        note: 'Demo cancellation - connect Hotel OTA for real cancellations',
      },
    });
  } catch (error: any) {
    logger.error('Booking cancel error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel booking' });
  }
});

/**
 * Get booking details
 * GET /api/hotels/bookings/:id
 * SECURITY FIX: Added validation for booking ID to prevent injection attacks.
 */
router.get('/bookings/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // SECURITY FIX: Validate booking ID format
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id) || id.length > 100) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID format' });
    }

    // Call Hotel OTA API
    try {
      const response = await fetch(`${HOTEL_OTA_URL}/bookings/${encodeURIComponent(id)}`, {
        headers: {
          'Authorization': `Bearer ${HOTEL_OTA_API_KEY}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return res.json({ success: true, data });
      }
    } catch (otaError) {
      logger.warn('Hotel OTA unavailable');
    }

    // Demo booking
    return res.json({
      success: true,
      data: {
        bookingId: id,
        confirmationNumber: `HT${id.slice(-8)}`,
        status: 'confirmed',
        hotel: { name: 'Demo Hotel', address: '123 Main St' },
        room: { type: 'Deluxe Room', bedType: 'King' },
        dates: { checkIn: '2024-12-20', checkOut: '2024-12-22' },
        guest: { name: 'Guest Name', email: 'guest@example.com' },
        pricing: { total: 10000, paid: 10000 },
      },
    });
  } catch (error: any) {
    logger.error('Get booking error:', error);
    res.status(500).json({ success: false, message: 'Failed to get booking' });
  }
});

export default router;
