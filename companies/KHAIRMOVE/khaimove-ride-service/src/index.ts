import { logger } from '../../shared/logger';
// KHAIRMOVE Ride Service - Core ride-hailing with REZ Intelligence + JWT Auth
// Port: 4601

import express from 'express';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import helmet from 'helmet';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import {
  VehicleType,
  RideStatus,
  DriverStatus,
  PaymentMethod,
  Location,
  Ride,
} from '../../shared/types';
import {
  rideRequestSchema,
  fareEstimateSchema,
  nearbyDriversQuerySchema,
  cancelRideSchema,
  rateRideSchema,
} from '../../shared/schemas';
import {
  getIntelligence,
  KHAIRMOVEIntelligence,
  FraudAssessment,
} from '../../shared/integrations/rez-intelligence';
import {
  authenticate,
  optionalAuth,
  requireRole,
  AuthRequest,
  validateAuthEnv,
} from '../../shared/middleware/auth';
import {
  corsMiddleware,
  socketCorsOptions,
  createGlobalLimiter,
  createAuthLimiter,
  createOTPLimiter,
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

const PORT = process.env.PORT || 4601;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/khaimove-ride';

const REZ_CONFIG = {
  intentPredictorUrl: process.env.REZ_INTENT_URL || 'http://localhost:4018',
  signalAggregatorUrl: process.env.REZ_SIGNAL_URL || 'http://localhost:4142',
  fraudDetectionUrl: process.env.REZ_FRAUD_URL || 'http://localhost:3007',
  predictiveEngineUrl: process.env.REZ_PREDICTIVE_URL || 'http://localhost:4123',
  locationIntelUrl: process.env.REZ_LOCATION_URL || 'http://localhost:4040',
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
// FARE CONFIG
// ============================================

const FARE_CONFIG = {
  [VehicleType.BIKE]: { baseFare: 15, perKm: 6, perMin: 1 },
  [VehicleType.AUTO]: { baseFare: 25, perKm: 10, perMin: 1.5 },
  [VehicleType.CAB]: { baseFare: 40, perKm: 14, perMin: 2 },
  [VehicleType.SUV]: { baseFare: 60, perKm: 18, perMin: 2.5 },
};

const CASBACK_PERCENTAGE = 0.10;

// ============================================
// DATABASE MODELS
// ============================================

const rideSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  driverId: { type: String, index: true },
  pickup: { lat: Number, lng: Number, address: String, city: String, pincode: String },
  drop: { lat: Number, lng: Number, address: String, city: String, pincode: String },
  vehicleType: { type: String, enum: Object.values(VehicleType) },
  status: { type: String, enum: Object.values(RideStatus), default: RideStatus.REQUESTED },
  fare: {
    baseFare: Number, distanceFare: Number, timeFare: Number,
    surgeFare: { type: Number, default: 0 }, surgeMultiplier: { type: Number, default: 1 },
    discount: { type: Number, default: 0 }, couponAmount: { type: Number, default: 0 },
    subtotal: Number, cashback: Number, finalFare: Number,
  },
  paymentMethod: { type: String, enum: Object.values(PaymentMethod) },
  otp: { type: String },
  fraudCheck: { riskScore: Number, riskLevel: String, flags: [String], recommendation: String },
  requestedAt: { type: Date, default: Date.now },
  acceptedAt: Date, startedAt: Date, completedAt: Date, cancelledAt: Date,
  rating: Number, feedback: String,
  route: { distance: Number, duration: Number, polyline: String },
});

const driverSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: String, profileImage: String,
  vehicle: {
    type: { type: String }, make: String, model: String, year: Number,
    color: String, registrationNumber: String,
  },
  currentLocation: { lat: Number, lng: Number, heading: Number, speed: Number, updatedAt: Date },
  status: { type: String, enum: Object.values(DriverStatus), default: DriverStatus.OFFLINE },
  rating: { type: Number, default: 4.5 },
  totalRides: { type: Number, default: 0 },
  tier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'silver' },
  driverScore: { overall: { type: Number, default: 4.5 }, acceptanceRate: { type: Number, default: 0.8 }, cancellationRate: { type: Number, default: 0.1 } },
  createdAt: { type: Date, default: Date.now }, updatedAt: { type: Date, default: Date.now },
});

const RideModel = mongoose.model('Ride', rideSchema);
const DriverModel = mongoose.model('Driver', driverSchema);

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

// FIXED: 6-digit OTP (was 2-byte hex = only 65536 combinations)
function generateSecureOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
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
    service: 'khaimove-ride-service',
    version: '1.0.0',
    auth: 'jwt-enforced',
    timestamp: new Date(),
  });
});

// ============================================
// STAYOWN HOTEL INTEGRATION
// ============================================

import stayOwnClient from './integrations/stayOwnClient.js';

// Get guest transfer requests from hotel
app.get('/api/hotels/:hotelId/transfer-requests', async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { date } = req.query;

    const requests = await stayOwnClient.getGuestTransferRequests(
      hotelId,
      date as string || new Date().toISOString().split('T')[0]
    );
    res.json({ success: true, data: requests });
  } catch (error) {
    logger.error('Get transfer requests error:', error);
    res.status(500).json({ success: false, error: { code: 'TRANSFER_ERROR', message: 'Failed to get transfer requests' } });
  }
});

// Book airport transfer for hotel guest
app.post('/api/transfers/book', async (req, res) => {
  try {
    const { hotelId, guestName, guestPhone, flightNumber, pickupLocation, dropoffLocation, pickupTime, vehicleType, notes } = req.body;

    if (!hotelId || !guestName || !pickupLocation || !dropoffLocation || !pickupTime) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_PARAMS', message: 'Missing required fields' } });
    }

    const transfer = await stayOwnClient.bookGuestTransfer({
      hotelId,
      guestName,
      guestPhone,
      flightNumber,
      pickupLocation,
      dropoffLocation,
      pickupTime,
      vehicleType: vehicleType || 'cab',
      notes,
    });
    res.status(201).json({ success: true, data: transfer });
  } catch (error) {
    logger.error('Book transfer error:', error);
    res.status(500).json({ success: false, error: { code: 'BOOKING_ERROR', message: 'Failed to book transfer' } });
  }
});

// Update transfer status
app.post('/api/transfers/:transferId/status', async (req, res) => {
  try {
    const { transferId } = req.params;
    const { status, driverLocation, eta, driverName, driverPhone, vehicleDetails } = req.body;

    const result = await stayOwnClient.updateTransferStatus({
      transferId,
      status,
      driverLocation,
      eta,
      driverName,
      driverPhone,
      vehicleDetails,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Update transfer status error:', error);
    res.status(500).json({ success: false, error: { code: 'STATUS_ERROR', message: 'Failed to update status' } });
  }
});

// Get hotel guest info
app.get('/api/guests/:guestId', async (req, res) => {
  try {
    const { guestId } = req.params;
    const guest = await stayOwnClient.getHotelGuestInfo(guestId);
    res.json({ success: true, data: guest });
  } catch (error) {
    logger.error('Get guest info error:', error);
    res.status(500).json({ success: false, error: { code: 'GUEST_ERROR', message: 'Failed to get guest info' } });
  }
});

// Check StayOwn integration status
app.get('/api/integration/stayown/status', async (_req, res) => {
  try {
    const health = await stayOwnClient.checkHealth();
    res.json({
      success: true,
      data: {
        stayOwnConnected: health.connected,
        capabilities: [
          'airport_transfers',
          'guest_pickup',
          'hotel_booking_link',
          'realtime_updates',
        ],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'STATUS_ERROR', message: 'Failed to check integration' } });
  }
});

// Link ride to hotel booking
app.post('/api/rides/:rideId/link-hotel', async (req, res) => {
  try {
    const { rideId } = req.params;
    const { hotelBookingId, guestId, amount } = req.body;

    const result = await stayOwnClient.linkRideToHotelBooking({
      rideId,
      hotelBookingId,
      guestId,
      amount,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Link ride to hotel error:', error);
    res.status(500).json({ success: false, error: { code: 'LINK_ERROR', message: 'Failed to link ride' } });
  }
});

// ============================================
// FARE ROUTES (with ML surge) - PUBLIC
// ============================================

app.post('/api/fares/estimate', optionalAuth(), async (req: AuthRequest, res) => {
  try {
    const validated = fareEstimateSchema.parse(req.body);
    const distance = calculateDistance(validated.pickup.lat, validated.pickup.lng, validated.drop.lat, validated.drop.lng);
    const duration = (distance / 30) * 60;

    let surgeMultiplier = 1;
    let surgeReasons: string[] = [];

    try {
      const surgeData = await intelligence.getDynamicFare(validated.pickup as any, validated.vehicleType, FARE_CONFIG[validated.vehicleType].baseFare, distance, duration);
      surgeMultiplier = surgeData.surge;
      surgeReasons = surgeData.reasons;
    } catch {}

    const config = FARE_CONFIG[validated.vehicleType];
    const distanceFare = distance * config.perKm;
    const timeFare = (duration / 60) * config.perMin;
    const surgeFare = (distanceFare + timeFare) * (surgeMultiplier - 1);
    const subtotal = config.baseFare + distanceFare + timeFare + surgeFare;
    const cashback = subtotal * CASBACK_PERCENTAGE;

    res.json({
      success: true,
      data: {
        vehicleType: validated.vehicleType, baseFare: config.baseFare,
        perKmRate: config.perKm, perMinRate: config.perMin,
        estimatedDistance: Math.round(distance * 100) / 100,
        estimatedDuration: Math.round(duration),
        surgeMultiplier, surgeReasons,
        subtotal: Math.round(subtotal * 100) / 100,
        cashback: Math.round(cashback * 100) / 100,
        estimatedFare: Math.round(subtotal * 100) / 100,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to estimate fare' } });
    }
  }
});

// ============================================
// RIDE ROUTES - ALL AUTHENTICATED
// ============================================

// Request a ride - JWT REQUIRED
app.post('/api/rides', authenticate(), async (req: AuthRequest, res) => {
  try {
    const validated = rideRequestSchema.parse(req.body);
    const userId = req.userId || req.user?.userId || 'demo-user';

    const distance = calculateDistance(validated.pickup.lat, validated.pickup.lng, validated.drop.lat, validated.drop.lng);
    const duration = (distance / 30) * 60;

    let surgeMultiplier = 1;
    let surgeReasons: string[] = [];

    try {
      const fareData = await intelligence.getDynamicFare(validated.pickup as any, validated.vehicleType, FARE_CONFIG[validated.vehicleType].baseFare, distance, duration);
      surgeMultiplier = fareData.surge;
      surgeReasons = fareData.reasons;
    } catch {}

    const config = FARE_CONFIG[validated.vehicleType];
    const distanceFare = distance * config.perKm;
    const timeFare = (duration / 60) * config.perMin;
    const surgeFare = (distanceFare + timeFare) * (surgeMultiplier - 1);
    const subtotal = config.baseFare + distanceFare + timeFare + surgeFare;
    const cashback = subtotal * CASBACK_PERCENTAGE;

    // FRAUD DETECTION
    let fraudAssessment: FraudAssessment = {
      userId, riskScore: 0, riskLevel: 'low', flags: [], recommendation: 'allow', factors: {},
    };

    try {
      fraudAssessment = await intelligence.assessRideSafety(userId, {
        pickup: validated.pickup as Location,
        drop: validated.drop as Location,
        fare: subtotal, vehicleType: validated.vehicleType,
      });

      if (fraudAssessment.recommendation === 'block') {
        return res.status(403).json({
          success: false,
          error: { code: 'RIDE_BLOCKED', message: 'Unable to process ride request. Please contact support.', reference: generateSecureId() },
        });
      }
    } catch {}

    const ride = {
      id: generateSecureId(),
      userId,
      pickup: validated.pickup as Location,
      drop: validated.drop as Location,
      vehicleType: validated.vehicleType,
      status: RideStatus.REQUESTED,
      fare: {
        baseFare: config.baseFare,
        distanceFare: Math.round(distanceFare * 100) / 100,
        timeFare: Math.round(timeFare * 100) / 100,
        surgeFare: Math.round(surgeFare * 100) / 100,
        surgeMultiplier,
        discount: 0, couponAmount: 0,
        subtotal: Math.round(subtotal * 100) / 100,
        cashback: Math.round(cashback * 100) / 100,
        finalFare: Math.round(subtotal * 100) / 100,
      },
      paymentMethod: PaymentMethod.WALLET,
      otp: generateSecureOTP(),
      fraudCheck: {
        riskScore: fraudAssessment.riskScore,
        riskLevel: fraudAssessment.riskLevel,
        flags: fraudAssessment.flags,
        recommendation: fraudAssessment.recommendation,
      },
      requestedAt: new Date(),
    };

    const rideDoc = new RideModel(ride);
    await rideDoc.save();

    try {
      await intelligence.signals.recordEvent({
        type: 'ride.requested', rideId: ride.id, userId,
        vehicleType: validated.vehicleType,
        pickup: ride.pickup, drop: ride.drop, fare: subtotal, timestamp: new Date(),
      });
    } catch {}

    io.to(`user:${userId}`).emit('ride:requested', ride);

    res.status(201).json({
      success: true,
      data: { ride, fraudCheck: { riskLevel: fraudAssessment.riskLevel, passed: fraudAssessment.recommendation === 'allow' }, surgeInfo: { multiplier: surgeMultiplier, reasons: surgeReasons } },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      logger.error('Ride request error:', error);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to request ride' } });
    }
  }
});

// Get user's rides - JWT REQUIRED
app.get('/api/rides', authenticate(), async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || req.user?.userId;
    const { status, limit = '20', offset = '0' } = req.query;

    const query: Record<string, unknown> = { userId };
    if (status) query.status = status;

    const rides = await RideModel.find(query).sort({ requestedAt: -1 })
      .skip(parseInt(offset as string)).limit(parseInt(limit as string));
    const total = await RideModel.countDocuments(query);

    res.json({ success: true, data: { rides, total, limit: parseInt(limit as string), offset: parseInt(offset as string) } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get rides' } });
  }
});

// Get ride by ID - JWT REQUIRED
app.get('/api/rides/:id', authenticate(), async (req: AuthRequest, res) => {
  try {
    const ride = await RideModel.findOne({ id: req.params.id });
    if (!ride) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ride not found' } });
    }

    // Users can only see their own rides (unless admin)
    const userId = req.userId || req.user?.userId;
    if (ride.userId !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }

    res.json({ success: true, data: ride });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get ride' } });
  }
});

// Cancel ride - JWT REQUIRED
app.post('/api/rides/:id/cancel', authenticate(), async (req: AuthRequest, res) => {
  try {
    const validated = cancelRideSchema.parse(req.body);
    const ride = await RideModel.findOne({ id: req.params.id });

    if (!ride) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ride not found' } });
    }

    const userId = req.userId || req.user?.userId;
    if (ride.userId !== userId && ride.driverId !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }

    if (ride.status !== RideStatus.REQUESTED && ride.status !== RideStatus.ACCEPTED) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Cannot cancel ride' } });
    }

    ride.status = RideStatus.CANCELLED;
    ride.cancelledAt = new Date();
    if (validated.rating !== undefined) ride.rating = validated.rating;
    if (validated.feedback) ride.feedback = validated.feedback;
    await ride.save();

    try {
      await intelligence.signals.recordEvent({ type: 'ride.cancelled', rideId: ride.id, userId: ride.userId, driverId: ride.driverId, timestamp: new Date() });
    } catch {}

    io.to(`user:${ride.userId}`).emit('ride:cancelled', ride);
    res.json({ success: true, data: ride });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to cancel ride' } });
    }
  }
});

// Complete ride - DRIVER ONLY
app.post('/api/rides/:id/complete', authenticate(), requireRole('driver', 'admin'), async (req: AuthRequest, res) => {
  try {
    const ride = await RideModel.findOne({ id: req.params.id });

    if (!ride) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ride not found' } });
    }

    if (ride.status !== RideStatus.IN_PROGRESS) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Ride not in progress' } });
    }

    ride.status = RideStatus.COMPLETED;
    ride.completedAt = new Date();
    await ride.save();

    try {
      const cashbackResult = await intelligence.afterRideCompleted(
        ride.id, ride.userId, ride.driverId!, ride.fare.finalFare, ride.pickup as Location, ride.drop as Location
      );
      await intelligence.signals.recordEvent({
        type: 'ride.completed', rideId: ride.id, userId: ride.userId, driverId: ride.driverId,
        vehicleType: ride.vehicleType, pickup: ride.pickup as Location, drop: ride.drop as Location,
        fare: ride.fare.finalFare, timestamp: new Date(),
      });
      logger.info(`Cashback: Rs.${cashbackResult.cashbackAmount} for ride ${ride.id}`);
    } catch (error) {
      logger.error('Post-ride processing failed:', error);
    }

    io.to(`user:${ride.userId}`).emit('ride:completed', ride);
    if (ride.driverId) io.to(`driver:${ride.driverId}`).emit('ride:completed', ride);

    res.json({
      success: true,
      data: { ride, cashbackInfo: { amount: ride.fare.cashback, message: `${ride.fare.cashback}% cashback credited` } },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to complete ride' } });
  }
});

// Rate ride - JWT REQUIRED
app.post('/api/rides/:id/rate', authenticate(), async (req: AuthRequest, res) => {
  try {
    const validated = rateRideSchema.parse(req.body);
    const ride = await RideModel.findOne({ id: req.params.id });

    if (!ride) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ride not found' } });
    }

    ride.rating = validated.rating;
    if (validated.feedback) ride.feedback = validated.feedback;
    await ride.save();

    if (ride.driverId) {
      const driver = await DriverModel.findOne({ id: ride.driverId });
      if (driver) {
        const allRides = await RideModel.find({ driverId: driver.id, rating: { $exists: true } });
        driver.rating = Math.round((allRides.reduce((sum, r) => sum + (r.rating || 0), 0) / allRides.length) * 10) / 10;
        driver.totalRides = allRides.length;
        driver.updatedAt = new Date();
        await driver.save();

        try {
          const score = await intelligence.scoreDriver(driver.id);
          driver.tier = score.tier;
          driver.driverScore = { overall: score.overallScore, acceptanceRate: score.acceptanceRate, cancellationRate: score.cancellationRate };
          await driver.save();
        } catch {}
      }
    }

    res.json({ success: true, data: ride });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to rate ride' } });
    }
  }
});

// ============================================
// DRIVER ROUTES - ALL AUTHENTICATED
// ============================================

// Nearby drivers - JWT REQUIRED (was public)
app.get('/api/drivers/nearby', authenticate(), async (req, res) => {
  try {
    const validated = nearbyDriversQuerySchema.parse(req.query);

    let demandLevel = 'medium';
    try {
      const insights = await intelligence.getSupplyDemandInsights(validated.lat, validated.lng);
      demandLevel = insights.demandLevel;
    } catch {}

    const query: Record<string, unknown> = { status: { $in: [DriverStatus.ONLINE, DriverStatus.BUSY] } };
    if (validated.vehicleType) query['vehicle.type'] = validated.vehicleType;

    const drivers = await DriverModel.find(query).limit(validated.limit);

    const scoredDrivers = await Promise.all(drivers.map(async (driver) => {
      try {
        const score = await intelligence.scoreDriver(driver.id);
        return { ...driver.toObject(), mlScore: score.overallScore, tier: score.tier, priorityScore: score.overallScore * (demandLevel === 'high' || demandLevel === 'surge' ? 1.2 : 1) };
      } catch {
        return { ...driver.toObject(), mlScore: 4.5, tier: 'silver', priorityScore: 4.5 };
      }
    }));

    scoredDrivers.sort((a, b) => b.priorityScore - a.priorityScore);

    res.json({ success: true, data: { drivers: scoredDrivers, demandLevel } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to find drivers' } });
    }
  }
});

app.put('/api/drivers/:id/location', authenticate(), async (req, res) => {
  try {
    const { location, heading, speed } = req.body;
    const driver = await DriverModel.findOne({ id: req.params.id });

    if (!driver) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Driver not found' } });
    }

    driver.currentLocation = { lat: location.lat, lng: location.lng, heading, speed, updatedAt: new Date() };
    await driver.save();

    try {
      await intelligence.location.recordDemandEvent(location.lat, location.lng, { type: 'request', vehicleType: driver.vehicle?.type });
    } catch {}

    io.emit('driver:location', { driverId: driver.id, location: driver.currentLocation, timestamp: new Date() });
    res.json({ success: true, data: driver.currentLocation });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update location' } });
  }
});

app.post('/api/drivers/accept/:rideId', authenticate(), requireRole('driver', 'admin'), async (req: AuthRequest, res) => {
  try {
    const driverId = req.userId || req.user?.userId;
    const ride = await RideModel.findOne({ id: req.params.rideId });

    if (!ride) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ride not found' } });
    }

    if (ride.status !== RideStatus.REQUESTED) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Ride no longer available' } });
    }

    try {
      const score = await intelligence.scoreDriver(driverId!);
      // Check if overall score is too low (below 3.0)
      if (score.overallScore < 3.0) {
        return res.status(403).json({ success: false, error: { code: 'DRIVER_BLOCKED', message: 'Unable to accept ride' } });
      }
    } catch {}

    ride.driverId = driverId;
    ride.status = RideStatus.ACCEPTED;
    ride.acceptedAt = new Date();
    await ride.save();

    await DriverModel.updateOne({ id: driverId }, { status: DriverStatus.BUSY });

    try {
      await intelligence.signals.recordEvent({ type: 'ride.accepted', rideId: ride.id, userId: ride.userId, driverId: driverId!, timestamp: new Date() });
    } catch {}

    io.to(`user:${ride.userId}`).emit('ride:accepted', { ride, driver: await DriverModel.findOne({ id: driverId }) });
    io.to(`driver:${driverId}`).emit('ride:accepted', ride);

    res.json({ success: true, data: ride });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to accept ride' } });
  }
});

app.get('/api/drivers/:id', authenticate(), async (req: AuthRequest, res) => {
  try {
    const driver = await DriverModel.findOne({ id: req.params.id });
    if (!driver) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Driver not found' } });
    }

    let mlScore = null;
    try { mlScore = await intelligence.scoreDriver(driver.id); } catch {}

    res.json({ success: true, data: { ...driver.toObject(), mlScore } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get driver' } });
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
    // Verify the token
    const jwt = require('../../shared/middleware/auth');
    await jwt.verifyJWT(token);
  } catch (error) {
    socket.emit('error', { message: 'Invalid authentication token' });
    socket.disconnect();
    return;
  }

  socket.on('join', (data: { type: 'user' | 'driver'; id: string }) => {
    socket.join(`${data.type}:${data.id}`);
    logger.info(`Socket ${socket.id} joined room: ${data.type}:${data.id}`);
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

  // Stop accepting new connections
  server?.close(() => {
    logger.info('HTTP server closed successfully');
  });

  // Give outstanding requests 30 seconds to complete
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);

  // Close MongoDB connection
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
    initIntelligence();
    logger.info('REZ Intelligence initialized');
    await DriverModel.collection.createIndex({ currentLocation: '2dsphere' });

    server = httpServer.listen(PORT, () => {
      logger.info(`KHAIRMOVE Ride Service running on port ${PORT}`);
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
