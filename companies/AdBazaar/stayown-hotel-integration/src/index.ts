/**
 * StayOwn Hotel Integration Service
 * Connects AdBazaar to StayOwn for hospitality advertising
 *
 * Port: 4952
 * Purpose: Enable hotel guest, room service, and hospitality advertising
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';
import axios from 'axios';
import rateLimit from 'rate-limit-express';

const app = express();
const PORT = process.env.PORT || 4952;

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/stayown-integration.log' })
  ]
});

// Configuration
const CONFIG = {
  STAYOWN_API: process.env.STAYOWN_API || 'http://localhost:4015',
  INTERNAL_TOKEN: process.env.INTERNAL_SERVICE_TOKEN || 'dev-token'
};

// StayOwn API Client
const stayownClient = axios.create({
  baseURL: CONFIG.STAYOWN_API,
  timeout: 10000,
  headers: {
    'X-Internal-Token': CONFIG.INTERNAL_TOKEN,
    'Content-Type': 'application/json'
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { error: 'Too many requests' }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(limiter);

// MongoDB Schemas
const guestIntentSchema = new mongoose.Schema({
  userId: String,
  hotelId: String,
  bookingId: String,
  guest: {
    name: String,
    email: String,
    phone: String,
    tier: String // regular, silver, gold, platinum
  },
  stay: {
    checkIn: Date,
    checkOut: Date,
    roomType: String,
    location: String
  },
  intentSignals: {
    servicesUsed: [String], // room_service, spa, restaurant, bar, laundry
    diningPreferences: [String],
    spendingLevel: Number
  },
  adImpressions: [{
    campaignId: String,
    adId: String,
    viewedAt: Date,
    clicked: Boolean
  }]
}, { timestamps: true });

const GuestIntent = mongoose.model('GuestIntent', guestIntentSchema);

const hospitalityAudienceSchema = new mongoose.Schema({
  segmentId: String,
  name: String,
  criteria: {
    hotelTiers: [String],
    stayDuration: { min: Number, max: Number },
    spendingLevel: { min: Number, max: Number },
    servicesUsed: [String],
    diningPreferences: [String]
  },
  size: Number,
  createdAt: Date
});

const HospitalityAudience = mongoose.model('HospitalityAudience', hospitalityAudienceSchema);

// Health check
app.get('/health', async (req: Request, res: Response) => {
  try {
    let stayownStatus = 'disconnected';
    try {
      await stayownClient.get('/health');
      stayownStatus = 'connected';
    } catch (e) {
      stayownStatus = 'unavailable';
    }

    res.json({
      status: 'healthy',
      service: 'stayown-hotel-integration',
      port: PORT,
      stayownStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'error', error: String(error) });
  }
});

// ============================================
// HOTEL DATA WEBHOOKS
// ============================================

/**
 * Receive check-in events from StayOwn
 * POST /api/webhooks/checkin-event
 */
app.post('/api/webhooks/checkin-event', async (req: Request, res: Response) => {
  try {
    const { eventType, bookingId, userId, guest, stay, intentSignals } = req.body;

    logger.info(`Received hotel event: ${eventType}`, { bookingId, userId });

    if (eventType === 'check_in') {
      // Store guest intent for audience building
      const guestIntent = new GuestIntent({
        userId,
        hotelId: stay.hotelId,
        bookingId,
        guest,
        stay,
        intentSignals
      });

      await guestIntent.save();

      // Send to Intent Signal Aggregator
      await sendToIntentAggregator({
        source: 'stayown',
        userId,
        intent: {
          type: 'hospitality',
          category: 'hotel_guest',
          hotelTier: guest.tier,
          roomType: stay.roomType,
          servicesUsed: intentSignals?.servicesUsed || []
        },
        timestamp: new Date()
      });
    }

    if (eventType === 'check_out') {
      // Update stay data
      await GuestIntent.findOneAndUpdate(
        { bookingId },
        { $set: { 'stay.checkOut': new Date() } }
      );
    }

    res.json({ success: true, processed: true });
  } catch (error) {
    logger.error('Webhook error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Receive room service events
 * POST /api/webhooks/service-event
 */
app.post('/api/webhooks/service-event', async (req: Request, res: Response) => {
  try {
    const { eventType, bookingId, service, amount } = req.body;

    if (eventType === 'service_used') {
      // Track service usage for targeting
      await GuestIntent.findOneAndUpdate(
        { bookingId },
        {
          $push: {
            'intentSignals.servicesUsed': service
          },
          $inc: {
            'intentSignals.spendingLevel': amount
          }
        }
      );

      // Contextual ad opportunity
      if (service === 'room_service') {
        await sendContextualAd(bookingId, 'dining_promo');
      }
    }

    res.json({ success: true, processed: true });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// HOSPITALITY AUDIENCE API
// ============================================

/**
 * Get hospitality audience segments
 * GET /api/audiences
 */
app.get('/api/audiences', async (req: Request, res: Response) => {
  try {
    const audiences = await HospitalityAudience.find();
    res.json({ success: true, audiences });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Create hospitality audience segment
 * POST /api/audiences
 */
app.post('/api/audiences', async (req: Request, res: Response) => {
  try {
    const { name, criteria } = req.body;

    const audience = new HospitalityAudience({
      segmentId: `hosp_${Date.now()}`,
      name,
      criteria,
      size: await calculateAudienceSize(criteria),
      createdAt: new Date()
    });

    await audience.save();
    res.json({ success: true, audience });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get active guests for targeting
 * GET /api/active-guests
 */
app.get('/api/active-guests', async (req: Request, res: Response) => {
  try {
    const { hotelId, services } = req.query;

    const query: any = {
      'stay.checkIn': { $lte: new Date() },
      'stay.checkOut': { $gte: new Date() }
    };

    if (hotelId) {
      query.hotelId = hotelId;
    }

    if (services) {
      query['intentSignals.servicesUsed'] = { $in: (services as string).split(',') };
    }

    const guests = await GuestIntent.find(query)
      .select('userId guest.name guest.tier stay.roomType intentSignals');

    res.json({
      success: true,
      count: guests.length,
      guests
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// HOTEL AD PLACEMENTS
// ============================================

/**
 * Get room QR ad placements
 * GET /api/ad-placements/rooms
 */
app.get('/api/ad-placements/rooms', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.query;

    // Get active rooms with QR codes
    const response = await stayownClient.get('/api/internal/rooms/active-qr', {
      params: { hotelId }
    });

    const placements = response.data.rooms.map((room: any) => ({
      roomId: room.id,
      roomNumber: room.number,
      floor: room.floor,
      roomType: room.type,
      hotelId: room.hotelId,
      adSlots: ['room_qr_menu', 'room_qr_checkout', 'room_qr_services']
    }));

    res.json({
      success: true,
      count: placements.length,
      placements
    });
  } catch (error) {
    logger.error('Room placements error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get lobby ad placements
 * GET /api/ad-placements/lobby
 */
app.get('/api/ad-placements/lobby', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.query;

    const response = await stayownClient.get('/api/internal/hotels/lobby-displays', {
      params: { hotelId }
    });

    const placements = response.data.displays.map((display: any) => ({
      displayId: display.id,
      location: display.location,
      type: display.type, // welcome, elevator, concierge
      size: display.size,
      adSlots: getAdSlots(display.type)
    }));

    res.json({
      success: true,
      count: placements.length,
      placements
    });
  } catch (error) {
    logger.error('Lobby placements error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get restaurant ad placements
 * GET /api/ad-placements/restaurants
 */
app.get('/api/ad-placements/restaurants', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.query;

    const response = await stayownClient.get('/api/internal/restaurants/active', {
      params: { hotelId }
    });

    const placements = response.data.restaurants.map((restaurant: any) => ({
      restaurantId: restaurant.id,
      name: restaurant.name,
      cuisine: restaurant.cuisine,
      adSlots: ['menu_qr', 'table_display', 'bill_qr']
    }));

    res.json({
      success: true,
      count: placements.length,
      placements
    });
  } catch (error) {
    logger.error('Restaurant placements error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// DINING & SERVICES TARGETING
// ============================================

/**
 * Get dining preference insights
 * GET /api/insights/dining
 */
app.get('/api/insights/dining', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.query;

    const insights = await GuestIntent.aggregate([
      {
        $match: hotelId ? { hotelId } : {}
      },
      {
        $unwind: '$intentSignals.diningPreferences'
      },
      {
        $group: {
          _id: '$intentSignals.diningPreferences',
          count: { $sum: 1 },
          avgSpending: { $avg: '$intentSignals.spendingLevel' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      insights
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get spending tier insights
 * GET /api/insights/spending
 */
app.get('/api/insights/spending', async (req: Request, res: Response) => {
  try {
    const insights = await GuestIntent.aggregate([
      {
        $group: {
          _id: '$guest.tier',
          count: { $sum: 1 },
          avgSpending: { $avg: '$intentSignals.spendingLevel' },
          topServices: { $push: '$intentSignals.servicesUsed' }
        }
      },
      { $sort: { avgSpending: -1 } }
    ]);

    res.json({
      success: true,
      insights
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// AD SERVING
// ============================================

/**
 * Serve hotel ad
 * POST /api/ad/serve
 */
app.post('/api/ad/serve', async (req: Request, res: Response) => {
  try {
    const { placementType, bookingId, context, campaignId } = req.body;

    // Get contextual ad based on placement and context
    const ad = await getHotelAd(placementType, context);

    // Record impression
    await recordAdImpression(bookingId, campaignId, ad.id);

    res.json({
      success: true,
      ad: {
        id: ad.id,
        content: ad.content,
        type: ad.type,
        cta: ad.cta
      }
    });
  } catch (error) {
    logger.error('Ad serve error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Track ad click
 * POST /api/ad/click
 */
app.post('/api/ad/click', async (req: Request, res: Response) => {
  try {
    const { bookingId, adId, action } = req.body;

    await recordAdClick(bookingId, adId, action);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function calculateAudienceSize(criteria: any): Promise<number> {
  const query: any = {};

  if (criteria.hotelTiers) {
    query['guest.tier'] = { $in: criteria.hotelTiers };
  }
  if (criteria.spendingLevel) {
    query['intentSignals.spendingLevel'] = {
      $gte: criteria.spendingLevel.min || 0,
      $lte: criteria.spendingLevel.max || 100000
    };
  }

  return GuestIntent.countDocuments(query);
}

async function sendToIntentAggregator(data: any) {
  try {
    await axios.post('http://localhost:4800/api/signals', data, {
      headers: { 'X-Internal-Token': CONFIG.INTERNAL_TOKEN }
    });
  } catch (error) {
    logger.error('Failed to send to intent aggregator:', { error: error instanceof Error ? error.message : String(error) });
  }
}

async function sendContextualAd(bookingId: string, context: string) {
  // Send contextual ad based on service usage
  logger.info(`Contextual ad for booking ${bookingId}: ${context}`);
}

function getAdSlots(locationType: string): string[] {
  const slots: Record<string, string[]> = {
    welcome: ['digital_wall', 'welcome_kiosk'],
    elevator: ['elevator_display', 'floor_indicator'],
    concierge: ['desk_display', 'waiting_area'],
    restaurant: ['menu_qr', 'table_tablet'],
    spa: ['spa_lounge_display', 'booking_kiosk'],
    pool: ['poolside_display', 'cabana_screen']
  };
  return slots[locationType] || ['digital_display'];
}

async function getHotelAd(placementType: string, context: any) {
  const ads: Record<string, any> = {
    room_qr_menu: {
      content: 'Upgrade to chef\'s special menu - 20% off',
      type: 'image'
    },
    room_qr_services: {
      content: 'Spa package - Relax and unwind',
      type: 'image'
    },
    room_qr_checkout: {
      content: 'Express checkout + late checkout offer',
      type: 'image'
    },
    lobby: {
      content: 'Welcome! Book your spa appointment today',
      type: 'video'
    },
    restaurant: {
      content: 'Complimentary drink with your meal',
      type: 'image'
    }
  };

  return {
    id: `hotel_ad_${Date.now()}`,
    ...(ads[placementType] || { content: 'Special offer!', type: 'image' }),
    cta: 'Learn More'
  };
}

async function recordAdImpression(bookingId: string, campaignId: string, adId: string) {
  await GuestIntent.findOneAndUpdate(
    { bookingId },
    { $push: { adImpressions: { campaignId, adId, viewedAt: new Date(), clicked: false } } }
  );
}

async function recordAdClick(bookingId: string, adId: string, action: string) {
  await GuestIntent.findOneAndUpdate(
    { bookingId, 'adImpressions.adId': adId },
    { $set: { 'adImpressions.$.clicked': true } }
  );
}

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 StayOwn Hotel Integration started on port ${PORT}`);
  logger.info(`🏨 Connected to StayOwn API: ${CONFIG.STAYOWN_API}`);

  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stayown_integration')
    .then(() => logger.info('MongoDB connected'))
    .catch(err => logger.error('MongoDB connection error:', { error: err instanceof Error ? err.message : String(err) }));
});

export default app;