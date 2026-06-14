/**
 * Hotel Booking Routes
 *
 * Integration with Hotel Service and StayOwn Service
 */

import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import axios from 'axios';
import crypto from 'crypto';
import { z } from 'zod';
import { Booking, BookingStatus, BookingType } from '../models';

const router = Router();

// ─── Configuration ────────────────────────────────────────────────────────────

const HOTEL_SERVICE_URL = process.env.HOTEL_SERVICE_URL || 'https://rez-hotel-service.onrender.com';
const STAYOWN_SERVICE_URL = process.env.STAYOWN_SERVICE_URL || 'https://rez-stayown-service.onrender.com';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

// ─── Validation Schemas ──────────────────────────────────────────────────────

const createHotelBookingSchema = z.object({
  userId: z.string(),
  source: z.enum(['hotel', 'stayown']).default('hotel'),
  propertyId: z.string(),
  roomTypeId: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.array(z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  })).min(1),
  contactEmail: z.string().email(),
  contactPhone: z.string(),
  pricing: z.object({
    baseAmount: z.number(),
    taxes: z.number().optional().default(0),
    fees: z.number().optional().default(0),
    discount: z.number().optional().default(0),
    total: z.number(),
  }),
  paymentOption: z.enum(['prepay', 'pay_at_hotel', 'partial']).optional().default('prepay'),
  metadata: z.record(z.unknown()).optional(),
});

// ─── Helper Functions ───────────────────────────────────────────────────────

async function createHotelBookingInSourceService(
  source: 'hotel' | 'stayown',
  bookingData: unknown
): Promise<{ success: boolean; data?; error?: string }> {
  const url = source === 'stayown'
    ? `${STAYOWN_SERVICE_URL}/api/hotels/bookings`
    : `${HOTEL_SERVICE_URL}/api/bookings`;

  try {
    const response = await axios.post(url, bookingData, {
      headers: {
        'Content-Type': 'application/json',
        'x-service-key': INTERNAL_SERVICE_TOKEN,
      },
      timeout: 10000,
    });

    return { success: true, data: response.data };
  } catch (error) {
    logger.error(`[Hotel Booking] Failed to create booking in ${source}:`, error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Booking creation failed',
    };
  }
}

async function fetchPropertyDetails(
  source: 'hotel' | 'stayown',
  propertyId: string
): Promise<unknown | null> {
  const url = source === 'stayown'
    ? `${STAYOWN_SERVICE_URL}/api/hotels/${propertyId}`
    : `${HOTEL_SERVICE_URL}/api/hotels/${propertyId}`;

  try {
    const response = await axios.get(url, {
      headers: {
        'x-service-key': INTERNAL_SERVICE_TOKEN,
      },
      timeout: 5000,
    });
    return response.data?.data || response.data;
  } catch (error) {
    return null;
  }
}

// ─── Routes ─────────────────────────────────────────────────────────────────

/**
 * Search hotels
 * GET /api/bookings/hotels/search?city=Mumbai
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { city, checkIn, checkOut, guests } = req.query;

    // Try StayOwn first (primary hotel service)
    try {
      const response = await axios.get(`${STAYOWN_SERVICE_URL}/api/hotels/search`, {
        params: { city, checkIn, checkOut, guests },
        headers: { 'x-service-key': INTERNAL_SERVICE_TOKEN },
        timeout: 10000,
      });

      res.json({
        success: true,
        source: 'stayown',
        data: response.data,
      });
      return;
    } catch (error) {
      logger.warn('[Hotel Booking] StayOwn search failed, trying Hotel Service');
    }

    // Fallback to Hotel Service
    try {
      const response = await axios.get(`${HOTEL_SERVICE_URL}/api/hotels/search`, {
        params: { city, checkIn, checkOut, rooms: guests },
        headers: { 'x-service-key': INTERNAL_SERVICE_TOKEN },
        timeout: 10000,
      });

      res.json({
        success: true,
        source: 'hotel',
        data: response.data,
      });
      return;
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Hotel search failed across all services',
        error: error.message,
      });
    }
  } catch (error) {
    logger.error('[Hotel Booking] Search error:', error);
    res.status(500).json({ success: false, message: 'Hotel search failed' });
  }
});

/**
 * Get hotel details
 * GET /api/bookings/hotels/:propertyId
 */
router.get('/:propertyId', async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const property = await fetchPropertyDetails('stayown', propertyId);

    if (property) {
      res.json({ success: true, source: 'stayown', data: property });
      return;
    }

    const hotelProperty = await fetchPropertyDetails('hotel', propertyId);

    if (hotelProperty) {
      res.json({ success: true, source: 'hotel', data: hotelProperty });
      return;
    }

    res.status(404).json({ success: false, message: 'Property not found' });
  } catch (error) {
    logger.error('[Hotel Booking] Get property error:', error);
    res.status(500).json({ success: false, message: 'Failed to get property details' });
  }
});

/**
 * Get room availability
 * GET /api/bookings/hotels/:propertyId/availability?checkIn=...&checkOut=...
 */
router.get('/:propertyId/availability', async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const { checkIn, checkOut } = req.query;

    try {
      const response = await axios.get(
        `${STAYOWN_SERVICE_URL}/api/hotels/${propertyId}/availability`,
        {
          params: { checkIn, checkOut },
          headers: { 'x-service-key': INTERNAL_SERVICE_TOKEN },
          timeout: 10000,
        }
      );

      res.json({ success: true, source: 'stayown', data: response.data });
      return;
    } catch (error) {
      logger.warn('[Hotel Booking] StayOwn availability failed');
    }

    res.status(503).json({ success: false, message: 'Availability check unavailable' });
  } catch (error) {
    logger.error('[Hotel Booking] Availability error:', error);
    res.status(500).json({ success: false, message: 'Failed to check availability' });
  }
});

/**
 * Calculate pricing
 * POST /api/bookings/hotels/pricing/calculate
 */
router.post('/pricing/calculate', async (req: Request, res: Response) => {
  try {
    const { propertyId, roomId, checkIn, checkOut } = req.body;

    try {
      const response = await axios.post(
        `${STAYOWN_SERVICE_URL}/api/hotels/pricing/calculate`,
        { propertyId, roomId, checkIn, checkOut },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-service-key': INTERNAL_SERVICE_TOKEN,
          },
          timeout: 10000,
        }
      );

      res.json({ success: true, source: 'stayown', data: response.data });
      return;
    } catch (error) {
      logger.warn('[Hotel Booking] StayOwn pricing failed');
    }

    res.status(503).json({ success: false, message: 'Pricing calculation unavailable' });
  } catch (error) {
    logger.error('[Hotel Booking] Pricing error:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate pricing' });
  }
});

/**
 * Create hotel booking
 * POST /api/bookings/hotels
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createHotelBookingSchema.parse(req.body);

    // Get property details for the booking
    const property = await fetchPropertyDetails(data.source as 'hotel' | 'stayown', data.propertyId);

    // Create booking in source service first
    const sourceResult = await createHotelBookingInSourceService(
      data.source as 'hotel' | 'stayown',
      {
        propertyId: data.propertyId,
        roomId: data.roomTypeId,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        guests: data.guests,
        guestDetails: data.guests,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
      }
    );

    if (!sourceResult.success) {
      // Still create a local booking record even if source fails
      logger.warn('[Hotel Booking] Source booking failed, creating local record');
    }

    // Create unified booking record with cryptographically secure IDs
    const bookingId = `HB${Date.now()}-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
    const confirmationNumber = sourceResult.data?.data?.confirmationNumber ||
      `MCB${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${crypto.randomInt(10000).toString().padStart(4, '0')}`;

    const booking = new Booking({
      bookingId,
      userId: data.userId,
      type: BookingType.HOTEL,
      status: BookingStatus.CONFIRMED,
      source: data.source as unknown,
      externalBookingId: sourceResult.data?.data?.bookingId,
      confirmationNumber,
      propertyId: data.propertyId,
      propertyName: property?.name || 'Unknown Property',
      roomTypeId: data.roomTypeId,
      roomName: property?.roomTypes?.find((r) => r.roomTypeId === data.roomTypeId)?.name,
      checkIn: new Date(data.checkIn),
      checkOut: new Date(data.checkOut),
      guests: data.guests,
      guestCount: data.guests.length,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      pricing: {
        ...data.pricing,
        currency: 'INR',
      },
      paymentStatus: data.paymentOption === 'prepay' ? 'paid' : 'pending',
      paymentMethod: data.paymentOption,
      metadata: {
        ...data.metadata,
        paymentOption: data.paymentOption,
        sourceBookingResult: sourceResult.success ? 'success' : 'failed',
      },
    });

    await booking.save();

    res.status(201).json({
      success: true,
      data: booking,
      sourceResult: sourceResult.success ? undefined : { error: sourceResult.error },
    });
  } catch (error) {
    logger.error('[Hotel Booking] Create error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Invalid booking data', errors: error.errors });
    }
    res.status(500).json({ success: false, message: 'Failed to create hotel booking' });
  }
});

/**
 * Get user's hotel bookings
 * GET /api/bookings/hotels/user/:userId
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const bookings = await Booking.find({
      userId,
      type: BookingType.HOTEL,
    })
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Booking.countDocuments({
      userId,
      type: BookingType.HOTEL,
    });

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('[Hotel Booking] User bookings error:', error);
    res.status(500).json({ success: false, message: 'Failed to get hotel bookings' });
  }
});

export default router;
