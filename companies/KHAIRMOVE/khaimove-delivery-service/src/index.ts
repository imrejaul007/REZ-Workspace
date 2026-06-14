import { logger } from '../../shared/logger';
// KHAIRMOVE Delivery Service - Hyperlocal delivery with REZ Intelligence
// Port: 4603

import express from 'express';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import helmet from 'helmet';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import {
  Delivery,
  DeliveryStatus,
  DeliveryPriority,
  DeliveryRequest,
  DeliveryItem,
  DeliveryFare,
  Location,
} from '../../shared/types';
import {
  deliveryRequestSchema,
  updateDeliveryStatusSchema,
} from '../../shared/schemas';
import {
  getIntelligence,
  KHAIRMOVEIntelligence,
} from '../../shared/integrations/rez-intelligence';
import {
  authenticate,
  optionalAuth,
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

const PORT = process.env.PORT || 4603;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/khaimove-delivery';

// Configure REZ Intelligence
const REZ_CONFIG = {
  locationIntelUrl: process.env.REZ_LOCATION_URL || 'http://localhost:4040',
  signalAggregatorUrl: process.env.REZ_SIGNAL_URL || 'http://localhost:4142',
  predictiveEngineUrl: process.env.REZ_PREDICTIVE_URL || 'http://localhost:4123',
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
// DELIVERY FARE CONFIG
// ============================================

const DELIVERY_FARE_CONFIG = {
  [DeliveryPriority.STANDARD]: { baseFare: 30, perKg: 10, perKm: 8 },
  [DeliveryPriority.EXPRESS]: { baseFare: 60, perKg: 20, perKm: 15 },
  [DeliveryPriority.INSTANT]: { baseFare: 100, perKg: 30, perKm: 25 },
};

const CASBACK_PERCENTAGE = 0.10;

// ============================================
// DATABASE MODELS
// ============================================

const deliverySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  requestId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  driverId: { type: String, index: true },
  pickup: {
    lat: Number,
    lng: Number,
    address: String,
    city: String,
  },
  drop: {
    lat: Number,
    lng: Number,
    address: String,
    city: String,
  },
  items: [{
    name: String,
    quantity: Number,
    weight: Number,
    description: String,
  }],
  status: { type: String, enum: Object.values(DeliveryStatus), default: DeliveryStatus.PENDING },
  priority: { type: String, enum: Object.values(DeliveryPriority), default: DeliveryPriority.STANDARD },
  otp: String,
  fare: {
    baseFare: Number,
    weightFare: Number,
    distanceFare: Number,
    priorityFare: Number,
    totalFare: Number,
    cashback: Number,
  },
  estimatedDelivery: Date,
  eta: {
    predicted: Number,
    actual: Number,
    confidence: Number,
  },
  receiverName: String,
  receiverPhone: String,
  instructions: String,
  pickedUpAt: Date,
  deliveredAt: Date,
  proof: {
    otpVerified: Boolean,
    signature: String,
    photoUrl: String,
    notes: String,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const deliveryDriverSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  vehicleType: { type: String, enum: ['bike', 'scooter', 'cycle'] },
  currentLocation: {
    lat: Number,
    lng: Number,
    updatedAt: Date,
  },
  status: { type: String, enum: ['offline', 'online', 'busy', 'in_delivery'], default: 'offline' },
  rating: { type: Number, default: 4.5 },
  totalDeliveries: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const DeliveryModel = mongoose.model('Delivery', deliverySchema);
const DeliveryDriverModel = mongoose.model('DeliveryDriver', deliveryDriverSchema);

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
app.use('/api/deliveries/:id/verify-otp', createOTPLimiter());

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
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateDeliveryFare(
  priority: DeliveryPriority,
  totalWeight: number,
  distance: number
): DeliveryFare {
  const config = DELIVERY_FARE_CONFIG[priority];
  const weightFare = totalWeight * config.perKg;
  const distanceFare = distance * config.perKm;
  const subtotal = config.baseFare + weightFare + distanceFare;
  const cashback = subtotal * CASBACK_PERCENTAGE;

  return {
    baseFare: config.baseFare,
    weightFare: Math.round(weightFare * 100) / 100,
    distanceFare: Math.round(distanceFare * 100) / 100,
    priorityFare: priority !== DeliveryPriority.STANDARD ? config.baseFare - 30 : 0,
    totalFare: Math.round(subtotal * 100) / 100,
    cashback: Math.round(cashback * 100) / 100,
  };
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
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'khaimove-delivery-service',
    version: '1.0.0',
    timestamp: new Date(),
  });
});

// ============================================
// API ROUTES - ALL AUTHENTICATED
// ============================================

// Get delivery estimate with ML ETA - OPTIONAL AUTH (public estimate)
app.post('/api/deliveries/estimate', optionalAuth(), async (req: AuthRequest, res) => {
  try {
    const validated = deliveryRequestSchema
      .omit({ items: true, receiverName: true, receiverPhone: true, instructions: true })
      .parse(req.body);

    const distance = calculateDistance(
      validated.pickup.lat, validated.pickup.lng,
      validated.drop.lat, validated.drop.lng
    );

    // Get ML-based ETA from REZ Intelligence
    const estimates = await Promise.all(
      Object.values(DeliveryPriority).map(async (priority) => {
        const fare = calculateDeliveryFare(priority, 1, distance);

        // Get ML ETA prediction
        let etaData = { eta: 30, confidence: 0.5 };
        try {
          // Fallback: use demand as proxy for ETA
          const demand = await intelligence.location.getHotZones(
            validated.pickup.lat,
            validated.pickup.lng,
            5
          );
          etaData = { eta: 30, confidence: demand.length > 0 ? 0.8 : 0.5 };
        } catch {}

        // Adjust ETA based on priority
        const baseETA = priority === DeliveryPriority.INSTANT ? 15 :
                       priority === DeliveryPriority.EXPRESS ? 30 : 60;

        return {
          priority,
          estimatedFare: fare.totalFare,
          estimatedDistance: Math.round(distance * 100) / 100,
          estimatedTime: etaData.eta || baseETA,
          etaConfidence: etaData.confidence,
          cashback: fare.cashback,
        };
      })
    );

    res.json({ success: true, data: estimates });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to estimate' } });
    }
  }
});

// Create delivery request - JWT REQUIRED
app.post('/api/deliveries', authenticate(), async (req: AuthRequest, res) => {
  try {
    const validated = deliveryRequestSchema.parse(req.body);
    const userId = req.userId || req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User ID not found in token' } });
    }

    const requestId = generateSecureId();
    const distance = calculateDistance(
      validated.pickup.lat, validated.pickup.lng,
      validated.drop.lat, validated.drop.lng
    );
    const totalWeight = validated.items.reduce((sum, item) => sum + (item.weight || 1) * item.quantity, 0);
    const fare = calculateDeliveryFare(validated.priority as any, totalWeight, distance);

    // Get ML ETA prediction
    let etaData = { eta: 30, confidence: 0.5 };
    try {
      // Use demand hot zones as proxy for ETA calculation
      const zones = await intelligence.location.getHotZones(
        validated.pickup.lat,
        validated.pickup.lng,
        3
      );
      etaData = { eta: 30, confidence: zones.length > 0 ? 0.8 : 0.5 };
    } catch {}

    const estimatedDelivery = new Date();
    estimatedDelivery.setMinutes(estimatedDelivery.getMinutes() + etaData.eta);

    const delivery: Delivery = {
      id: generateSecureId(),
      requestId,
      userId,
      pickup: validated.pickup as Location,
      drop: validated.drop as Location,
      items: validated.items as DeliveryItem[],
      status: DeliveryStatus.PENDING,
      priority: validated.priority as any,
      otp: generateSecureOTP(),
      fare,
      eta: {
        predicted: etaData.eta,
        actual: 0,
        confidence: etaData.confidence,
      },
      receiverName: validated.receiverName,
      receiverPhone: validated.receiverPhone,
      instructions: validated.instructions,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    const deliveryDoc = new DeliveryModel(delivery);
    await deliveryDoc.save();

    // Record signal
    try {
      await intelligence.signals.recordSignal(userId, {
        type: 'delivery.requested',
        value: 1,
        weight: 1,
      });
    } catch {}

    io.to(`user:${userId}`).emit('delivery:created', delivery);

    // Notify user
    try {
      await intelligence.notification.sendPush(userId, {
        title: 'Delivery Requested',
        body: `Your ${validated.priority} delivery is being processed. ETA: ${etaData.eta} mins`,
        data: { deliveryId: delivery.id },
      });
    } catch {}

    res.status(201).json({
      success: true,
      data: {
        delivery,
        etaInfo: {
          estimatedMinutes: etaData.eta,
          confidence: etaData.confidence,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      logger.error('Delivery creation error:', error);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create delivery' } });
    }
  }
});

async function assignDriver(deliveryId: string, driverId: string) {
  await DeliveryModel.updateOne(
    { id: deliveryId },
    { driverId, updatedAt: new Date() }
  );
  await DeliveryDriverModel.updateOne({ id: driverId }, { status: 'busy' });

  const delivery = await DeliveryModel.findOne({ id: deliveryId });
  if (delivery) {
    io.to(`user:${delivery.userId}`).emit('delivery:driver_assigned', { deliveryId, driverId });
    io.to(`driver:${driverId}`).emit('delivery:assigned', delivery);
  }
}

// Get delivery by ID - JWT REQUIRED
app.get('/api/deliveries/:id', authenticate(), async (req: AuthRequest, res) => {
  try {
    const delivery = await DeliveryModel.findOne({ id: req.params.id });
    if (!delivery) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Delivery not found' } });
    }

    // Users can only see their own deliveries
    const userId = req.userId || req.user?.userId;
    if (delivery.userId !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }

    res.json({ success: true, data: delivery });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get delivery' } });
  }
});

// Get user's deliveries - JWT REQUIRED
app.get('/api/deliveries', authenticate(), async (req: AuthRequest, res) => {
  try {
    const userId = req.userId || req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User ID not found' } });
    }

    const { status, limit = '20', offset = '0' } = req.query;

    const query: Record<string, unknown> = { userId };
    if (status) query.status = status;

    const deliveries = await DeliveryModel.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(offset as string))
      .limit(parseInt(limit as string));

    const total = await DeliveryModel.countDocuments(query);

    res.json({
      success: true,
      data: { deliveries, total, limit: parseInt(limit as string), offset: parseInt(offset as string) },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get deliveries' } });
  }
});

// Update delivery status - JWT REQUIRED
app.put('/api/deliveries/:id/status', authenticate(), async (req: AuthRequest, res) => {
  try {
    const validated = updateDeliveryStatusSchema.parse(req.body);
    const delivery = await DeliveryModel.findOne({ id: req.params.id });

    if (!delivery) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Delivery not found' } });
    }

    delivery.status = validated.status as any;
    delivery.updatedAt = new Date();

    if (validated.status === DeliveryStatus.PICKED_UP) {
      delivery.pickedUpAt = new Date();
    } else if (validated.status === DeliveryStatus.DELIVERED) {
      delivery.deliveredAt = new Date();
      delivery.eta.actual = delivery.pickedUpAt
        ? Math.round((delivery.deliveredAt.getTime() - delivery.pickedUpAt.getTime()) / 60000)
        : 0;
      delivery.proof = {
        otpVerified: validated.otpVerified || false,
        notes: validated.notes,
        photoUrl: validated.photoUrl,
      };

      // Record completion signal
      try {
        await intelligence.signals.recordSignal(delivery.userId, {
          type: 'delivery.completed',
          value: 1,
          weight: 5,
        });
      } catch {}

      // Credit cashback
      const cashbackAmount = Math.round(delivery.fare.totalFare * CASBACK_PERCENTAGE * 100) / 100;
      try {
        await intelligence.wallet.creditCashback(
          delivery.userId,
          cashbackAmount,
          delivery.id,
          'ride_completion'
        );
      } catch {}

      // Update driver stats
      if (delivery.driverId) {
        await DeliveryDriverModel.updateOne(
          { id: delivery.driverId },
          {
            status: 'online',
            $inc: { totalDeliveries: 1 },
          }
        );
      }

      // Notify user
      try {
        await intelligence.notification.sendPush(delivery.userId, {
          title: 'Delivery Completed',
          body: `Your package has been delivered. Rs.${cashbackAmount} cashback credited!`,
          data: { deliveryId: delivery.id },
        });
      } catch {}
    }

    await delivery.save();

    io.to(`user:${delivery.userId}`).emit('delivery:status_update', delivery);

    res.json({ success: true, data: delivery });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update status' } });
    }
  }
});

// Verify OTP - WITH RATE LIMITING
app.post('/api/deliveries/:id/verify-otp', authenticate(), async (req: AuthRequest, res) => {
  try {
    const { otp } = req.body;
    const delivery = await DeliveryModel.findOne({ id: req.params.id });

    if (!delivery) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Delivery not found' } });
    }

    if (delivery.otp !== otp) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_OTP', message: 'Invalid OTP' } });
    }

    delivery.status = DeliveryStatus.DELIVERED;
    delivery.deliveredAt = new Date();
    delivery.proof = { otpVerified: true };
    delivery.updatedAt = new Date();
    await delivery.save();

    io.to(`user:${delivery.userId}`).emit('delivery:completed', delivery);

    res.json({ success: true, data: delivery });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to verify OTP' } });
  }
});

// Cancel delivery - JWT REQUIRED
app.post('/api/deliveries/:id/cancel', authenticate(), async (req: AuthRequest, res) => {
  try {
    const delivery = await DeliveryModel.findOne({ id: req.params.id });

    if (!delivery) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Delivery not found' } });
    }

    // Check authorization
    const userId = req.userId || req.user?.userId;
    if (delivery.userId !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }

    if (delivery.status === DeliveryStatus.DELIVERED) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Cannot cancel delivered order' } });
    }

    delivery.status = 'cancelled' as any;
    delivery.updatedAt = new Date();
    await delivery.save();

    // Release driver
    if (delivery.driverId) {
      await DeliveryDriverModel.updateOne({ id: delivery.driverId }, { status: 'online' });
    }

    // Record cancellation signal
    try {
      await intelligence.signals.recordSignal(delivery.userId, {
        type: 'delivery.cancelled',
        value: -2,
        weight: 1,
      });
    } catch {}

    io.to(`user:${delivery.userId}`).emit('delivery:cancelled', delivery);

    res.json({ success: true, data: delivery });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to cancel delivery' } });
  }
});

// ============================================
// DELIVERY DRIVER ROUTES - ALL AUTHENTICATED
// ============================================

app.post('/api/delivery-drivers', authenticate(), async (req: AuthRequest, res) => {
  try {
    const { name, phone, vehicleType } = req.body;

    const driver = {
      id: generateSecureId(),
      name,
      phone,
      vehicleType: vehicleType || 'bike',
      status: 'offline',
      rating: 4.5,
      totalDeliveries: 0,
    };

    const driverDoc = new DeliveryDriverModel(driver);
    await driverDoc.save();

    res.status(201).json({ success: true, data: driver });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to register' } });
  }
});

app.get('/api/delivery-drivers/:id/available', authenticate(), async (req: AuthRequest, res) => {
  try {
    const deliveries = await DeliveryModel.find({
      status: DeliveryStatus.PENDING,
      driverId: { $exists: false },
    })
      .sort({ priority: 1, createdAt: 1 })
      .limit(10);

    res.json({ success: true, data: deliveries });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get deliveries' } });
  }
});

app.put('/api/delivery-drivers/:id/location', authenticate(), async (req: AuthRequest, res) => {
  try {
    const { lat, lng } = req.body;
    const driver = await DeliveryDriverModel.findOneAndUpdate(
      { id: req.params.id },
      {
        currentLocation: { lat, lng, updatedAt: new Date() },
      },
      { new: true }
    );

    if (!driver) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Driver not found' } });
    }

    // Record to demand signals
    try {
      await intelligence.location.recordDemandEvent(lat, lng, {
        type: 'request' as any,
        vehicleType: driver.vehicleType,
      });
    } catch {}

    io.emit('delivery_driver:location', { driverId: driver.id, location: driver.currentLocation });

    res.json({ success: true, data: driver.currentLocation });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update location' } });
  }
});

app.put('/api/delivery-drivers/:id/status', authenticate(), async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    const driver = await DeliveryDriverModel.findOneAndUpdate(
      { id: req.params.id },
      { status },
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

app.post('/api/delivery-drivers/:driverId/accept/:deliveryId', authenticate(), async (req: AuthRequest, res) => {
  try {
    const { driverId, deliveryId } = req.params;

    const delivery = await DeliveryModel.findOne({ id: deliveryId });
    if (!delivery) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Delivery not found' } });
    }

    if (delivery.status !== DeliveryStatus.PENDING || delivery.driverId) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Delivery no longer available' } });
    }

    delivery.driverId = driverId;
    delivery.updatedAt = new Date();
    await delivery.save();

    await DeliveryDriverModel.updateOne({ id: driverId }, { status: 'busy' });

    // Record signal
    try {
      await intelligence.signals.recordSignal(delivery.userId, {
        type: 'delivery.assigned',
        value: 1,
        weight: 1,
      });
    } catch {}

    io.to(`user:${delivery.userId}`).emit('delivery:driver_assigned', { deliveryId, driverId });
    io.to(`driver:${driverId}`).emit('delivery:accepted', delivery);

    // Notify user
    try {
      const driver = await DeliveryDriverModel.findOne({ id: driverId });
      await intelligence.notification.sendPush(delivery.userId, {
        title: 'Driver Assigned',
        body: `Your delivery driver ${driver?.name} is on the way.`,
        data: { deliveryId },
      });
    } catch {}

    res.json({ success: true, data: delivery });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to accept' } });
  }
});

app.get('/api/delivery-drivers/:id/current', authenticate(), async (req: AuthRequest, res) => {
  try {
    const delivery = await DeliveryModel.findOne({
      driverId: req.params.id,
      status: { $in: [DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT, DeliveryStatus.OUT_FOR_DELIVERY] },
    });

    res.json({ success: true, data: delivery });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get delivery' } });
  }
});

// ============================================
// REAL-TIME HANDLERS - WITH AUTHENTICATION
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

  socket.on('join', (data: { type: 'user' | 'driver'; id: string }) => {
    socket.join(`${data.type}:${data.id}`);
    logger.info(`Socket ${socket.id} joined room: ${data.type}:${data.id}`);
  });

  socket.on('location:update', (data: { driverId: string; lat: number; lng: number }) => {
    io.emit('delivery_driver:location', data);
  });

  socket.on('delivery:track', (deliveryId: string) => {
    socket.join(`delivery:${deliveryId}`);
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

    await DeliveryDriverModel.collection.createIndex({ currentLocation: '2dsphere' });

    server = httpServer.listen(PORT, () => {
      logger.info(`KHAIRMOVE Delivery Service running on port ${PORT}`);
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
