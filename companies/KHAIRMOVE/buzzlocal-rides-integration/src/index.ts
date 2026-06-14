import { logger } from '../../shared/logger';
// BuzzLocal Rides Integration - Community rides with REZ Intelligence
// Bridges BuzzLocal app with KHAIRMOVE platform + movement intelligence

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { VehicleType, Location } from '../../shared/types';
import {
  getIntelligence,
  KHAIRMOVEIntelligence,
} from '../../shared/integrations/rez-intelligence';
import {
  authenticate,
  corsMiddleware,
  createGlobalLimiter,
  requestIdMiddleware,
  requestLoggingMiddleware,
  validateRequiredEnvVars,
} from '../../shared';

const locationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  address: z.string().optional(),
});

const PORT = process.env.PORT || 4606;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/buzzlocal_rides';
const RIDE_SERVICE_URL = process.env.RIDE_SERVICE_URL || 'http://localhost:4601';

// Configure REZ Intelligence
const REZ_CONFIG = {
  locationIntelUrl: process.env.REZ_LOCATION_URL || 'http://localhost:4040',
  signalAggregatorUrl: process.env.REZ_SIGNAL_URL || 'http://localhost:4142',
  predictiveEngineUrl: process.env.REZ_PREDICTIVE_URL || 'http://localhost:4123',
  memoryLayerUrl: process.env.REZ_MEMORY_URL || 'http://localhost:4201',
  apiKey: process.env.REZ_INTELLIGENCE_API_KEY || 'rez-api-key',
  internalToken: process.env.INTERNAL_SERVICE_TOKEN || 'khaimove-internal',
};

let intelligence: KHAIRMOVEIntelligence;

function initIntelligence() {
  intelligence = getIntelligence();
  intelligence.configure(REZ_CONFIG);
}

const app = express();

// Apply middleware
app.use(helmet());
app.use(corsMiddleware);
app.use(requestIdMiddleware);
app.use(requestLoggingMiddleware);
app.use('/api/', createGlobalLimiter());
app.use(express.json({ limit: '1mb' })); // Prevent large payload DoS

// ============================================
// MONGODB SCHEMAS (replaces in-memory storage)
// ============================================

const buzzLocalRideSchema = new mongoose.Schema({
  rideId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  communityId: { type: String, default: 'default', index: true },
  pickup: {
    lat: Number,
    lng: Number,
    address: String,
  },
  drop: {
    lat: Number,
    lng: Number,
    address: String,
  },
  vehicleType: { type: String, enum: ['bike', 'auto', 'cab', 'suv'] },
  status: { type: String, enum: ['pending', 'matched', 'in_progress', 'completed', 'cancelled'], default: 'pending', index: true },
  matchedRideId: String,
  fare: {
    estimated: Number,
    final: Number,
    sharedSavings: Number,
  },
  sharedWith: [String],
  distance: Number,
  createdAt: { type: Date, default: Date.now, index: true },
  completedAt: Date,
}, { timestamps: true });

// Compound indexes
buzzLocalRideSchema.index({ userId: 1, createdAt: -1 });
buzzLocalRideSchema.index({ communityId: 1, status: 1 });
buzzLocalRideSchema.index({ 'pickup.lat': 1, 'pickup.lng': 1, status: 1 });

const communityPoolSchema = new mongoose.Schema({
  poolId: { type: String, required: true, unique: true, index: true },
  communityId: { type: String, required: true, index: true },
  pickup: {
    lat: Number,
    lng: Number,
    address: String,
  },
  drop: {
    lat: Number,
    lng: Number,
    address: String,
  },
  departureTime: { type: Date, required: true, index: true },
  vehicleType: { type: String, enum: ['bike', 'auto', 'cab', 'suv'] },
  seatsAvailable: { type: Number, default: 0 },
  totalSeats: { type: Number, required: true },
  riders: [{
    userId: String,
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
    joinedAt: { type: Date, default: Date.now },
  }],
  farePerPerson: Number,
  mlOptimized: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Compound indexes
communityPoolSchema.index({ communityId: 1, departureTime: 1, seatsAvailable: 1 });

const communitySchema = new mongoose.Schema({
  communityId: { type: String, required: true, unique: true, index: true },
  name: String,
  area: {
    lat: Number,
    lng: Number,
    address: String,
  },
  radius: Number,
  memberCount: { type: Number, default: 0 },
  stats: {
    totalRides: { type: Number, default: 0 },
    activeRides: { type: Number, default: 0 },
    avgSavings: { type: Number, default: 0 },
  },
  movementPatterns: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

// Models
const BuzzLocalRide = mongoose.model('BuzzLocalRide', buzzLocalRideSchema);
const CommunityPool = mongoose.model('CommunityPool', communityPoolSchema);
const Community = mongoose.model('Community', communitySchema);

// ============================================
// TYPES
// ============================================

interface Community {
  id: string;
  name: string;
  area: Location;
  radius: number;
  memberCount: number;
  stats: {
    totalRides: number;
    activeRides: number;
    avgSavings: number;
  };
  movementPatterns?: {
    peakHours: { hour: number; intensity: number }[];
    hotspots: Location[];
    trendingRoutes: { from: Location; to: Location; count: number }[];
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateSecureId(): string {
  return randomBytes(16).toString('hex');
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateSharedFare(distance: number, vehicleType: VehicleType, seats: number): { total: number; perPerson: number } {
  const BASE_FARES: Record<string, number> = {
    [VehicleType.BIKE]: 15,
    [VehicleType.AUTO]: 25,
    [VehicleType.CAB]: 40,
    [VehicleType.SUV]: 60,
  };
  const PER_KM: Record<string, number> = {
    [VehicleType.BIKE]: 6,
    [VehicleType.AUTO]: 10,
    [VehicleType.CAB]: 14,
    [VehicleType.SUV]: 18,
  };

  const base = BASE_FARES[vehicleType] || 30;
  const distanceFare = distance * (PER_KM[vehicleType] || 10);
  const total = base + distanceFare;
  const perPerson = Math.round((total / seats) * 100) / 100;

  return { total, perPerson };
}

// ============================================
// HEALTH CHECKS (Production Ready)
// ============================================

app.get('/health/live', (req, res) => {
  res.json({
    status: 'alive',
    service: 'buzzlocal-rides',
    timestamp: new Date(),
  });
});

app.get('/health/ready', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ status: 'not_ready', mongodb: 'disconnected' });
    }
    await mongoose.connection.db.admin().ping();
    res.json({ status: 'ready', mongodb: 'connected' });
  } catch {
    res.status(503).json({ status: 'not_ready', mongodb: 'error' });
  }
});

// Legacy health endpoint
app.get('/health', async (req, res) => {
  res.json({
    status: 'ok',
    service: 'buzzlocal-rides-integration',
    version: '1.0.0',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date(),
  });
});

// ============================================
// COMMUNITY ENDPOINTS
// ============================================

// Get community with movement patterns from REZ Intelligence
app.get('/api/communities/:id', authenticate(), async (req, res) => {
  try {
    const community = await Community.findOne({ communityId: req.params.id });

    if (!community) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Community not found' } });
    }

    // Get movement patterns from REZ Intelligence
    let movementPatterns = community.movementPatterns;
    try {
      const zones = await intelligence.location.getHotZones(
        community.area.lat,
        community.area.lng,
        5
      );
      movementPatterns = {
        hotspots: zones.map((z: any) => z.location || community.area),
        peakHours: [{ hour: 9, intensity: 0.8 }, { hour: 12, intensity: 0.6 }, { hour: 18, intensity: 0.9 }],
        trendingRoutes: [],
      };
      community.movementPatterns = movementPatterns;
      await community.save();
    } catch {}

    res.json({
      success: true,
      data: {
        ...community.toObject(),
        movementPatterns,
        mlInsights: {
          peakHours: movementPatterns?.peakHours?.slice(0, 3) || [],
          topHotspots: movementPatterns?.hotspots?.slice(0, 5) || [],
        },
      },
    });
  } catch (error) {
    logger.error('Get community error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get community' } });
  }
});

// Get area insights from REZ Intelligence
app.get('/api/insights/area', authenticate(), async (req, res) => {
  try {
    const schema = z.object({
      lat: z.string(),
      lng: z.string(),
      radius: z.string().default('5'),
    });

    const validated = schema.parse(req.query);

    const [demandInsights, hotZones] = await Promise.all([
      intelligence.getSupplyDemandInsights(parseFloat(validated.lat), parseFloat(validated.lng)).catch(() => null),
      intelligence.location.getHotZones(parseFloat(validated.lat), parseFloat(validated.lng), parseFloat(validated.radius)).catch(() => []),
    ]);

    res.json({
      success: true,
      data: {
        demand: demandInsights,
        hotZones,
        recommendations: {
          bestTimeToRide: getBestTimeToRide(hotZones),
          cheapestRoute: await getCheapestRouteSuggestion(parseFloat(validated.lat), parseFloat(validated.lng)).catch(() => null),
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get area insights' } });
    }
  }
});

function getBestTimeToRide(hotZones: { lat: number; lng: number; intensity: number }[]): string {
  const hour = new Date().getHours();

  if (hour >= 6 && hour <= 8) return 'Good time - early morning';
  if (hour >= 10 && hour <= 16) return 'Best time - off-peak hours';
  if (hour >= 16 && hour <= 19) return 'High demand - expect surge';
  if (hour >= 22 || hour <= 5) return 'Late night - moderate demand';

  return 'Normal traffic conditions';
}

async function getCheapestRouteSuggestion(lat: number, lng: number): Promise<{ route: Location[]; estimatedSavings: number } | null> {
  try {
    const hotZones = await intelligence.location.getHotZones(lat, lng);

    if (hotZones.length < 2) return null;

    return {
      route: hotZones.slice(0, 3).map(z => ({ lat: z.lat, lng: z.lng })),
      estimatedSavings: 15,
    };
  } catch {
    return null;
  }
}

// ============================================
// RIDE ENDPOINTS
// ============================================

app.post('/api/rides', authenticate(), async (req, res) => {
  try {
    const schema = z.object({
      userId: z.string(),
      pickup: z.object({ lat: z.number(), lng: z.number(), address: z.string().optional() }),
      drop: z.object({ lat: z.number(), lng: z.number(), address: z.string().optional() }),
      vehicleType: z.enum(['bike', 'auto', 'cab', 'suv']),
      scheduledTime: z.string().datetime().optional(),
      notes: z.string().optional(),
      communityId: z.string().optional(),
    });

    const validated = schema.parse(req.body);

    const distance = calculateDistance(
      validated.pickup.lat, validated.pickup.lng,
      validated.drop.lat, validated.drop.lng
    );

    const fare = calculateSharedFare(distance, validated.vehicleType as any, 1);

    const ride = new BuzzLocalRide({
      rideId: generateSecureId(),
      userId: validated.userId,
      communityId: validated.communityId || 'default',
      pickup: validated.pickup,
      drop: validated.drop,
      vehicleType: validated.vehicleType,
      status: 'pending',
      fare: {
        estimated: fare.total,
        final: 0,
        sharedSavings: 0,
      },
      distance,
      createdAt: new Date(),
    });

    await ride.save();

    // Record to REZ Intelligence
    try {
      await intelligence.signals.recordSignal(validated.userId, {
        type: 'buzzlocal.ride_requested',
        value: 1,
        weight: 1,
        metadata: {
          communityId: validated.communityId,
          vehicleType: validated.vehicleType,
          distance,
        },
      });
    } catch {}

    res.status(201).json({ success: true, data: ride });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      logger.error('BuzzLocal ride request error:', error);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to request ride' } });
    }
  }
});

app.get('/api/rides/:id', authenticate(), async (req, res) => {
  const ride = await BuzzLocalRide.findOne({ rideId: req.params.id });
  if (!ride) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ride not found' } });
  }
  res.json({ success: true, data: ride });
});

app.get('/api/rides', authenticate(), async (req, res) => {
  try {
    const schema = z.object({
      userId: z.string().optional(),
      communityId: z.string().optional(),
      status: z.string().optional(),
      limit: z.string().default('20'),
      offset: z.string().default('0'),
    });

    const validated = schema.parse(req.query);

    const query: Record<string, unknown> = {};
    if (validated.userId) query.userId = validated.userId;
    if (validated.communityId) query.communityId = validated.communityId;
    if (validated.status) query.status = validated.status;

    const total = await BuzzLocalRide.countDocuments(query);
    const rides = await BuzzLocalRide.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(validated.offset))
      .limit(Math.min(parseInt(validated.limit), 100));

    res.json({ success: true, data: { rides, total, limit: parseInt(validated.limit), offset: parseInt(validated.offset) } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get rides' } });
    }
  }
});

app.post('/api/rides/:id/cancel', authenticate(), async (req, res) => {
  try {
    const ride = await BuzzLocalRide.findOne({ rideId: req.params.id });
    if (!ride) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ride not found' } });
    }

    if (ride.status === 'completed') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Cannot cancel completed ride' } });
    }

    ride.status = 'cancelled';
    await ride.save();

    // Record cancellation
    try {
      await intelligence.signals.recordSignal(ride.userId, {
        type: 'buzzlocal.ride_cancelled',
        value: -1,
        weight: 1,
      });
    } catch {}

    res.json({ success: true, data: ride });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to cancel ride' } });
  }
});

// ============================================
// COMMUNITY POOL RIDES
// ============================================

app.post('/api/pools', authenticate(), async (req, res) => {
  try {
    const schema = z.object({
      communityId: z.string(),
      pickup: locationSchema,
      drop: locationSchema,
      departureTime: z.string().datetime(),
      vehicleType: z.enum(['bike', 'auto', 'cab', 'suv']),
      totalSeats: z.number().int().min(2).max(6),
    });

    const validated = schema.parse(req.body);

    const distance = calculateDistance(
      validated.pickup.lat, validated.pickup.lng,
      validated.drop.lat, validated.drop.lng
    );

    const fare = calculateSharedFare(distance, validated.vehicleType as any, validated.totalSeats);

    // Get ML-optimized suggestions from REZ Intelligence
    let mlOptimized: Record<string, unknown> = {};
    try {
      const hotZones = await intelligence.location.getHotZones(validated.pickup.lat, validated.pickup.lng, 5);

      mlOptimized = {
        suggestedPickupPoint: hotZones[0] ? { lat: hotZones[0].lat, lng: hotZones[0].lng } : undefined,
        suggestedDepartureTime: new Date(),
        predictedDemand: hotZones.length * 0.5,
      };
    } catch {}

    const pool = new CommunityPool({
      poolId: generateSecureId(),
      communityId: validated.communityId,
      pickup: validated.pickup,
      drop: validated.drop,
      departureTime: new Date(validated.departureTime),
      vehicleType: validated.vehicleType,
      seatsAvailable: validated.totalSeats - 1,
      totalSeats: validated.totalSeats,
      riders: [],
      farePerPerson: fare.perPerson,
      mlOptimized,
    });

    await pool.save();

    res.status(201).json({
      success: true,
      data: {
        pool,
        savingsInfo: {
          perPerson: fare.perPerson,
          totalSavings: fare.total - fare.perPerson * validated.totalSeats,
          comparedToSolo: fare.total,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create pool' } });
    }
  }
});

app.get('/api/pools', authenticate(), async (req, res) => {
  try {
    const schema = z.object({
      communityId: z.string().optional(),
      vehicleType: z.string().optional(),
      maxDeparture: z.string().optional(),
      limit: z.string().default('20'),
    });

    const validated = schema.parse(req.query);

    const query: Record<string, unknown> = { seatsAvailable: { $gt: 0 } };
    if (validated.communityId) query.communityId = validated.communityId;
    if (validated.vehicleType) query.vehicleType = validated.vehicleType;
    if (validated.maxDeparture) {
      query.departureTime = { $lte: new Date(validated.maxDeparture as string), $gt: new Date() };
    } else {
      query.departureTime = { $gt: new Date() };
    }

    const pools = await CommunityPool.find(query)
      .sort({ departureTime: 1 })
      .limit(Math.min(parseInt(validated.limit), 50));

    // Add ML recommendations
    const poolsWithRecommendations = await Promise.all(
      pools.map(async (pool) => {
        try {
          const demand = await intelligence.getSupplyDemandInsights(pool.pickup.lat, pool.pickup.lng);
          return {
            ...pool.toObject(),
            recommendations: {
              demandLevel: demand.demandLevel,
              surgeMultiplier: demand.suggestedSurge,
              recommendation: getPoolRecommendation(demand),
            },
          };
        } catch {
          return pool.toObject();
        }
      })
    );

    res.json({ success: true, data: poolsWithRecommendations });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get pools' } });
    }
  }
});

function getPoolRecommendation(demand: { demandLevel: string }): string {
  if (demand.demandLevel === 'surge') return 'High demand - book now! Pool pricing saves you money.';
  if (demand.demandLevel === 'high') return 'Moderate demand - good time to pool.';
  return 'Low demand - frequent availability.';
}

app.get('/api/pools/:id', authenticate(), async (req, res) => {
  const pool = await CommunityPool.findOne({ poolId: req.params.id });
  if (!pool) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Pool not found' } });
  }

  let recommendations: Record<string, unknown> = {};
  try {
    const demand = await intelligence.getSupplyDemandInsights(pool.pickup.lat, pool.pickup.lng);
    recommendations = {
      demandLevel: demand.demandLevel,
      activeNearby: demand.activeDrivers,
    };
  } catch {}

  res.json({ success: true, data: { ...pool.toObject(), recommendations } });
});

app.post('/api/pools/:id/join', authenticate(), async (req, res) => {
  try {
    const schema = z.object({ userId: z.string() });
    const validated = schema.parse(req.body);

    const pool = await CommunityPool.findOne({ poolId: req.params.id });
    if (!pool) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Pool not found' } });
    }

    if (pool.seatsAvailable <= 0) {
      return res.status(400).json({ success: false, error: { code: 'FULL', message: 'Pool is full' } });
    }

    if (pool.departureTime <= new Date()) {
      return res.status(400).json({ success: false, error: { code: 'DEPARTED', message: 'Pool has already departed' } });
    }

    if (pool.riders.some(r => r.userId === validated.userId && r.status === 'confirmed')) {
      return res.status(400).json({ success: false, error: { code: 'ALREADY_JOINED', message: 'Already joined this pool' } });
    }

    pool.riders.push({ userId: validated.userId, status: 'confirmed', joinedAt: new Date() });
    pool.seatsAvailable--;
    await pool.save();

    // Record signal
    try {
      await intelligence.signals.recordSignal(validated.userId, {
        type: 'buzzlocal.pool_joined',
        value: 1,
        weight: 2,
        metadata: { poolId: pool.poolId, communityId: pool.communityId },
      });
    } catch {}

    res.json({ success: true, data: pool });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to join pool' } });
    }
  }
});

app.post('/api/pools/:id/leave', authenticate(), async (req, res) => {
  try {
    const schema = z.object({ userId: z.string() });
    const validated = schema.parse(req.body);

    const pool = await CommunityPool.findOne({ poolId: req.params.id });
    if (!pool) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Pool not found' } });
    }

    const riderIndex = pool.riders.findIndex(r => r.userId === validated.userId && r.status === 'confirmed');
    if (riderIndex === -1) {
      return res.status(400).json({ success: false, error: { code: 'NOT_JOINED', message: 'Not a member of this pool' } });
    }

    pool.riders[riderIndex].status = 'cancelled';
    pool.seatsAvailable++;
    await pool.save();

    res.json({ success: true, data: pool });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to leave pool' } });
  }
});

// ============================================
// NEARBY RIDES (Carpooling suggestions)
// ============================================

app.get('/api/rides/nearby', authenticate(), async (req, res) => {
  try {
    const schema = z.object({
      lat: z.coerce.number().min(-90).max(90),
      lng: z.coerce.number().min(-180).max(180),
      radius: z.coerce.number().min(1).max(50).default(5),
      vehicleType: z.enum(['bike', 'auto', 'cab', 'suv']).optional(),
    });

    const validated = schema.parse(req.query);

    // Get nearby pending/matched rides from MongoDB
    const rides = await BuzzLocalRide.find({
      status: { $in: ['pending', 'matched'] },
    }).lean();

    const nearbyRides = rides.filter(ride => {
      if (validated.vehicleType && ride.vehicleType !== validated.vehicleType) return false;

      const distance = calculateDistance(
        validated.lat, validated.lng,
        ride.pickup.lat, ride.pickup.lng
      );

      return distance <= validated.radius;
    });

    // Add demand insights
    const ridesWithInsights = await Promise.all(
      nearbyRides.map(async (ride) => {
        try {
          const demand = await intelligence.getSupplyDemandInsights(ride.pickup.lat, ride.pickup.lng);
          return {
            ...ride,
            areaDemand: demand.demandLevel,
          };
        } catch {
          return ride;
        }
      })
    );

    res.json({ success: true, data: ridesWithInsights });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to find rides' } });
    }
  }
});

// ============================================
// MOVEMENT ANALYTICS
// ============================================

app.get('/api/movement/:communityId', authenticate(), async (req, res) => {
  try {
    const { communityId } = req.params;

    // Get movement patterns from REZ Intelligence
    let zones: any[] = [];
    try {
      zones = await intelligence.location.getHotZones(0, 0, 10);
    } catch {}

    // Get community rides for this area
    const communityRides = await BuzzLocalRide.find({ communityId }).lean();

    // Calculate statistics
    const hourCounts = new Array(24).fill(0);
    const vehicleCounts: Record<string, number> = { bike: 0, auto: 0, cab: 0, suv: 0 };

    communityRides.forEach(ride => {
      const hour = new Date(ride.createdAt).getHours();
      hourCounts[hour]++;
      if (ride.vehicleType) {
        vehicleCounts[ride.vehicleType] = (vehicleCounts[ride.vehicleType] || 0) + 1;
      }
    });

    const peakHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(h => h.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    res.json({
      success: true,
      data: {
        communityId,
        totalRides: communityRides.length,
        activeRides: communityRides.filter(r => r.status === 'in_progress').length,
        completedRides: communityRides.filter(r => r.status === 'completed').length,
        peakHours,
        hotspots: zones.map((z: any) => z.location || { lat: 0, lng: 0 }),
        trendingDestinations: zones.slice(0, 5).map((z: any) => z.location || { lat: 0, lng: 0 }),
        vehicleDistribution: vehicleCounts,
        mlInsights: {
          recommendedDepartures: getRecommendedDepartures(peakHours),
          demandForecast: { high: zones.length > 3, medium: zones.length > 1, low: zones.length >= 0 },
        },
      },
    });
  } catch (error) {
    logger.error('Movement analytics error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get movement data' } });
  }
});

function getRecommendedDepartures(peakHours: { hour: number; count: number }[]): string[] {
  const recommendations: string[] = [];

  if (peakHours.some(p => p.hour >= 8 && p.hour <= 10)) {
    recommendations.push('Leave before 8 AM or after 10 AM to avoid morning peak');
  }
  if (peakHours.some(p => p.hour >= 18 && p.hour <= 21)) {
    recommendations.push('Leave before 6 PM or after 9 PM to avoid evening peak');
  }

  recommendations.push('Best times: 10 AM - 4 PM for lowest prices');

  return recommendations;
}

// ============================================
// USER ANALYTICS
// ============================================

app.get('/api/users/:userId/analytics', authenticate(), async (req, res) => {
  try {
    const { userId } = req.params;

    // Get engagement score
    let engagement = { score: 0, tier: 'inactive', recommendations: [] as string[] };
    try {
      const userSignals = await intelligence.signals.getUserSignals(userId).catch(() => null);
      engagement = {
        score: userSignals ? 0.7 : 0,
        tier: userSignals ? 'active' : 'inactive',
        recommendations: [],
      };
    } catch {}

    // Get user rides
    const userRides = await BuzzLocalRide.find({ userId }).lean();

    res.json({
      success: true,
      data: {
        userId,
        totalRides: userRides.length,
        completedRides: userRides.filter(r => r.status === 'completed').length,
        engagement,
        savings: {
          totalSaved: userRides.reduce((sum, r) => sum + (r.fare?.sharedSavings || 0), 0),
          ridesWithPooling: userRides.filter(r => r.sharedWith && r.sharedWith.length > 0).length,
        },
      },
    });
  } catch (error) {
    logger.error('User analytics error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get user analytics' } });
  }
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully...`);
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================
// SERVER STARTUP
// ============================================

async function start() {
  try {
    // Validate environment in production
    if (process.env.NODE_ENV === 'production') {
      const result = validateRequiredEnvVars(['PORT', 'MONGODB_URI', 'INTERNAL_SERVICE_TOKEN']);
      if (!result.valid) {
        throw new Error(`Environment validation failed: ${result.errors.join(', ')}`);
      }
    }

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Initialize REZ Intelligence
    initIntelligence();

    app.listen(PORT, () => {
      logger.info(`BuzzLocal Rides Integration running on port ${PORT}`);
      logger.info('Connected to REZ Intelligence for movement patterns');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export { app };
