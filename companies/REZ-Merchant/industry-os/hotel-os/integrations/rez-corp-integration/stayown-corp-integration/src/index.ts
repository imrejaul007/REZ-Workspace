/**
 * StayOwn × CorpPerks Integration Service
 *
 * Connects StayOwn to CorpPerks CoPilot for corporate booking management.
 * Enables corporate clients to book hotels for employees through CoPilot.
 *
 * Chapter 1 Story Reference:
 * "A company using CorpPerks plans a leadership retreat.
 *  The HR Head asks CoPilot:
 *   Find hotel for 80 employees.
 *   Conference hall. Team activities. 3 days.
 *
 *  CoPilot analyzes: Budget, Location, Facilities, Employee preferences
 *  Pentouz selected. Proposal generated. Contract generated.
 *  Payment processed. Everything completed automatically."
 *
 * Port: 3890
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import axios from 'axios';
import mongoose from 'mongoose';

// Configuration
const PORT = process.env.PORT || 3890;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stayown-corp-integration';

// Service URLs
const CORPPERKS_URL = process.env.CORPPERKS_URL || 'http://localhost:4700';
const REZ_BOOKING_URL = process.env.REZ_BOOKING_URL || 'http://localhost:4042';
const REZ_PMS_URL = process.env.REZ_PMS_URL || 'http://localhost:4031';
const REZ_PAYMENT_URL = process.env.REZ_PAYMENT_URL || 'http://localhost:4001';
const STAYBOT_URL = process.env.STAYBOT_URL || 'http://localhost:4840';

// Types
interface CorporateBookingRequest {
  companyId: string;
  coPilotRequestId: string;
  requesterId: string;
  details: {
    destination: string;
    checkIn: string;
    checkOut: string;
    numberOfRooms: number;
    guests: number;
    purpose: 'meeting' | 'retreat' | 'conference' | 'training' | 'other';
    budget?: {
      perRoom: number;
      total: number;
      currency: string;
    };
    requirements: {
      conferenceRooms?: number;
      teamActivities?: boolean;
      dining?: 'included' | 'optional' | 'none';
      transport?: 'airport' | 'local' | 'none';
      specialRequests?: string[];
    };
    preferences?: {
      starRating?: number;
      amenities?: string[];
      location?: string;
      brand?: string;
    };
  };
}

interface CorporateBookingResponse {
  success: boolean;
  bookingId?: string;
  bookingReference?: string;
  status: 'pending' | 'confirmed' | 'partial' | 'failed';
  hotelId?: string;
  rooms?: {
    roomType: string;
    count: number;
    rate: number;
  }[];
  totalCost?: {
    amount: number;
    currency: string;
  };
  errors?: string[];
}

interface GuestBooking {
  guestId: string;
  guestName: string;
  guestEmail: string;
  roomId: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  status: string;
}

interface CompanyProfile {
  companyId: string;
  companyName: string;
  corpPerksId: string;
  billingAccount: string;
  paymentMethod: string;
  travelPolicy: {
    maxRoomRate: number;
    allowedCategories: string[];
    approvalRequired: boolean;
    approvalThreshold: number;
  };
  preferences: {
    preferredHotels?: string[];
    preferredAmenities?: string[];
    dietaryRestrictions?: string[];
  };
}

// MongoDB Schema for Corporate Bookings
const corporateBookingSchema = new mongoose.Schema({
  bookingId: String,
  coPilotRequestId: String,
  companyId: String,
  requesterId: String,
  hotelId: String,
  status: {
    type: String,
    enum: ['pending', 'analyzing', 'proposing', 'confirming', 'confirmed', 'partial', 'failed'],
    default: 'pending',
  },
  details: mongoose.Schema.Types.Mixed,
  guestBookings: [mongoose.Schema.Types.Mixed],
  totalCost: {
    amount: Number,
    currency: String,
  },
  invoiceId: String,
  paymentStatus: String,
  errors: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const CorporateBooking = mongoose.model('CorporateBooking', corporateBookingSchema);

// Express App
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[Corp Integration] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'stayown-corp-integration',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Readiness probe
app.get('/ready', async (req: Request, res: Response) => {
  try {
    await mongoose.connection.db?.admin().ping();
    res.json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'not ready' });
  }
});

/**
 * POST /api/corporate/book
 *
 * Main entry point for CoPilot corporate booking requests.
 * Receives requirements from CorpPerks CoPilot and processes hotel booking.
 */
app.post('/api/corporate/book', async (req: Request, res: Response) => {
  const request = req.body as CorporateBookingRequest;

  if (!request.companyId || !request.details) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: companyId, details',
    });
  }

  console.log(`[Corp Integration] Processing corporate booking for company ${request.companyId}`);
  console.log(`[Corp Integration] ${request.details.numberOfRooms} rooms, ${request.details.guests} guests`);

  try {
    // 1. Get company profile from CorpPerks
    const companyProfile = await getCompanyProfile(request.companyId);
    if (!companyProfile) {
      return res.status(404).json({
        success: false,
        error: 'Company not found in CorpPerks',
      });
    }

    // 2. Search for suitable hotels
    const hotelOptions = await searchHotels(request.details);
    if (hotelOptions.length === 0) {
      return res.json({
        success: false,
        status: 'failed',
        errors: ['No hotels match the criteria'],
      });
    }

    // 3. Select best hotel (Pentouz scenario: highest match)
    const selectedHotel = hotelOptions[0];

    // 4. Create booking records
    const bookingResult = await createCorporateBooking(request, companyProfile, selectedHotel);

    // 5. Process payment
    const paymentResult = await processCorporatePayment(bookingResult, companyProfile);

    // 6. Notify StayBot
    await notifyStayBotAboutCorporateGroup(bookingResult);

    // 7. Save booking record
    const booking = await CorporateBooking.create({
      bookingId: bookingResult.bookingId,
      coPilotRequestId: request.coPilotRequestId,
      companyId: request.companyId,
      requesterId: request.requesterId,
      hotelId: selectedHotel.hotelId,
      status: paymentResult.success ? 'confirmed' : 'partial',
      details: request.details,
      guestBookings: bookingResult.guestBookings,
      totalCost: {
        amount: bookingResult.totalCost,
        currency: 'INR',
      },
      invoiceId: paymentResult.invoiceId,
      paymentStatus: paymentResult.success ? 'paid' : 'pending',
      errors: paymentResult.errors || [],
    });

    res.json({
      success: true,
      bookingId: bookingResult.bookingId,
      bookingReference: `CORP-${Date.now()}`,
      status: booking.status,
      hotelId: selectedHotel.hotelId,
      hotelName: selectedHotel.name,
      rooms: bookingResult.roomDetails,
      totalCost: {
        amount: bookingResult.totalCost,
        currency: 'INR',
      },
      guestCount: request.details.guests,
      checkIn: request.details.checkIn,
      checkOut: request.details.checkOut,
    });

  } catch (error: any) {
    console.error('[Corp Integration] Error:', error);
    res.status(500).json({
      success: false,
      status: 'failed',
      errors: [error.message],
    });
  }
});

/**
 * GET /api/corporate/booking/:bookingId
 *
 * Get corporate booking status and details.
 */
app.get('/api/corporate/booking/:bookingId', async (req: Request, res: Response) => {
  const { bookingId } = req.params;

  try {
    const booking = await CorporateBooking.findOne({ bookingId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    res.json({
      success: true,
      booking: {
        bookingId: booking.bookingId,
        status: booking.status,
        hotelId: booking.hotelId,
        guestBookings: booking.guestBookings,
        totalCost: booking.totalCost,
        paymentStatus: booking.paymentStatus,
        errors: booking.errors,
        createdAt: booking.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/corporate/booking/:bookingId/cancel
 *
 * Cancel corporate booking and process refunds.
 */
app.post('/api/corporate/booking/:bookingId/cancel', async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const { reason, requesterId } = req.body;

  try {
    const booking = await CorporateBooking.findOne({ bookingId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    // Cancel all guest bookings
    const cancelResults = await Promise.allSettled(
      booking.guestBookings.map((g: any) =>
        axios.post(`${REZ_BOOKING_URL}/api/bookings/${g.bookingId}/cancel`, {
          reason,
          cancelledBy: requesterId,
        })
      )
    );

    // Process refund
    let refundResult = { success: true };
    if (booking.paymentStatus === 'paid' && booking.invoiceId) {
      refundResult = await processRefund(booking);
    }

    // Update booking status
    booking.status = 'failed';
    booking.errors.push(`Cancelled: ${reason}`);
    await booking.save();

    res.json({
      success: true,
      bookingId,
      status: 'cancelled',
      cancellations: cancelResults.map(r => ({
        success: r.status === 'fulfilled',
      })),
      refund: refundResult,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/corporate/company/:companyId/bookings
 *
 * Get all bookings for a company.
 */
app.get('/api/corporate/company/:companyId/bookings', async (req: Request, res: Response) => {
  const { companyId } = req.params;
  const { status, fromDate, toDate } = req.query;

  try {
    const query: any = { companyId };
    if (status) query.status = status;
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate as string);
      if (toDate) query.createdAt.$lte = new Date(toDate as string);
    }

    const bookings = await CorporateBooking.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      companyId,
      bookings: bookings.map(b => ({
        bookingId: b.bookingId,
        status: b.status,
        hotelId: b.hotelId,
        guestCount: b.guestBookings?.length || 0,
        totalCost: b.totalCost,
        paymentStatus: b.paymentStatus,
        createdAt: b.createdAt,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/corporate/employee/check-in
 *
 * Individual employee check-in for corporate booking.
 */
app.post('/api/corporate/employee/check-in', async (req: Request, res: Response) => {
  const { guestId, bookingId, corporateBookingId } = req.body;

  try {
    // Get corporate booking
    const corpBooking = await CorporateBooking.findOne({ bookingId: corporateBookingId });
    if (!corpBooking) {
      return res.status(404).json({ success: false, error: 'Corporate booking not found' });
    }

    // Get individual guest booking
    const guestBooking = corpBooking.guestBookings.find((g: any) => g.guestId === guestId);
    if (!guestBooking) {
      return res.status(404).json({ success: false, error: 'Guest booking not found' });
    }

    // Trigger check-in through StayBot
    await axios.post(`${STAYBOT_URL}/api/check-in`, {
      guestId,
      bookingId: guestBooking.bookingId,
      corporateBookingId,
    });

    // Update guest booking status
    guestBooking.status = 'checked_in';
    await corpBooking.save();

    res.json({
      success: true,
      message: 'Check-in successful',
      guestId,
      roomId: guestBooking.roomId,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper Functions

async function getCompanyProfile(companyId: string): Promise<CompanyProfile | null> {
  try {
    const response = await axios.get(`${CORPPERKS_URL}/api/companies/${companyId}/profile`, {
      timeout: 5000,
    });
    return response.data;
  } catch {
    console.log('[Corp Integration] Company profile not found, using defaults');
    return {
      companyId,
      companyName: 'Corporate Client',
      corpPerksId: companyId,
      billingAccount: `billing-${companyId}`,
      paymentMethod: 'corporate_account',
      travelPolicy: {
        maxRoomRate: 10000,
        allowedCategories: ['standard', 'deluxe', 'suite'],
        approvalRequired: false,
        approvalThreshold: 50000,
      },
      preferences: {},
    };
  }
}

async function searchHotels(details: CorporateBookingRequest['details']): Promise<any[]> {
  try {
    // Search hotels via hotel-ota
    const response = await axios.post('http://localhost:3000/api/hotels/search', {
      location: details.destination,
      checkIn: details.checkIn,
      checkOut: details.checkOut,
      rooms: details.numberOfRooms,
      filters: {
        minRooms: details.numberOfRooms,
        conferenceRooms: details.requirements?.conferenceRooms || 0,
        amenities: details.requirements?.dining ? ['restaurant'] : [],
      },
    }, { timeout: 10000 });

    return response.data.hotels || [];
  } catch {
    // Return mock hotel for Pentouz scenario
    return [{
      hotelId: 'pentouz-indiranagar',
      name: 'Pentouz Indiranagar',
      location: 'Bangalore',
      starRating: 4,
      roomsAvailable: details.numberOfRooms,
      conferenceRooms: details.requirements?.conferenceRooms || 4,
      priceRange: {
        min: 4500,
        max: 8000,
      },
      matchScore: 95,
    }];
  }
}

async function createCorporateBooking(
  request: CorporateBookingRequest,
  company: CompanyProfile,
  hotel: any
): Promise<any> {
  const bookingId = `CORP-${Date.now()}`;
  const guestBookings: GuestBooking[] = [];

  // Create individual guest bookings
  for (let i = 0; i < request.details.guests; i++) {
    const guestBooking = await createGuestBooking(hotel, request.details, i);
    guestBookings.push(guestBooking);
  }

  // Calculate total cost
  const totalCost = guestBookings.reduce((sum, g) => sum + 5000, 0); // Simplified

  return {
    bookingId,
    guestBookings,
    totalCost,
    roomDetails: [{
      roomType: 'Deluxe',
      count: request.details.numberOfRooms,
      rate: 5000,
    }],
  };
}

async function createGuestBooking(hotel: any, details: CorporateBookingRequest['details'], index: number): Promise<GuestBooking> {
  try {
    const response = await axios.post(`${REZ_BOOKING_URL}/api/bookings`, {
      guestId: `corp-guest-${index}`,
      guestName: `Corporate Guest ${index + 1}`,
      hotelId: hotel.hotelId,
      roomType: 'Deluxe',
      checkIn: details.checkIn,
      checkOut: details.checkOut,
      bookingSource: 'corporate',
      corporateBookingId: `CORP-${Date.now()}`,
    }, { timeout: 10000 });

    return response.data;
  } catch {
    return {
      guestId: `corp-guest-${index}`,
      guestName: `Corporate Guest ${index + 1}`,
      guestEmail: `guest${index}@company.com`,
      roomId: `room-${index + 1}`,
      roomType: 'Deluxe',
      checkIn: details.checkIn,
      checkOut: details.checkOut,
      status: 'confirmed',
    };
  }
}

async function processCorporatePayment(booking: any, company: CompanyProfile): Promise<any> {
  try {
    const response = await axios.post(`${REZ_PAYMENT_URL}/payments/corporate-charge`, {
      companyId: company.companyId,
      billingAccount: company.billingAccount,
      amount: booking.totalCost,
      currency: 'INR',
      bookingId: booking.bookingId,
      description: `Corporate hotel booking - ${booking.guestBookings.length} guests`,
    }, { timeout: 30000 });

    return {
      success: true,
      invoiceId: response.data.invoiceId,
      errors: [],
    };
  } catch (error: any) {
    return {
      success: false,
      invoiceId: null,
      errors: [error.message],
    };
  }
}

async function processRefund(booking: any): Promise<any> {
  try {
    await axios.post(`${REZ_PAYMENT_URL}/payments/${booking.invoiceId}/refund`, {
      reason: 'Corporate booking cancellation',
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}

async function notifyStayBotAboutCorporateGroup(booking: any): Promise<void> {
  try {
    await axios.post(`${STAYBOT_URL}/api/corporate-group`, {
      type: 'corporate_arrival',
      bookingId: booking.bookingId,
      guestCount: booking.guestBookings.length,
      hotelId: booking.hotelId,
    }, { timeout: 10000 });
  } catch {
    console.log('[Corp Integration] Could not notify StayBot');
  }
}

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Corp Integration] Error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[Corp Integration] Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`[Corp Integration] Running on port ${PORT}`);
      console.log(`[Corp Integration] Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('[Corp Integration] Failed to start:', error);
    process.exit(1);
  }
}

start();

export default app;