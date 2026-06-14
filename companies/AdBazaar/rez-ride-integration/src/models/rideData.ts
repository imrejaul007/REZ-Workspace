/**
 * ReZ Ride Integration Service
 *
 * Mobility intelligence for AdBazaar - enables targeting based on
 * ride behavior, routes, locations, and mobility patterns.
 *
 * Port: 4530
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose, { Schema, Document } from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// MODELS
// ============================================================================

/**
 * Ride session model
 */
interface IRideSession extends Document {
  sessionId: string;
  userId: string;
  deviceId?: string;

  // Route
  pickupLocation: {
    lat: number;
    lng: number;
    address?: string;
    city: string;
    area?: string;
  };
  dropLocation?: {
    lat: number;
    lng: number;
    address?: string;
    city: string;
    area?: string;
  };
  route?: {
    distance: number; // meters
    duration: number; // seconds
    waypoints: Array<{ lat: number; lng: number }>;
  };

  // Timing
  rideType: 'economy' | 'premium' | 'auto' | 'bike';
  requestedAt: Date;
  startedAt?: Date;
  completedAt?: Date;

  // Fare
  fare: number;
  surge?: number;

  // Status
  status: 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

  // Targeting data
  isFirstRide?: boolean;
  isReturningUser?: boolean;
  loyaltyTier?: 'L1' | 'L2' | 'L3' | 'L4';

  // Ad exposure
  adImpressions: number;
  adClicks: number;
  campaignsViewed: string[];

  createdAt: Date;
  updatedAt: Date;
}

const rideSessionSchema = new Schema<IRideSession>({
  sessionId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  deviceId: String,

  pickupLocation: {
    lat: Number,
    lng: Number,
    address: String,
    city: { type: String, required: true },
    area: String,
  },
  dropLocation: {
    lat: Number,
    lng: Number,
    address: String,
    city: { type: String },
    area: String,
  },
  route: {
    distance: Number,
    duration: Number,
    waypoints: [{
      lat: Number,
      lng: Number,
    }],
  },

  rideType: {
    type: String,
    enum: ['economy', 'premium', 'auto', 'bike'],
  },
  requestedAt: { type: Date, default: Date.now },
  startedAt: Date,
  completedAt: Date,

  fare: Number,
  surge: Number,

  status: {
    type: String,
    enum: ['requested', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'requested',
  },

  isFirstRide: Boolean,
  isReturningUser: Boolean,
  loyaltyTier: String,

  adImpressions: { type: Number, default: 0 },
  adClicks: { type: Number, default: 0 },
  campaignsViewed: [String],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes
rideSessionSchema.index({ userId: 1, requestedAt: -1 });
rideSessionSchema.index({ 'pickupLocation.city': 1 });
rideSessionSchema.index({ status: 1, requestedAt: -1 });

const RideSession = mongoose.model<IRideSession>('RideSession', rideSessionSchema);

/**
 * Location hot zone model
 */
interface IHotZone extends Document {
  zoneId: string;
  name: string;
  type: 'airport' | 'railway' | 'mall' | 'office' | 'residential' | 'hospital' | 'education' | 'entertainment';

  center: {
    lat: number;
    lng: number;
  };
  radius: number; // meters

  city: string;
  area: string;

  // Metrics
  avgDailyRides: number;
  peakHours: number[];
  avgFare: number;

  // Ad inventory
  availableSlots: number;
  currentOccupancy: number;

  active: boolean;
  createdAt: Date;
}

const hotZoneSchema = new Schema<IHotZone>({
  zoneId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['airport', 'railway', 'mall', 'office', 'residential', 'hospital', 'education', 'entertainment'],
    required: true,
  },

  center: {
    lat: Number,
    lng: Number,
  },
  radius: Number,

  city: String,
  area: String,

  avgDailyRides: Number,
  peakHours: [Number],
  avgFare: Number,

  availableSlots: Number,
  currentOccupancy: Number,

  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

hotZoneSchema.index({ city: 1, type: 1 });
hotZoneSchema.index({ 'center.lat': 1, 'center.lng': 1 });

const HotZone = mongoose.model<IHotZone>('HotZone', hotZoneSchema);

/**
 * User mobility profile
 */
interface IMobilityProfile extends Document {
  userId: string;

  // Home/Work
  homeLocation?: {
    lat: number;
    lng: number;
    city: string;
    area: string;
    confidence: number;
  };
  workLocation?: {
    lat: number;
    lng: number;
    city: string;
    area: string;
    confidence: number;
  };

  // Frequent routes
  frequentRoutes: Array<{
    from: { lat: number; lng: number; area: string };
    to: { lat: number; lng: number; area: string };
    count: number;
    lastUsed: Date;
  }>;

  // Behavior
  avgRidesPerWeek: number;
  preferredRideType: 'economy' | 'premium' | 'auto' | 'bike';
  peakHours: number[];
  peakDays: number[];

  // Location patterns
  citiesVisited: string[];
  frequentAreas: string[];

  // Ad engagement
  adImpressions: number;
  adClicks: number;
  conversionRate: number;

  updatedAt: Date;
}

const mobilityProfileSchema = new Schema<IMobilityProfile>({
  userId: { type: String, required: true, unique: true, index: true },

  homeLocation: {
    lat: Number,
    lng: Number,
    city: String,
    area: String,
    confidence: Number,
  },
  workLocation: {
    lat: Number,
    lng: Number,
    city: String,
    area: String,
    confidence: Number,
  },

  frequentRoutes: [{
    from: { lat: Number, lng: Number, area: String },
    to: { lat: Number, lng: Number, area: String },
    count: Number,
    lastUsed: Date,
  }],

  avgRidesPerWeek: Number,
  preferredRideType: String,
  peakHours: [Number],
  peakDays: [Number],

  citiesVisited: [String],
  frequentAreas: [String],

  adImpressions: { type: Number, default: 0 },
  adClicks: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 },

  updatedAt: { type: Date, default: Date.now },
});

const MobilityProfile = mongoose.model<IMobilityProfile>('MobilityProfile', mobilityProfileSchema);

// ============================================================================
// SERVICES
// ============================================================================

/**
 * Mobility Intelligence Service
 */
class MobilityIntelligence {
  /**
   * Get mobility profile for targeting
   */
  async getProfile(userId: string): Promise<IMobilityProfile | null> {
    return MobilityProfile.findOne({ userId });
  }

  /**
   * Get users in area (for geo targeting)
   */
  async getUsersInArea(params: {
    lat: number;
    lng: number;
    radiusKm: number;
    minRides?: number;
  }): Promise<string[]> {
    const { lat, lng, radiusKm, minRides = 1 } = params;

    // Haversine formula for radius search
    const radiusMeters = radiusKm * 1000;

    const sessions = await RideSession.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distance',
          maxDistance: radiusMeters,
          spherical: true,
        },
      },
      {
        $match: {
          status: 'completed',
          $expr: { $gte: [{ $size: '$campaignsViewed' }, minRides] },
        },
      },
      {
        $group: { _id: '$userId' },
      },
    ]);

    return sessions.map(s => s._id);
  }

  /**
   * Get hot zones for targeting
   */
  async getHotZones(city?: string): Promise<IHotZone[]> {
    const query = { active: true };
    if (city) query['city'] = city;
    return HotZone.find(query).sort({ avgDailyRides: -1 });
  }

  /**
   * Get routes for route-based targeting
   */
  async getFrequentRoutes(userId: string): Promise<IMobilityProfile['frequentRoutes']> {
    const profile = await this.getProfile(userId);
    return profile?.frequentRoutes || [];
  }

  /**
   * Check if user is likely to travel to destination
   */
  async predictTravel(userId: string, destination: { lat: number; lng: number }): Promise<{
    probability: number;
    preferredTime: number;
    estimatedFare: number;
  }> {
    const profile = await this.getProfile(userId);

    if (!profile) {
      return { probability: 0.1, preferredTime: 9, estimatedFare: 150 };
    }

    // Check if destination matches frequent routes
    const matchCount = profile.frequentRoutes.filter(route => {
      const destDistance = Math.sqrt(
        Math.pow(route.to.lat - destination.lat, 2) +
        Math.pow(route.to.lng - destination.lng, 2)
      );
      return destDistance < 0.05; // ~5km
    }).length;

    const probability = Math.min(0.9, 0.3 + (matchCount * 0.15));

    return {
      probability,
      preferredTime: profile.peakHours[0] || 9,
      estimatedFare: 150 + (matchCount * 50),
    };
  }

  /**
   * Get airport travelers (high-value audience)
   */
  async getAirportTravelers(): Promise<string[]> {
    const airportZones = await HotZone.find({ type: 'airport', active: true });

    const userIds: string[] = [];
    for (const zone of airportZones) {
      const sessions = await RideSession.find({
        'pickupLocation': {
          $near: {
            $geometry: { type: 'Point', coordinates: [zone.center.lng, zone.center.lat] },
            $maxDistance: zone.radius,
          },
        },
        status: 'completed',
        requestedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }).distinct('userId');

      userIds.push(...sessions);
    }

    return [...new Set(userIds)];
  }
}

const mobilityIntelligence = new MobilityIntelligence();

// ============================================================================
// APP SETUP
// ============================================================================

const app = express();
const PORT = parseInt(process.env.PORT || '4530', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-ride-integration';

app.use(helmet());
app.use(cors());
app.use(express.json());

// ============================================================================
// ROUTES
// ============================================================================

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'rez-ride-integration', version: '1.0.0' });
});

/**
 * GET /api/profile/:userId
 * Get mobility profile for targeting
 */
app.get('/api/profile/:userId', async (req: Request, res: Response) => {
  try {
    const profile = await mobilityIntelligence.getProfile(req.params.userId);

    if (!profile) {
      res.status(404).json({ success: false, error: 'PROFILE_NOT_FOUND' });
      return;
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * POST /api/area/users
 * Get users in a geographic area
 */
app.post('/api/area/users', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radiusKm, minRides } = req.body;

    const userIds = await mobilityIntelligence.getUsersInArea({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radiusKm: parseFloat(radiusKm),
      minRides: parseInt(minRides) || 1,
    });

    res.json({
      success: true,
      data: {
        count: userIds.length,
        userIds,
      },
    });
  } catch (error) {
    logger.error('Area users error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/hot-zones
 * Get hot zones for targeting
 */
app.get('/api/hot-zones', async (req: Request, res: Response) => {
  try {
    const { city } = req.query;
    const zones = await mobilityIntelligence.getHotZones(city as string);

    res.json({ success: true, data: zones });
  } catch (error) {
    logger.error('Hot zones error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/routes/:userId
 * Get frequent routes for user
 */
app.get('/api/routes/:userId', async (req: Request, res: Response) => {
  try {
    const routes = await mobilityIntelligence.getFrequentRoutes(req.params.userId);

    res.json({ success: true, data: routes });
  } catch (error) {
    logger.error('Get routes error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * POST /api/predict/travel
 * Predict user travel behavior
 */
app.post('/api/predict/travel', async (req: Request, res: Response) => {
  try {
    const { userId, destination } = req.body;

    const prediction = await mobilityIntelligence.predictTravel(userId, destination);

    res.json({ success: true, data: prediction });
  } catch (error) {
    logger.error('Predict travel error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/audience/airport
 * Get airport travelers
 */
app.get('/api/audience/airport', async (_req: Request, res: Response) => {
  try {
    const userIds = await mobilityIntelligence.getAirportTravelers();

    res.json({
      success: true,
      data: {
        count: userIds.length,
        userIds,
      },
    });
  } catch (error) {
    logger.error('Airport travelers error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

// ============================================================================
// START
// ============================================================================

async function start(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('[ReZ Ride Integration] Connected to MongoDB');

    app.listen(PORT, () => {
      logger.info(`[ReZ Ride Integration] Running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('[ReZ Ride Integration] Failed to start:', error);
    process.exit(1);
  }
}

start();

export default app;
