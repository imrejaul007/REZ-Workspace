/**
 * Airzy Travel Integration Service
 * Connects AdBazaar to Airzy for travel-based advertising
 *
 * Port: 4951
 * Purpose: Enable travel, airport, and hospitality advertising
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';
import axios from 'axios';
import rateLimit from 'rate-limit-express';

const app = express();
const PORT = process.env.PORT || 4951;

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/airzy-integration.log' })
  ]
});

// Configuration
const CONFIG = {
  AIRZY_API: process.env.AIRZY_API || 'http://localhost:4500',
  INTERNAL_TOKEN: process.env.INTERNAL_SERVICE_TOKEN || 'dev-token'
};

// Airzy API Client
const airzyClient = axios.create({
  baseURL: CONFIG.AIRZY_API,
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
const travelIntentSchema = new mongoose.Schema({
  userId: String,
  flightId: String,
  itineraryId: String,
  flight: {
    origin: { code: String, city: String, airport: String },
    destination: { code: String, city: String, airport: String },
    departureTime: Date,
    arrivalTime: Date,
    airline: String,
    class: String
  },
  passenger: {
    type: String, // business, leisure, vfr
    tier: String  // economy, business, first
  },
  intentSignals: {
    destinationCategory: String,
    tripPurpose: String,
    duration: Number,
    budget: Number
  },
  adImpressions: [{
    campaignId: String,
    adId: String,
    viewedAt: Date,
    clicked: Boolean
  }]
}, { timestamps: true });

const TravelIntent = mongoose.model('TravelIntent', travelIntentSchema);

const travelerAudienceSchema = new mongoose.Schema({
  segmentId: String,
  name: String,
  criteria: {
    flightRoutes: [{ origin: String, destination: String }],
    tripPurpose: [String],
    travelClass: [String],
    travelFrequency: { min: Number, max: Number },
    advanceBooking: { min: Number, max: Number } // days
  },
  size: Number,
  createdAt: Date
});

const TravelerAudience = mongoose.model('TravelerAudience', travelerAudienceSchema);

// Health check
app.get('/health', async (req: Request, res: Response) => {
  try {
    let airzyStatus = 'disconnected';
    try {
      await airzyClient.get('/health');
      airzyStatus = 'connected';
    } catch (e) {
      airzyStatus = 'unavailable';
    }

    res.json({
      status: 'healthy',
      service: 'airzy-travel-integration',
      port: PORT,
      airzyStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'error', error: String(error) });
  }
});

// ============================================
// TRAVEL DATA WEBHOOKS
// ============================================

/**
 * Receive flight booking events from Airzy
 * POST /api/webhooks/flight-event
 */
app.post('/api/webhooks/flight-event', async (req: Request, res: Response) => {
  try {
    const { eventType, flightId, userId, flight, passenger, intentSignals } = req.body;

    logger.info(`Received flight event: ${eventType}`, { flightId, userId });

    if (eventType === 'booking_completed') {
      // Store travel intent for audience building
      const travelIntent = new TravelIntent({
        userId,
        flightId,
        flight,
        passenger,
        intentSignals
      });

      await travelIntent.save();

      // Send to Intent Signal Aggregator
      await sendToIntentAggregator({
        source: 'airzy',
        userId,
        intent: {
          type: 'travel',
          category: intentSignals?.destinationCategory || 'general',
          origin: flight?.origin?.city,
          destination: flight?.destination?.city,
          tripPurpose: intentSignals?.tripPurpose,
          class: passenger?.tier
        },
        timestamp: new Date()
      });
    }

    res.json({ success: true, processed: true });
  } catch (error) {
    logger.error('Webhook error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Receive lounge access events
 * POST /api/webhooks/lounge-event
 */
app.post('/api/webhooks/lounge-event', async (req: Request, res: Response) => {
  try {
    const { eventType, userId, loungeId, airport, duration } = req.body;

    if (eventType === 'lounge_access') {
      // Track high-value travelers
      await sendToIntentAggregator({
        source: 'airzy_lounge',
        userId,
        intent: {
          type: 'luxury_travel',
          category: 'lounge_access',
          airport: airport,
          duration: duration
        },
        timestamp: new Date()
      });
    }

    res.json({ success: true, processed: true });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// TRAVELER AUDIENCE API
// ============================================

/**
 * Get travel-based audience segments
 * GET /api/audiences
 */
app.get('/api/audiences', async (req: Request, res: Response) => {
  try {
    const audiences = await TravelerAudience.find();
    res.json({ success: true, audiences });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Create travel audience segment
 * POST /api/audiences
 */
app.post('/api/audiences', async (req: Request, res: Response) => {
  try {
    const { name, criteria } = req.body;

    const audience = new TravelerAudience({
      segmentId: `travel_${Date.now()}`,
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
 * Get flight data for targeting
 * POST /api/flight-data
 */
app.post('/api/flight-data', async (req: Request, res: Response) => {
  try {
    const { origin, destination, dateRange, flightClass } = req.body;

    // Query Airzy for flight data
    const response = await airzyClient.post('/api/internal/flights/search', {
      origin,
      destination,
      dateRange,
      flightClass
    });

    res.json({
      success: true,
      flights: response.data.flights
    });
  } catch (error) {
    logger.error('Flight data error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get airport ad placement opportunities
 * GET /api/ad-placements/airports
 */
app.get('/api/ad-placements/airports', async (req: Request, res: Response) => {
  try {
    const { airport } = req.query;

    // Get current airport activity from Airzy
    const response = await airzyClient.get('/api/internal/airports/current', {
      params: { airport }
    });

    const placements = response.data.locations.map((loc: any) => ({
      locationId: loc.id,
      airport: loc.airport,
      type: loc.type, // gate, lounge, baggage, security
      footfall: loc.footfall,
      adSlots: getAvailableSlots(loc.type)
    }));

    res.json({
      success: true,
      count: placements.length,
      placements
    });
  } catch (error) {
    logger.error('Ad placements error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get hotel booking opportunities
 * GET /api/ad-placements/hotels
 */
app.get('/api/ad-placements/hotels', async (req: Request, res: Response) => {
  try {
    const { destination } = req.query;

    const response = await airzyClient.get('/api/internal/hotels/active', {
      params: { destination }
    });

    res.json({
      success: true,
      hotels: response.data.hotels
    });
  } catch (error) {
    logger.error('Hotel placements error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// ROUTE & DESTINATION TARGETING
// ============================================

/**
 * Get popular routes
 * GET /api/routes/popular
 */
app.get('/api/routes/popular', async (req: Request, res: Response) => {
  try {
    const { timeframe } = req.query;

    const routes = await TravelIntent.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - (parseInt(timeframe as string) || 7) * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            origin: '$flight.origin.code',
            destination: '$flight.destination.code'
          },
          count: { $sum: 1 },
          avgFare: { $avg: '$intentSignals.budget' },
          purposes: { $addToSet: '$intentSignals.tripPurpose' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 50 }
    ]);

    res.json({
      success: true,
      routes
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get destination insights
 * GET /api/destinations/insights
 */
app.get('/api/destinations/insights', async (req: Request, res: Response) => {
  try {
    const { destination } = req.query;

    const insights = await TravelIntent.aggregate([
      {
        $match: {
          'flight.destination.code': destination
        }
      },
      {
        $group: {
          _id: '$intentSignals.destinationCategory',
          count: { $sum: 1 },
          avgTripDuration: { $avg: '$intentSignals.duration' },
          avgBudget: { $avg: '$intentSignals.budget' },
          topPurposes: { $push: '$intentSignals.tripPurpose' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      destination,
      insights
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get business vs leisure split
 * GET /api/analytics/purpose-split
 */
app.get('/api/analytics/purpose-split', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, route } = req.query;

    const match: any = {};
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate as string);
      if (endDate) match.createdAt.$lte = new Date(endDate as string);
    }
    if (route) {
      match['flight.origin.code'] = route.toString().split('-')[0];
      match['flight.destination.code'] = route.toString().split('-')[1];
    }

    const split = await TravelIntent.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$passenger.type',
          count: { $sum: 1 },
          avgBudget: { $avg: '$intentSignals.budget' }
        }
      }
    ]);

    res.json({
      success: true,
      split
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// AD SERVING
// ============================================

/**
 * Serve travel ad
 * POST /api/ad/serve
 */
app.post('/api/ad/serve', async (req: Request, res: Response) => {
  try {
    const { locationId, userId, context, campaignId } = req.body;

    // Get contextual ad based on location and user
    const ad = await getContextualAd(context, campaignId);

    // Record impression
    await recordAdImpression(userId, campaignId, ad.id, context);

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
    const { userId, adId, clickType, context } = req.body;

    await recordAdClick(userId, adId, clickType, context);

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

  if (criteria.tripPurpose) {
    query['intentSignals.tripPurpose'] = { $in: criteria.tripPurpose };
  }
  if (criteria.travelClass) {
    query['passenger.tier'] = { $in: criteria.travelClass };
  }

  return TravelIntent.countDocuments(query);
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

function getAvailableSlots(locationType: string): string[] {
  const slots: Record<string, string[]> = {
    gate: ['digital_display', 'boarding_pass_scan'],
    lounge: ['tablet_kiosk', 'menu_board', 'wifi_portal'],
    baggage: ['carousel_display', 'digital_signage'],
    security: ['queue_display', 'locker_screen'],
    terminal: ['digital_wall', 'information_kiosk', 'wayfinding_screen']
  };
  return slots[locationType] || ['digital_display'];
}

async function getContextualAd(context: any, campaignId?: string) {
  // Context-aware ad selection based on travel context
  const contextTypes: Record<string, any> = {
    pre_flight: {
      content: 'Travel insurance - Peace of mind for your trip',
      type: 'image'
    },
    at_airport: {
      content: 'Airport lounge access - Comfort before your flight',
      type: 'image'
    },
    in_flight: {
      content: 'Duty-free exclusive offers',
      type: 'image'
    },
    hotel_booking: {
      content: 'Book your hotel - Best rates guaranteed',
      type: 'image'
    },
    car_rental: {
      content: 'Premium car rental - Explore in style',
      type: 'image'
    }
  };

  return {
    id: `ad_${Date.now()}`,
    ...(contextTypes[context?.type] || contextTypes.pre_flight),
    cta: 'Learn More'
  };
}

async function recordAdImpression(userId: string, campaignId: string, adId: string, context: any) {
  // Store impression for analytics
  logger.info('Travel ad impression', { userId, campaignId, adId, context });
}

async function recordAdClick(userId: string, adId: string, clickType: string, context: any) {
  logger.info('Travel ad click', { userId, adId, clickType, context });
}

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Airzy Travel Integration started on port ${PORT}`);
  logger.info(`✈️ Connected to Airzy API: ${CONFIG.AIRZY_API}`);

  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/airzy_integration')
    .then(() => logger.info('MongoDB connected'))
    .catch(err => logger.error('MongoDB connection error:', { error: err instanceof Error ? err.message : String(err) }));
});

export default app;