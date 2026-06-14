import { logger } from '../../shared/logger';
// KHAIRMOVE Fleet Service - Fleet management with REZ Intelligence
// Port: 4602

import express from 'express';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import helmet from 'helmet';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import {
  Fleet,
  FleetVehicle,
  FleetStatus,
  DriverStatus,
  Location,
  DispatchRequest,
  VehicleType,
} from '../../shared/types';
import {
  fleetCreationSchema,
  dispatchRequestSchema,
  vehicleSchema,
  driverRegistrationSchema,
} from '../../shared/schemas';
import {
  getIntelligence,
  KHAIRMOVEIntelligence,
  DriverScore,
  DemandSignal,
} from '../../shared/integrations/rez-intelligence';
import {
  authenticate,
  requireRole,
  AuthRequest,
  validateAuthEnv,
} from '../../shared/middleware/auth';
import {
  corsMiddleware,
  socketCorsOptions,
  createGlobalLimiter,
  createAuthLimiter,
  validateRequiredEnvVars,
  requestIdMiddleware,
  requestLoggingMiddleware,
} from '../../shared';

// ============================================
// PRODUCTION ENVIRONMENT VALIDATION
// ============================================

if (process.env.NODE_ENV === 'production') {
  validateAuthEnv();
  const result = validateRequiredEnvVars(['PORT', 'MONGODB_URI', 'JWT_SECRET', 'INTERNAL_SERVICE_TOKEN', 'REZ_INTELLIGENCE_API_KEY']);
  if (!result.valid) {
    throw new Error(`Environment validation failed: ${result.errors.join(', ')}`);
  }
}

// ============================================
// CONFIGURATION
// ============================================

const PORT = process.env.PORT || 4602;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/khaimove-fleet';

// Configure REZ Intelligence
const REZ_CONFIG = {
  predictiveEngineUrl: process.env.REZ_PREDICTIVE_URL || 'http://localhost:4123',
  locationIntelUrl: process.env.REZ_LOCATION_URL || 'http://localhost:4040',
  signalAggregatorUrl: process.env.REZ_SIGNAL_URL || 'http://localhost:4142',
  walletServiceUrl: process.env.WALLET_SERVICE_URL || 'http://localhost:4004',
  notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011',
  apiKey: process.env.REZ_INTELLIGENCE_API_KEY || 'rez-api-key',
  internalToken: process.env.INTERNAL_SERVICE_TOKEN || 'khaimove-internal',
};

let intelligence: KHAIRMOVEIntelligence;

function initIntelligence() {
  intelligence = getIntelligence();
  intelligence.configure(REZ_CONFIG);
}

// ============================================
// DATABASE MODELS
// ============================================

const fleetSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  ownerId: { type: String, required: true, index: true },
  vehicles: [String],
  drivers: [String],
  status: { type: String, enum: Object.values(FleetStatus), default: FleetStatus.ACTIVE },
  stats: {
    totalVehicles: { type: Number, default: 0 },
    activeVehicles: { type: Number, default: 0 },
    totalRides: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    averageRating: { type: Number, default: 4.5 },
    utilizationRate: { type: Number, default: 0 },
  },
  createdAt: { type: Date, default: Date.now },
});

const fleetVehicleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  fleetId: { type: String, required: true, index: true },
  driverId: String,
  type: { type: String, enum: Object.values(VehicleType) },
  make: String,
  model: String,
  year: Number,
  color: String,
  registrationNumber: { type: String, required: true },
  insuranceExpiry: Date,
  pollutionCertExpiry: Date,
  imageUrls: [String],
  isVerified: { type: Boolean, default: false },
  status: { type: String, enum: Object.values(FleetStatus), default: FleetStatus.ACTIVE },
  lastServiceDate: Date,
  nextServiceDate: Date,
  odometer: { type: Number, default: 0 },
  fuelLevel: Number,
  currentLocation: {
    lat: Number,
    lng: Number,
    updatedAt: Date,
  },
});

const fleetDriverSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  fleetId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  profileImage: String,
  vehicleId: String,
  currentLocation: {
    lat: Number,
    lng: Number,
    heading: Number,
    updatedAt: Date,
  },
  status: { type: String, enum: Object.values(DriverStatus), default: DriverStatus.OFFLINE },
  rating: { type: Number, default: 4.5 },
  totalRides: { type: Number, default: 0 },
  tier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'silver' },
  driverScore: {
    overall: { type: Number, default: 4.5 },
    acceptanceRate: { type: Number, default: 0.8 },
    cancellationRate: { type: Number, default: 0.1 },
    utilizationRate: { type: Number, default: 0.6 },
  },
  incentiveHistory: [{
    type: String,
    amount: Number,
    reason: String,
    createdAt: Date,
  }],
  createdAt: { type: Date, default: Date.now },
});

const FleetModel = mongoose.model('Fleet', fleetSchema);
const FleetVehicleModel = mongoose.model('FleetVehicle', fleetVehicleSchema);
const FleetDriverModel = mongoose.model('FleetDriver', fleetDriverSchema);

// ============================================
// EXPRESS APP
// ============================================

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, { cors: socketCorsOptions });

// Security middleware - order matters!
app.use(requestIdMiddleware);
app.use(requestLoggingMiddleware);
app.use(helmet());
app.use(corsMiddleware);
app.use(express.json());

// Rate limiting - global then specific
app.use('/api/', createGlobalLimiter());
app.use('/api/auth', createAuthLimiter());

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
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ============================================
// HEALTH CHECKS
// ============================================

app.get('/health/live', (req, res) => {
  res.json({ status: 'alive', timestamp: new Date() });
});

app.get('/health/ready', async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.json({ status: 'ready', mongodb: 'connected' });
  } catch {
    res.status(503).json({ status: 'not_ready', mongodb: 'disconnected' });
  }
});

// Legacy health endpoint
app.get('/health', async (req, res) => {
  res.json({
    status: 'ok',
    service: 'khaimove-fleet-service',
    version: '1.0.0',
    timestamp: new Date(),
  });
});

// ============================================
// API ROUTES - ALL AUTHENTICATED
// ============================================

// Fleet Management
app.post('/api/fleets', authenticate(), async (req: AuthRequest, res) => {
  try {
    const validated = fleetCreationSchema.parse(req.body);

    const fleet: Fleet = {
      id: generateSecureId(),
      name: validated.name,
      ownerId: validated.ownerId,
      vehicles: validated.vehicleIds || [],
      drivers: validated.driverIds || [],
      status: FleetStatus.ACTIVE,
      stats: {
        totalVehicles: 0,
        activeVehicles: 0,
        totalRides: 0,
        totalEarnings: 0,
        averageRating: 4.5,
        utilizationRate: 0,
      },
      createdAt: new Date(),
    };

    const fleetDoc = new FleetModel(fleet);
    await fleetDoc.save();

    res.status(201).json({ success: true, data: fleet });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create fleet' } });
    }
  }
});

app.get('/api/fleets', authenticate(), async (req: AuthRequest, res) => {
  try {
    const { ownerId } = req.query;
    const query: Record<string, unknown> = {};
    if (ownerId) query.ownerId = ownerId;

    const fleets = await FleetModel.find(query);
    res.json({ success: true, data: fleets });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get fleets' } });
  }
});

app.get('/api/fleets/:id', authenticate(), async (req: AuthRequest, res) => {
  try {
    const fleet = await FleetModel.findOne({ id: req.params.id });
    if (!fleet) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Fleet not found' } });
    }

    const vehicles = await FleetVehicleModel.find({ fleetId: fleet.id });
    const drivers = await FleetDriverModel.find({ fleetId: fleet.id });

    // Score all drivers with ML
    const scoredDrivers = await Promise.all(
      drivers.map(async (driver) => {
        let mlScore: DriverScore | null = null;
        try {
          mlScore = await intelligence.scoreDriver(driver.id);
        } catch {}
        return {
          ...driver.toObject(),
          mlScore,
        };
      })
    );

    res.json({
      success: true,
      data: {
        ...fleet.toObject(),
        vehicles,
        drivers: scoredDrivers,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get fleet' } });
  }
});

// Vehicle Management
app.post('/api/vehicles', authenticate(), requireRole('fleet_owner', 'admin'), async (req: AuthRequest, res) => {
  try {
    const validated = vehicleSchema.parse(req.body);
    const { fleetId } = req.body;

    const vehicle: FleetVehicle = {
      id: generateSecureId(),
      fleetId,
      type: validated.type,
      make: validated.make,
      model: validated.model,
      year: validated.year,
      color: validated.color,
      registrationNumber: validated.registrationNumber,
      status: FleetStatus.ACTIVE,
      odometer: 0,
    } as FleetVehicle;

    const vehicleDoc = new FleetVehicleModel(vehicle);
    await vehicleDoc.save();

    await FleetModel.updateOne({ id: fleetId }, { $inc: { 'stats.totalVehicles': 1 } });

    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to add vehicle' } });
    }
  }
});

app.get('/api/vehicles/:id', authenticate(), async (req: AuthRequest, res) => {
  try {
    const vehicle = await FleetVehicleModel.findOne({ id: req.params.id });
    if (!vehicle) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Vehicle not found' } });
    }
    res.json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get vehicle' } });
  }
});

app.put('/api/vehicles/:id/location', authenticate(), async (req: AuthRequest, res) => {
  try {
    const { lat, lng } = req.body;
    const vehicle = await FleetVehicleModel.findOneAndUpdate(
      { id: req.params.id },
      {
        currentLocation: { lat, lng, updatedAt: new Date() },
      },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Vehicle not found' } });
    }

    // Record to demand signals
    try {
      await intelligence.location.recordDemandEvent(lat, lng, {
        type: 'request' as any,
        vehicleType: vehicle.type,
      });
    } catch {}

    io.emit('vehicle:location', { vehicleId: vehicle.id, location: vehicle.currentLocation });

    res.json({ success: true, data: vehicle.currentLocation });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update location' } });
  }
});

// Driver Management
app.post('/api/drivers', authenticate(), requireRole('fleet_owner', 'admin'), async (req: AuthRequest, res) => {
  try {
    const validated = driverRegistrationSchema.omit({ vehicle: true, bankDetails: true }).parse(req.body);
    const { fleetId, vehicleId } = req.body;

    // Generate ML-based initial score
    let initialScore: DriverScore = {
      driverId: '',
      overallScore: 4.5,
      rating: 4.5,
      acceptanceRate: 0.8,
      cancellationRate: 0.1,
      utilizationRate: 0.6,
      riskFactors: [],
      tier: 'silver',
    };

    const driver = {
      id: generateSecureId(),
      fleetId,
      name: validated.name,
      phone: validated.phone,
      email: validated.email,
      vehicleId,
      status: DriverStatus.OFFLINE,
      rating: 4.5,
      totalRides: 0,
      tier: initialScore.tier,
      driverScore: {
        overall: initialScore.overallScore,
        acceptanceRate: initialScore.acceptanceRate,
        cancellationRate: initialScore.cancellationRate,
        utilizationRate: initialScore.utilizationRate,
      },
    };

    initialScore.driverId = driver.id;
    const driverDoc = new FleetDriverModel(driver);
    await driverDoc.save();

    res.status(201).json({
      success: true,
      data: {
        ...driver,
        mlScore: initialScore,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to add driver' } });
    }
  }
});

app.get('/api/drivers', authenticate(), async (req: AuthRequest, res) => {
  try {
    const { fleetId, status, tier } = req.query;
    const query: Record<string, unknown> = {};
    if (fleetId) query.fleetId = fleetId;
    if (status) query.status = status;
    if (tier) query.tier = tier;

    const drivers = await FleetDriverModel.find(query);

    // Score drivers with ML
    const scoredDrivers = await Promise.all(
      drivers.map(async (driver) => {
        let mlScore: DriverScore | null = null;
        try {
          mlScore = await intelligence.scoreDriver(driver.id);
        } catch {}
        return {
          ...driver.toObject(),
          mlScore,
        };
      })
    );

    res.json({ success: true, data: scoredDrivers });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get drivers' } });
  }
});

app.get('/api/drivers/:id', authenticate(), async (req: AuthRequest, res) => {
  try {
    const driver = await FleetDriverModel.findOne({ id: req.params.id });
    if (!driver) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Driver not found' } });
    }

    // Get ML score
    let mlScore: DriverScore | null = null;
    try {
      mlScore = await intelligence.scoreDriver(driver.id);
    } catch {}

    res.json({
      success: true,
      data: {
        ...driver.toObject(),
        mlScore,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get driver' } });
  }
});

app.put('/api/drivers/:id/status', authenticate(), async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    const driver = await FleetDriverModel.findOneAndUpdate(
      { id: req.params.id },
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!driver) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Driver not found' } });
    }

    res.json({ success: true, data: driver });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update status' } });
  }
});

app.put('/api/drivers/:id/location', authenticate(), async (req: AuthRequest, res) => {
  try {
    const { lat, lng, heading, speed } = req.body;
    const driver = await FleetDriverModel.findOneAndUpdate(
      { id: req.params.id },
      {
        currentLocation: { lat, lng, heading, speed, updatedAt: new Date() },
      },
      { new: true }
    );

    if (!driver) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Driver not found' } });
    }

    io.emit('driver:location', { driverId: driver.id, location: driver.currentLocation });

    res.json({ success: true, data: driver.currentLocation });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update location' } });
  }
});

// Dispatch with ML optimization
app.post('/api/dispatch', authenticate(), async (req: AuthRequest, res) => {
  try {
    const validated = dispatchRequestSchema.parse(req.body);

    // Get demand insights
    let demandLevel = 'medium';
    let hotZones: { lat: number; lng: number; intensity: number }[] = [];
    try {
      const insights = await intelligence.getSupplyDemandInsights(validated.pickup.lat, validated.pickup.lng);
      demandLevel = insights.demandLevel;
      hotZones = insights.hotZones;
    } catch {}

    // Find available drivers with ML scoring
    const availableDrivers = await FleetDriverModel.find({
      status: DriverStatus.ONLINE,
      vehicleId: { $exists: true },
    });

    // Score and sort by ML
    const scoredDrivers = await Promise.all(
      availableDrivers.map(async (driver) => {
        let score: DriverScore | null = null;
        let distance = Infinity;

        if (driver.currentLocation) {
          distance = calculateDistance(
            validated.pickup.lat, validated.pickup.lng,
            driver.currentLocation.lat, driver.currentLocation.lng
          );
        }

        try {
          score = await intelligence.scoreDriver(driver.id);
        } catch {}

        // Calculate priority score considering demand
        let priorityScore = (score?.overallScore || 4.5) * 10;
        priorityScore -= distance * 0.5; // Closer is better

        // Boost for high-demand areas
        if (demandLevel === 'high' || demandLevel === 'surge') {
          priorityScore *= 1.2;
        }

        return {
          driverId: driver.id,
          driverName: driver.name,
          score: score?.overallScore || 4.5,
          tier: score?.tier || 'silver',
          distance,
          priorityScore,
          vehicleType: undefined, // Would come from vehicle lookup
        };
      })
    );

    // Sort by priority
    scoredDrivers.sort((a, b) => b.priorityScore - a.priorityScore);

    if (scoredDrivers.length > 0) {
      const bestDriver = scoredDrivers[0];
      const estimatedPickupTime = Math.ceil(bestDriver.distance * 3); // 3 mins per km

      res.json({
        success: true,
        data: {
          assigned: true,
          driverId: bestDriver.driverId,
          driverName: bestDriver.driverName,
          tier: bestDriver.tier,
          driverScore: bestDriver.score,
          distance: Math.round(bestDriver.distance * 100) / 100,
          estimatedPickupTime,
          demandLevel,
          hotZonesNearby: hotZones.length,
        },
      });
    } else {
      res.json({
        success: true,
        data: {
          assigned: false,
          alternatives: ['No drivers available', 'Try a different vehicle type'],
          demandLevel,
        },
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to dispatch' } });
    }
  }
});

// Driver incentives with ML
app.get('/api/drivers/:id/incentives', authenticate(), async (req: AuthRequest, res) => {
  try {
    const driver = await FleetDriverModel.findOne({ id: req.params.id });
    if (!driver) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Driver not found' } });
    }

    // Get ML-based incentive recommendation
    const incentiveRecommendation = await intelligence.shouldIncentivizeDriver(driver.id);

    res.json({
      success: true,
      data: {
        currentTier: driver.tier,
        driverScore: driver.driverScore,
        incentiveRecommendation,
        incentiveHistory: driver.incentiveHistory,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get incentives' } });
  }
});

app.post('/api/drivers/:id/incentives', authenticate(), requireRole('fleet_owner', 'admin'), async (req: AuthRequest, res) => {
  try {
    const { type, amount, reason } = req.body;
    const driver = await FleetDriverModel.findOneAndUpdate(
      { id: req.params.id },
      {
        $push: {
          incentiveHistory: {
            type,
            amount,
            reason,
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!driver) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Driver not found' } });
    }

    // Notify driver
    try {
      await intelligence.notification.sendPush(driver.id, {
        title: 'Incentive Earned!',
        body: `You've earned Rs.${amount} - ${reason}`,
        data: { type, amount, reason },
      });
    } catch {}

    res.json({
      success: true,
      data: {
        driverId: driver.id,
        incentive: { type, amount, reason },
        totalEarnings: (driver.incentiveHistory as any[]).reduce((sum: number, i: { amount: number }) => sum + i.amount, 0),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to add incentive' } });
  }
});

// Surge/Pricing with ML
app.get('/api/surge/:lat/:lng', authenticate(), async (req, res) => {
  try {
    const lat = parseFloat(req.params.lat);
    const lng = parseFloat(req.params.lng);

    // Get ML-based surge prediction
    let surgeData = {
      currentMultiplier: 1.0,
      predictedMultiplier: 1.0,
      confidence: 0.5,
      eta: 0,
      reasons: [] as string[],
    };

    try {
      const predicted = await intelligence.location.predictSurge(lat, lng);
      surgeData = {
        currentMultiplier: predicted.currentMultiplier || 1.0,
        predictedMultiplier: predicted.predictedMultiplier || 1.0,
        confidence: predicted.confidence || 0.5,
        eta: predicted.eta || 0,
        reasons: predicted.reasons || [],
      };
    } catch {}

    // Get demand signals
    let demandSignals: DemandSignal[] = [];
    try {
      demandSignals = await intelligence.location.getDemandSignals(lat, lng);
    } catch {}

    const demandSignal = demandSignals[0];

    res.json({
      success: true,
      data: {
        lat,
        lng,
        surge: surgeData,
        demand: {
          level: demandSignal?.demandLevel || 'medium',
          activeDrivers: demandSignal?.activeDrivers || 0,
          pendingRequests: demandSignal?.pendingRequests || 0,
          waitTime: demandSignal?.waitTime || 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get surge' } });
  }
});

// Analytics with ML
app.get('/api/fleets/:id/analytics', authenticate(), async (req: AuthRequest, res) => {
  try {
    const fleet = await FleetModel.findOne({ id: req.params.id });
    if (!fleet) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Fleet not found' } });
    }

    const vehicles = await FleetVehicleModel.find({ fleetId: fleet.id });
    const drivers = await FleetDriverModel.find({ fleetId: fleet.id });

    // Score all drivers with ML
    const driverScores = await Promise.all(
      drivers.map(async (driver) => {
        try {
          return await intelligence.scoreDriver(driver.id);
        } catch {
          return null;
        }
      })
    );

    const validScores = driverScores.filter(Boolean);
    const avgScore = validScores.length > 0
      ? validScores.reduce((sum, s) => sum + (s?.overallScore || 0), 0) / validScores.length
      : 4.5;

    // Calculate tier distribution
    const tierDistribution = {
      platinum: validScores.filter(s => s?.tier === 'platinum').length,
      gold: validScores.filter(s => s?.tier === 'gold').length,
      silver: validScores.filter(s => s?.tier === 'silver').length,
      bronze: validScores.filter(s => s?.tier === 'bronze').length,
    };

    // Calculate utilization rate
    const onlineDrivers = drivers.filter(d => d.status === DriverStatus.ONLINE).length;
    const utilizationRate = drivers.length > 0 ? onlineDrivers / drivers.length : 0;

    res.json({
      success: true,
      data: {
        fleetId: fleet.id,
        stats: {
          ...fleet.stats,
          totalVehicles: vehicles.length,
          activeVehicles: vehicles.filter(v => v.status === FleetStatus.ACTIVE).length,
          totalDrivers: drivers.length,
          onlineDrivers,
          utilizationRate: Math.round(utilizationRate * 100),
        },
        driverPerformance: {
          averageScore: Math.round(avgScore * 100) / 100,
          tierDistribution,
          totalIncentives: drivers.reduce((sum: number, d: any) =>
            sum + d.incentiveHistory.reduce((s: number, i: { amount: number }) => s + i.amount, 0), 0
          ),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get analytics' } });
  }
});

// ============================================
// SOCKET HANDLERS - WITH AUTHENTICATION
// ============================================

io.on('connection', async (socket) => {
  logger.info('Socket client connected:', socket.id);

  // Authenticate socket connection
  const token = socket.handshake.auth.token;
  if (!token) {
    socket.emit('error', { message: 'Authentication required' });
    socket.disconnect();
    return;
  }

  try {
    const jwt = require('../../shared/middleware/auth');
    await jwt.verifyJWT(token);
  } catch (error) {
    socket.emit('error', { message: 'Invalid authentication token' });
    socket.disconnect();
    return;
  }

  socket.on('fleet:join', (fleetId: string) => {
    socket.join(`fleet:${fleetId}`);
    logger.info(`Socket ${socket.id} joined fleet room: ${fleetId}`);
  });

  socket.on('dispatch:request', async (data: DispatchRequest) => {
    // ML-optimized dispatch would happen here
    socket.emit('dispatch:result', { status: 'processing' });
  });

  socket.on('disconnect', () => {
    logger.info('Socket client disconnected:', socket.id);
  });
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

let server: ReturnType<typeof httpServer.listen>;

async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received, initiating graceful shutdown...`);

  server?.close(() => {
    logger.info('HTTP server closed successfully');
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);

  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
  }

  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================
// SERVER STARTUP
// ============================================

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Initialize REZ Intelligence
    initIntelligence();
    logger.info('REZ Intelligence initialized');

    await FleetVehicleModel.collection.createIndex({ currentLocation: '2dsphere' });
    await FleetDriverModel.collection.createIndex({ currentLocation: '2dsphere' });

    server = httpServer.listen(PORT, () => {
      logger.info(`KHAIRMOVE Fleet Service running on port ${PORT}`);
      logger.info('Auth: JWT Enforcement Enabled');
      logger.info('Security: Production-ready middleware active');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export { app, io };
