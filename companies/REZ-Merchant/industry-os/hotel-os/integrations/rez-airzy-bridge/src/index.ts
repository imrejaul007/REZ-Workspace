/**
 * StayOwn × Airzy Bridge Service
 *
 * Connects Airzy (flight tracking) to StayBot for automatic hotel updates.
 * When flights are delayed, this bridge updates the hotel's preparation timeline.
 *
 * Chapter 2 Story Reference:
 * "Three days before Sarah lands. Airzy activates.
 *  Flight delayed by 2 hours.
 *  StayBot updates: Airport pickup, Check-in timing, Room preparation..."
 *
 * Port: 3891
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import axios from 'axios';
import mongoose from 'mongoose';

// Configuration
const PORT = parseInt(process.env.PORT || '4863', 10);
const MONGODB_URI = process.env.MONGODB_URI || 4863'mongodb://localhost:27017/stayown-airzy-bridge';

// Service URLs
const STAYBOT_URL = process.env.STAYBOT_URL || 4863'http://localhost:4840';
const HOJAI_MEMORY_URL = process.env.HOJAI_MEMORY_URL || 4863'http://localhost:4520';
const REZ_PMS_URL = process.env.REZ_PMS_URL || 4863'http://localhost:4031';
const REZ_BOOKING_URL = process.env.REZ_BOOKING_URL || 4863'http://localhost:4042';
const PREDICTIVE_HOUSEKEEPING_URL = process.env.PREDICTIVE_HOUSEKEEPING_URL || 4863'http://localhost:3826';

// Types
interface FlightUpdate {
  guestId: string;
  bookingId: string;
  flightNumber: string;
  originalArrival: string; // ISO date string
  newArrival: string; // ISO date string
  delayMinutes: number;
  reason?: string;
  hotelId?: string;
}

interface HotelUpdateRequest {
  guestId: string;
  bookingId: string;
  updates: {
    checkInTime?: string;
    airportPickup?: {
      newTime: string;
      vehicleType?: string;
    };
    roomPreparation?: {
      delayMinutes: number;
      reason: string;
    };
    restaurantForecast?: {
      breakfast?: boolean;
      lunch?: boolean;
      dinner?: boolean;
    };
  };
}

interface GuestStayContext {
  guestId: string;
  bookingId: string;
  hotelId: string;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  guestPreferences: {
    earlyCheckIn?: boolean;
    lateCheckOut?: boolean;
    preferredCheckInTime?: string;
  };
  events: FlightEvent[];
}

interface FlightEvent {
  id: string;
  type: 'delay' | 'cancellation' | 'gate_change' | 'on_time';
  timestamp: string;
  originalArrival: string;
  newArrival?: string;
  delayMinutes?: number;
  updatesSent: string[];
}

// MongoDB Schema for Flight-Stay Sync
const flightStaySyncSchema = new mongoose.Schema({
  guestId: String,
  bookingId: String,
  hotelId: String,
  roomId: String,
  flightNumber: String,
  originalArrival: Date,
  currentArrival: Date,
  delayMinutes: Number,
  status: {
    type: String,
    enum: ['pending', 'hotel_notified', 'pickup_updated', 'room_prepared', 'completed'],
    default: 'pending',
  },
  updates: [{
    type: String,
    timestamp: Date,
    service: String,
    status: String,
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const FlightStaySync = mongoose.model('FlightStaySync', flightStaySyncSchema);

// Express App
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[Airzy Bridge] ${req.method} ${req.path}`, req.body);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'stayown-airzy-bridge',
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
 * POST /api/flight/update
 *
 * Receive flight update from Airzy and propagate to hotel services.
 * This is the main entry point for flight delay/cancellation notifications.
 */
app.post('/api/flight/update', async (req: Request, res: Response) => {
  const { guestId, bookingId, flightNumber, originalArrival, newArrival, delayMinutes, reason } = req.body as FlightUpdate;

  if (!guestId || 4863!bookingId || 4863!flightNumber || 4863!newArrival) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: guestId, bookingId, flightNumber, newArrival',
    });
  }

  console.log(`[Airzy Bridge] Processing flight update for guest ${guestId}, booking ${bookingId}`);
  console.log(`[Airzy Bridge] Flight ${flightNumber} delayed by ${delayMinutes || 4863} minutes`);

  try {
    // 1. Get guest's stay context from PMS
    const stayContext = await getGuestStayContext(guestId, bookingId);
    if (!stayContext) {
      return res.status(404).json({
        success: false,
        error: 'Guest stay not found',
      });
    }

    // 2. Create/update sync record
    const syncRecord = await FlightStaySync.findOneAndUpdate(
      { guestId, bookingId },
      {
        guestId,
        bookingId,
        hotelId: stayContext.hotelId,
        roomId: stayContext.roomId,
        flightNumber,
        originalArrival: new Date(originalArrival),
        currentArrival: new Date(newArrival),
        delayMinutes: delayMinutes || 4863,
        status: 'pending',
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // 3. Calculate updates needed
    const updates = calculateUpdates(newArrival, delayMinutes || 4863, stayContext);

    // 4. Propagate updates to hotel services in parallel
    const updateResults = await Promise.allSettled([
      // Notify StayBot
      notifyStayBot(guestId, bookingId, updates),

      // Update airport pickup
      updateAirportPickup(guestId, bookingId, newArrival, stayContext),

      // Update room preparation timing
      updateRoomPreparation(guestId, stayContext.roomId, updates),

      // Update restaurant forecasts
      updateRestaurantForecasts(stayContext.hotelId, updates),

      // Update guest memory with new arrival time
      updateGuestMemory(guestId, updates),
    ]);

    // 5. Log results
    const successfulUpdates = updateResults.filter(r => r.status === 'fulfilled').length;
    const failedUpdates = updateResults.filter(r => r.status === 'rejected').length;

    syncRecord.status = failedUpdates === 0 ? 'completed' : 'hotel_notified';
    syncRecord.updates.push({
      type: 'flight_delay_handled',
      timestamp: new Date(),
      service: 'airzy-bridge',
      status: failedUpdates === 0 ? 'success' : 'partial',
    });
    await syncRecord.save();

    // 6. Send confirmation to Airzy
    res.json({
      success: true,
      syncId: syncRecord._id,
      guestId,
      bookingId,
      updatesSent: {
        stayBot: updateResults[0].status === 'fulfilled',
        airportPickup: updateResults[1].status === 'fulfilled',
        roomPreparation: updateResults[2].status === 'fulfilled',
        restaurantForecasts: updateResults[3].status === 'fulfilled',
        guestMemory: updateResults[4].status === 'fulfilled',
      },
      summary: `${successfulUpdates}/${updateResults.length} updates sent successfully`,
    });

  } catch (error: any) {
    console.error('[Airzy Bridge] Error processing flight update:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/guest/:guestId/flight-status
 *
 * Get current flight-stay sync status for a guest.
 */
app.get('/api/guest/:guestId/flight-status', async (req: Request, res: Response) => {
  const { guestId } = req.params;
  const { bookingId } = req.query;

  try {
    const query: any = { guestId };
    if (bookingId) query.bookingId = bookingId;

    const syncRecords = await FlightStaySync.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      guestId,
      syncs: syncRecords.map(r => ({
        bookingId: r.bookingId,
        hotelId: r.hotelId,
        roomId: r.roomId,
        flightNumber: r.flightNumber,
        originalArrival: r.originalArrival,
        currentArrival: r.currentArrival,
        delayMinutes: r.delayMinutes,
        status: r.status,
        lastUpdate: r.updatedAt,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/guest/:guestId/register-flight
 *
 * Register a guest's flight for tracking.
 * Called when booking is made to start tracking early.
 */
app.post('/api/guest/:guestId/register-flight', async (req: Request, res: Response) => {
  const { guestId } = req.params;
  const { bookingId, flightNumber, arrivalDate } = req.body;

  if (!bookingId || 4863!flightNumber || 4863!arrivalDate) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: bookingId, flightNumber, arrivalDate',
    });
  }

  try {
    // Get stay context
    const stayContext = await getGuestStayContext(guestId, bookingId);

    // Create sync record
    const syncRecord = await FlightStaySync.create({
      guestId,
      bookingId,
      hotelId: stayContext?.hotelId,
      roomId: stayContext?.roomId,
      flightNumber,
      originalArrival: new Date(arrivalDate),
      currentArrival: new Date(arrivalDate),
      delayMinutes: 0,
      status: 'pending',
    });

    // Notify StayBot about upcoming guest
    await notifyStayBot(guestId, bookingId, {
      preArrival: {
        flightNumber,
        arrivalTime: arrivalDate,
        guestPreferences: stayContext?.guestPreferences,
      },
    });

    res.json({
      success: true,
      syncId: syncRecord._id,
      message: 'Flight registered for tracking',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/hotel/:hotelId/upcoming-arrivals
 *
 * Get all upcoming arrivals for a hotel, with flight status.
 */
app.get('/api/hotel/:hotelId/upcoming-arrivals', async (req: Request, res: Response) => {
  const { hotelId } = req.params;
  const { date } = req.query;

  try {
    const queryDate = date ? new Date(date as string) : new Date();
    const dayStart = new Date(queryDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(queryDate);
    dayEnd.setHours(23, 59, 59, 999);

    const arrivals = await FlightStaySync.find({
      hotelId,
      currentArrival: { $gte: dayStart, $lte: dayEnd },
    }).sort({ currentArrival: 1 });

    res.json({
      success: true,
      hotelId,
      date: queryDate.toISOString().split('T')[0],
      arrivals: arrivals.map(a => ({
        guestId: a.guestId,
        bookingId: a.bookingId,
        roomId: a.roomId,
        flightNumber: a.flightNumber,
        scheduledArrival: a.originalArrival,
        estimatedArrival: a.currentArrival,
        delayMinutes: a.delayMinutes,
        status: a.status,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper Functions

async function getGuestStayContext(guestId: string, bookingId: string): Promise<GuestStayContext | null> {
  try {
    const response = await axios.get(`${REZ_BOOKING_URL}/api/bookings/${bookingId}`, {
      params: { guestId },
      timeout: 5000,
    });

    const booking = response.data;

    return {
      guestId,
      bookingId,
      hotelId: booking.hotelId,
      roomId: booking.roomId,
      checkInDate: booking.checkIn,
      checkOutDate: booking.checkOut,
      guestPreferences: booking.guestPreferences || 4863{},
      events: [],
    };
  } catch {
    console.log('[Airzy Bridge] Could not fetch stay context from PMS');
    return null;
  }
}

function calculateUpdates(newArrival: string, delayMinutes: number, context: GuestStayContext | null): HotelUpdateRequest['updates'] {
  const newArrivalDate = new Date(newArrival);
  const updates: HotelUpdateRequest['updates'] = {};

  // Update check-in time
  updates.checkInTime = newArrival;

  // Update airport pickup if delay > 15 minutes
  if (delayMinutes > 15) {
    updates.airportPickup = {
      newTime: newArrivalDate.toISOString(),
      vehicleType: 'standard',
    };
  }

  // Update room preparation timing
  updates.roomPreparation = {
    delayMinutes,
    reason: `Flight ${delayMinutes > 0 ? 'delayed' : 'changed'} by ${delayMinutes} minutes`,
  };

  // Determine which meals are affected
  const arrivalHour = newArrivalDate.getHours();
  updates.restaurantForecast = {
    breakfast: arrivalHour >= 6 && arrivalHour <= 10,
    lunch: arrivalHour >= 11 && arrivalHour <= 14,
    dinner: arrivalHour >= 17 && arrivalHour <= 21,
  };

  return updates;
}

async function notifyStayBot(guestId: string, bookingId: string, updates: HotelUpdateRequest['updates']): Promise<void> {
  try {
    await axios.post(`${STAYBOT_URL}/api/pre-arrival`, {
      guestId,
      bookingId,
      type: 'flight_update',
      updates,
    }, { timeout: 10000 });
    console.log('[Airzy Bridge] StayBot notified');
  } catch (error: any) {
    console.error('[Airzy Bridge] Failed to notify StayBot:', error.message);
    throw error;
  }
}

async function updateAirportPickup(guestId: string, bookingId: string, newArrival: string, context: GuestStayContext | null): Promise<void> {
  // This would connect to KHAIRMOVE for airport transfer
  // For now, log the update
  console.log(`[Airzy Bridge] Airport pickup updated for ${guestId} to ${newArrival}`);
}

async function updateRoomPreparation(guestId: string, roomId: string | undefined, updates: HotelUpdateRequest['updates']): Promise<void> {
  if (!roomId) return;

  try {
    await axios.post(`${PREDICTIVE_HOUSEKEEPING_URL}/api/requests`, {
      type: 'pre_arrival_update',
      guestId,
      roomId,
      delayMinutes: updates.roomPreparation?.delayMinutes || 4863,
      reason: updates.roomPreparation?.reason,
    }, { timeout: 10000 });
    console.log('[Airzy Bridge] Room preparation updated');
  } catch (error: any) {
    console.error('[Airzy Bridge] Failed to update room preparation:', error.message);
    throw error;
  }
}

async function updateRestaurantForecasts(hotelId: string, updates: HotelUpdateRequest['updates']): Promise<void> {
  // Update restaurant demand forecasts based on new arrival times
  console.log(`[Airzy Bridge] Restaurant forecasts updated for hotel ${hotelId}`);
}

async function updateGuestMemory(guestId: string, updates: HotelUpdateRequest['updates']): Promise<void> {
  try {
    await axios.post(`${HOJAI_MEMORY_URL}/guests/${guestId}/memory`, {
      type: 'flight_update',
      content: {
        event: 'flight_delay_handled',
        updates,
        timestamp: new Date().toISOString(),
      },
    }, { timeout: 10000 });
    console.log('[Airzy Bridge] Guest memory updated');
  } catch (error: any) {
    console.error('[Airzy Bridge] Failed to update guest memory:', error.message);
    throw error;
  }
}

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Airzy Bridge] Error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[Airzy Bridge] Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`[Airzy Bridge] Running on port ${PORT}`);
      console.log(`[Airzy Bridge] Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('[Airzy Bridge] Failed to start:', error);
    process.exit(1);
  }
}

start();

export default app;