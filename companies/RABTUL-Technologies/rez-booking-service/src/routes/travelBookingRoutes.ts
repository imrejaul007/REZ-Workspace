/**
 * Travel Booking Routes
 *
 * Integration with Travel Service
 */

import { Router, Request, Response } from 'express';
import axios from 'axios';
import { z } from 'zod';
import { Booking, BookingStatus, BookingType } from '../models';

const router = Router();

// ─── Configuration ────────────────────────────────────────────────────────────

const TRAVEL_SERVICE_URL = process.env.TRAVEL_SERVICE_URL || 'https://rez-travel-service.onrender.com';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

// ─── Validation Schemas ──────────────────────────────────────────────────────

const createTravelBookingSchema = z.object({
  userId: z.string(),
  travelType: z.enum(['flight', 'train', 'bus', 'cab']),
  travelId: z.string(),
  passengers: z.array(z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
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
  metadata: z.record(z.unknown()).optional(),
});

// ─── Routes ─────────────────────────────────────────────────────────────────

/**
 * Search flights
 * GET /api/bookings/travel/flights/search?origin=DEL&destination=BOM&departureDate=2024-03-15
 */
router.get('/flights/search', async (req: Request, res: Response) => {
  try {
    const { origin, destination, departureDate, returnDate, passengers, class: travelClass } = req.query;

    const response = await axios.get(`${TRAVEL_SERVICE_URL}/api/travel/flights/search`, {
      params: { origin, destination, departureDate, returnDate, passengers, class: travelClass },
      headers: { 'x-service-key': INTERNAL_SERVICE_TOKEN },
      timeout: 15000,
    });

    res.json({ success: true, data: response.data });
  } catch (error) {
    logger.error('[Travel Booking] Flight search error:', error);
    res.status(500).json({
      success: false,
      message: 'Flight search failed',
      error: error.response?.data?.message || error.message,
    });
  }
});

/**
 * Search trains
 * GET /api/bookings/travel/trains/search?from=DEL&to=BOM&date=2024-03-15
 */
router.get('/trains/search', async (req: Request, res: Response) => {
  try {
    const { from, to, date } = req.query;

    const response = await axios.get(`${TRAVEL_SERVICE_URL}/api/travel/trains/search`, {
      params: { from, to, date },
      headers: { 'x-service-key': INTERNAL_SERVICE_TOKEN },
      timeout: 15000,
    });

    res.json({ success: true, data: response.data });
  } catch (error) {
    logger.error('[Travel Booking] Train search error:', error);
    res.status(500).json({
      success: false,
      message: 'Train search failed',
      error: error.response?.data?.message || error.message,
    });
  }
});

/**
 * Search buses
 * GET /api/bookings/travel/buses/search?from=Mumbai&to=Pune&date=2024-03-15
 */
router.get('/buses/search', async (req: Request, res: Response) => {
  try {
    const { from, to, date } = req.query;

    const response = await axios.get(`${TRAVEL_SERVICE_URL}/api/travel/buses/search`, {
      params: { from, to, date },
      headers: { 'x-service-key': INTERNAL_SERVICE_TOKEN },
      timeout: 15000,
    });

    res.json({ success: true, data: response.data });
  } catch (error) {
    logger.error('[Travel Booking] Bus search error:', error);
    res.status(500).json({
      success: false,
      message: 'Bus search failed',
      error: error.response?.data?.message || error.message,
    });
  }
});

/**
 * Get cab quotes
 * GET /api/bookings/travel/cabs/quotes?pickup=...&dropoff=...&date=...
 */
router.get('/cabs/quotes', async (req: Request, res: Response) => {
  try {
    const { pickup, dropoff, date } = req.query;

    const response = await axios.get(`${TRAVEL_SERVICE_URL}/api/travel/cabs/quotes`, {
      params: { pickup, dropoff, date },
      headers: { 'x-service-key': INTERNAL_SERVICE_TOKEN },
      timeout: 15000,
    });

    res.json({ success: true, data: response.data });
  } catch (error) {
    logger.error('[Travel Booking] Cab quotes error:', error);
    res.status(500).json({
      success: false,
      message: 'Cab quotes failed',
      error: error.response?.data?.message || error.message,
    });
  }
});

/**
 * Book travel
 * POST /api/bookings/travel
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createTravelBookingSchema.parse(req.body);

    // Map travel type to booking type
    const bookingTypeMap = {
      flight: BookingType.FLIGHT,
      train: BookingType.TRAIN,
      bus: BookingType.BUS,
      cab: BookingType.CAB,
    };

    // Try to create booking in Travel Service
    let externalBookingId: string | undefined;
    let confirmationNumber: string | undefined;
    let pnr: string | undefined;

    const endpointMap = {
      flight: `${TRAVEL_SERVICE_URL}/api/travel/flights/book`,
      train: `${TRAVEL_SERVICE_URL}/api/travel/trains/book`,
      bus: `${TRAVEL_SERVICE_URL}/api/travel/buses/book`,
      cab: `${TRAVEL_SERVICE_URL}/api/travel/cabs/book`,
    };

    try {
      const response = await axios.post(
        endpointMap[data.travelType],
        {
          [`${data.travelType}Id`]: data.travelId,
          passengers: data.passengers,
          contactDetails: {
            email: data.contactEmail,
            phone: data.contactPhone,
          },
          userId: data.userId,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-service-key': INTERNAL_SERVICE_TOKEN,
          },
          timeout: 15000,
        }
      );

      externalBookingId = response.data?.data?.bookingId;
      confirmationNumber = response.data?.data?.pnr || response.data?.data?.confirmationNumber;
      pnr = response.data?.data?.pnr;
    } catch (error) {
      console.warn('[Travel Booking] Travel service booking failed:', error.message);
      // Continue with local booking record
    }

    // Create unified booking record with cryptographically secure IDs
    const bookingId = `${data.travelType.charAt(0).toUpperCase()}${Date.now()}-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
    const finalConfirmationNumber = confirmationNumber ||
      `TRV${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${crypto.randomInt(10000).toString().padStart(4, '0')}`;

    // Set travel-specific fields
    const travelFields: unknown = {
      flightId: data.travelType === 'flight' ? data.travelId : undefined,
      trainId: data.travelType === 'train' ? data.travelId : undefined,
      busId: data.travelType === 'bus' ? data.travelId : undefined,
      cabId: data.travelType === 'cab' ? data.travelId : undefined,
    };

    const booking = new Booking({
      bookingId,
      userId: data.userId,
      type: bookingTypeMap[data.travelType],
      status: BookingStatus.CONFIRMED,
      source: 'travel',
      externalBookingId,
      confirmationNumber: finalConfirmationNumber,
      passengers: data.passengers,
      guestCount: data.passengers.length,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      pricing: {
        ...data.pricing,
        currency: 'INR',
      },
      paymentStatus: 'pending',
      metadata: {
        ...data.metadata,
        pnr,
        bookingSource: externalBookingId ? 'travel_service' : 'local',
      },
    });

    // Add travel fields
    Object.assign(booking, travelFields);

    await booking.save();

    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    logger.error('[Travel Booking] Create error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Invalid booking data', errors: error.errors });
    }
    res.status(500).json({ success: false, message: 'Failed to create travel booking' });
  }
});

/**
 * Get user's travel bookings
 * GET /api/bookings/travel/user/:userId?type=flight
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { type, page = 1, limit = 20 } = req.query;

    const typeMap: Record<string, BookingType> = {
      flight: BookingType.FLIGHT,
      train: BookingType.TRAIN,
      bus: BookingType.BUS,
      cab: BookingType.CAB,
    };

    const filter: unknown = { userId, type: { $in: Object.values(typeMap) } };
    if (type && typeMap[type as string]) {
      filter.type = typeMap[type as string];
    }

    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Booking.countDocuments(filter);

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
    logger.error('[Travel Booking] User bookings error:', error);
    res.status(500).json({ success: false, message: 'Failed to get travel bookings' });
  }
});

export default router;
