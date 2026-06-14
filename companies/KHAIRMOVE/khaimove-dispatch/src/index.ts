import { logger } from '../../shared/logger';
/**
 * KHAIRMOVE Smart Dispatch Service
 * AI-powered optimal driver-rider matching and routing
 */

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import {
  authenticate,
  corsMiddleware,
  createGlobalLimiter,
  requestIdMiddleware,
  requestLoggingMiddleware,
  validateRequiredEnvVars,
} from '../../shared';

const PORT = process.env.PORT || 4610;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/khaimove_dispatch';

// ============== SCHEMAS ==============

const rideRequestSchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true, index: true },
  customerId: { type: String, required: true, index: true },
  pickup: {
    lat: Number,
    lng: Number,
    address: String
  },
  dropoff: {
    lat: Number,
    lng: Number,
    address: String
  },
  vehicleType: { type: String, enum: ['auto', 'bike', 'car', 'suv'], default: 'auto' },
  priority: { type: String, enum: ['normal', 'high', 'urgent'], default: 'normal' },
  estimatedFare: Number,
  status: { type: String, enum: ['pending', 'matching', 'assigned', 'in_progress', 'completed', 'cancelled'], default: 'pending', index: true },
  assignedDriver: String,
  matchedAt: Date,
  pickupTime: Date,
  dropoffTime: Date,
  createdAt: { type: Date, default: Date.now, index: true }
});

// Compound indexes
rideRequestSchema.index({ customerId: 1, createdAt: -1 });
rideRequestSchema.index({ status: 1, priority: -1, createdAt: 1 });

const driverSchema = new mongoose.Schema({
  driverId: { type: String, required: true, unique: true, index: true },
  name: String,
  phone: String,
  vehicle: {
    type: { type: String, enum: ['auto', 'bike', 'car', 'suv'] },
    plate: String,
    model: String
  },
  location: {
    lat: Number,
    lng: Number,
    heading: Number
  },
  status: { type: String, enum: ['available', 'busy', 'offline', 'blocked'], default: 'available', index: true },
  rating: Number,
  totalRides: { type: Number, default: 0 },
  acceptanceRate: Number,
  earnings: {
    today: { type: Number, default: 0 },
    week: { type: Number, default: 0 },
    month: { type: Number, default: 0 }
  },
  activeSince: Date
});

// Geospatial index for location-based queries
driverSchema.index({ 'location.lat': 1, 'location.lng': 1 });
driverSchema.index({ status: 1, 'vehicle.type': 1, 'location.lat': 1, 'location.lng': 1 });

const matchSchema = new mongoose.Schema({
  matchId: { type: String, required: true, unique: true, index: true },
  requestId: { type: String, required: true, index: true },
  driverId: { type: String, required: true, index: true },
  score: Number,
  factors: {
    distance: Number,
    rating: Number,
    acceptanceRate: Number,
    eta: Number,
    surge: Number
  },
  status: { type: String, enum: ['proposed', 'accepted', 'rejected', 'expired'], default: 'proposed', index: true },
  createdAt: { type: Date, default: Date.now }
});

const surgeZoneSchema = new mongoose.Schema({
  zoneId: { type: String, required: true, unique: true },
  name: String,
  boundaries: {
    type: { type: String, enum: ['Polygon'], default: 'Polygon' },
    coordinates: [[[Number]]]
  },
  surgeMultiplier: { type: Number, default: 1.0 },
  activeDemand: Number,
  availableDrivers: Number,
  updatedAt: { type: Date, default: Date.now }
});

// Models
const RideRequest = mongoose.model('RideRequest', rideRequestSchema);
const Driver = mongoose.model('Driver', driverSchema);
const Match = mongoose.model('Match', matchSchema);
const SurgeZone = mongoose.model('SurgeZone', surgeZoneSchema);

// ============== SERVICE ==============

class DispatchService {
  private app: express.Application;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(express.json({ limit: '1mb' }));
    this.app.use(requestIdMiddleware);
    this.app.use(requestLoggingMiddleware);
  }

  // Calculate distance between two points (Haversine)
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Calculate ETA based on distance
  private calculateETA(distance: number): number {
    const avgSpeed = 25; // km/h in city
    return Math.round((distance / avgSpeed) * 60); // minutes
  }

  // Calculate match score
  private calculateMatchScore(driver: any, request: any, distance: number, eta: number): number {
    const factors = {
      distance: Math.max(0, 100 - distance * 10), // closer = better
      rating: driver.rating * 20, // rating out of 100
      acceptanceRate: driver.acceptanceRate, // percentage
      eta: Math.max(0, 100 - eta * 2) // faster = better
    };

    // Weighted score
    return Math.round(
      factors.distance * 0.4 +
      factors.rating * 0.25 +
      factors.acceptanceRate * 0.2 +
      factors.eta * 0.15
    );
  }

  private setupRoutes() {
    // ========== HEALTH CHECKS ==========
    this.app.get('/health/live', (_req, res) => {
      res.json({ status: 'alive', service: 'dispatch', timestamp: new Date() });
    });

    this.app.get('/health/ready', async (_req, res) => {
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

    // Legacy health
    this.app.get('/health', (_req, res) => {
      res.json({
        status: 'healthy',
        service: 'dispatch',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date()
      });
    });

    // ========== RIDES ==========

    // Create ride request
    this.app.post('/api/rides', authenticate(), async (req: Request, res: Response) => {
      try {
        const schema = z.object({
          customerId: z.string(),
          pickup: z.object({ lat: z.number(), lng: z.number(), address: z.string().optional() }),
          dropoff: z.object({ lat: z.number(), lng: z.number(), address: z.string().optional() }),
          vehicleType: z.enum(['auto', 'bike', 'car', 'suv']).default('auto'),
          priority: z.enum(['normal', 'high', 'urgent']).default('normal'),
        });

        const validated = schema.parse(req.body);

        const requestId = `ride_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Calculate estimated fare (simplified)
        const distance = this.calculateDistance(
          validated.pickup.lat, validated.pickup.lng,
          validated.dropoff.lat, validated.dropoff.lng
        );
        const baseFare = { auto: 20, bike: 10, car: 40, suv: 60 };
        const perKm = { auto: 8, bike: 5, car: 12, suv: 16 };
        const estimatedFare = baseFare[validated.vehicleType as keyof typeof baseFare] + distance * perKm[validated.vehicleType as keyof typeof perKm];

        const ride = new RideRequest({
          requestId,
          customerId: validated.customerId,
          pickup: validated.pickup,
          dropoff: validated.dropoff,
          vehicleType: validated.vehicleType,
          priority: validated.priority,
          estimatedFare: Math.round(estimatedFare),
          status: 'pending'
        });
        await ride.save();

        // Trigger matching asynchronously
        this.matchRide(requestId).catch(err => logger.error('Match error:', err));

        res.status(201).json({ success: true, data: ride });
      } catch (error) {
        if (error instanceof z.ZodError) {
          res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
        } else {
          logger.error('Error creating ride:', error);
          res.status(500).json({ error: 'Failed to create ride request' });
        }
      }
    });

    // Get ride status
    this.app.get('/api/rides/:requestId', authenticate(), async (req: Request, res: Response) => {
      try {
        const ride = await RideRequest.findOne({ requestId: req.params.requestId });
        if (!ride) {
          return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ride not found' } });
        }
        res.json({ success: true, data: ride });
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch ride' });
      }
    });

    // Update ride status
    this.app.patch('/api/rides/:requestId/status', authenticate(), async (req: Request, res: Response) => {
      try {
        const schema = z.object({
          status: z.enum(['pending', 'matching', 'assigned', 'in_progress', 'completed', 'cancelled']),
          driverId: z.string().optional(),
        });

        const validated = schema.parse(req.body);
        const update: any = { status: validated.status };

        if (validated.status === 'assigned' && validated.driverId) {
          update.assignedDriver = validated.driverId;
          update.matchedAt = new Date();
        }
        if (validated.status === 'in_progress') {
          update.pickupTime = new Date();
        }
        if (validated.status === 'completed') {
          update.dropoffTime = new Date();
        }

        const ride = await RideRequest.findOneAndUpdate(
          { requestId: req.params.requestId },
          update,
          { new: true }
        );

        if (!ride) {
          return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ride not found' } });
        }

        res.json({ success: true, data: ride });
      } catch (error) {
        if (error instanceof z.ZodError) {
          res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
        } else {
          res.status(500).json({ error: 'Failed to update ride' });
        }
      }
    });

    // ========== DRIVERS ==========

    // Register driver
    this.app.post('/api/drivers', authenticate(), async (req: Request, res: Response) => {
      try {
        const schema = z.object({
          name: z.string(),
          phone: z.string(),
          vehicle: z.object({
            type: z.enum(['auto', 'bike', 'car', 'suv']),
            plate: z.string(),
            model: z.string(),
          }),
          location: z.object({
            lat: z.number(),
            lng: z.number(),
            heading: z.number().optional(),
          }).optional(),
        });

        const validated = schema.parse(req.body);

        const driver = new Driver({
          ...validated,
          driverId: `driver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status: 'available',
          rating: 5.0,
          acceptanceRate: 0.8,
          activeSince: new Date()
        });
        await driver.save();
        res.status(201).json({ success: true, data: driver });
      } catch (error) {
        if (error instanceof z.ZodError) {
          res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
        } else {
          res.status(500).json({ error: 'Failed to register driver' });
        }
      }
    });

    // Update driver location
    this.app.patch('/api/drivers/:driverId/location', authenticate(), async (req: Request, res: Response) => {
      try {
        const schema = z.object({
          lat: z.number(),
          lng: z.number(),
          heading: z.number().optional(),
        });

        const validated = schema.parse(req.body);

        const driver = await Driver.findOneAndUpdate(
          { driverId: req.params.driverId },
          { location: validated },
          { new: true }
        );

        if (!driver) {
          return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Driver not found' } });
        }

        res.json({ success: true, data: driver });
      } catch (error) {
        if (error instanceof z.ZodError) {
          res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
        } else {
          res.status(500).json({ error: 'Failed to update location' });
        }
      }
    });

    // Update driver status
    this.app.patch('/api/drivers/:driverId/status', authenticate(), async (req: Request, res: Response) => {
      try {
        const schema = z.object({
          status: z.enum(['available', 'busy', 'offline', 'blocked']),
        });

        const validated = schema.parse(req.body);

        const driver = await Driver.findOneAndUpdate(
          { driverId: req.params.driverId },
          { status: validated.status },
          { new: true }
        );

        if (!driver) {
          return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Driver not found' } });
        }

        res.json({ success: true, data: driver });
      } catch (error) {
        if (error instanceof z.ZodError) {
          res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
        } else {
          res.status(500).json({ error: 'Failed to update status' });
        }
      }
    });

    // Get available drivers
    this.app.get('/api/drivers/nearby', authenticate(), async (req: Request, res: Response) => {
      try {
        const schema = z.object({
          lat: z.coerce.number(),
          lng: z.coerce.number(),
          radius: z.coerce.number().default(5),
          vehicleType: z.enum(['auto', 'bike', 'car', 'suv']).optional(),
        });

        const validated = schema.parse(req.query);

        // Get available drivers
        const query: any = {
          status: 'available',
        };
        if (validated.vehicleType) {
          query['vehicle.type'] = validated.vehicleType;
        }

        const drivers = await Driver.find(query).lean();

        // Filter by distance
        const nearby = drivers.filter(d => {
          if (!d.location) return false;
          const distance = this.calculateDistance(
            validated.lat, validated.lng,
            d.location.lat, d.location.lng
          );
          return distance <= validated.radius;
        });

        // Sort by distance
        nearby.sort((a, b) => {
          const distA = this.calculateDistance(validated.lat, validated.lng, a.location.lat, a.location.lng);
          const distB = this.calculateDistance(validated.lat, validated.lng, b.location.lat, b.location.lng);
          return distA - distB;
        });

        res.json({ success: true, data: nearby });
      } catch (error) {
        if (error instanceof z.ZodError) {
          res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
        } else {
          res.status(500).json({ error: 'Failed to get nearby drivers' });
        }
      }
    });

    // ========== MATCHING ==========

    // Match ride to drivers
    this.app.post('/api/rides/:requestId/match', authenticate(), async (req: Request, res: Response) => {
      try {
        const matches = await this.matchRide(req.params.requestId);
        res.json({ success: true, data: matches });
      } catch (error) {
        logger.error('Match error:', error);
        res.status(500).json({ error: 'Failed to match ride' });
      }
    });

    // Accept match
    this.app.post('/api/matches/:matchId/accept', authenticate(), async (req: Request, res: Response) => {
      try {
        const match = await Match.findOneAndUpdate(
          { matchId: req.params.matchId, status: 'proposed' },
          { status: 'accepted' },
          { new: true }
        );

        if (!match) {
          return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Match not found or expired' } });
        }

        // Update ride
        await RideRequest.findOneAndUpdate(
          { requestId: match.requestId },
          {
            status: 'assigned',
            assignedDriver: match.driverId,
            matchedAt: new Date()
          }
        );

        // Update other matches as expired
        await Match.updateMany(
          { requestId: match.requestId, matchId: { $ne: match.matchId } },
          { status: 'expired' }
        );

        // Update driver status
        await Driver.findOneAndUpdate(
          { driverId: match.driverId },
          { status: 'busy' }
        );

        res.json({ success: true, data: match });
      } catch (error) {
        res.status(500).json({ error: 'Failed to accept match' });
      }
    });

    // Get match proposals for driver
    this.app.get('/api/drivers/:driverId/matches', authenticate(), async (req: Request, res: Response) => {
      try {
        const matches = await Match.find({
          driverId: req.params.driverId,
          status: 'proposed'
        }).sort({ createdAt: -1 }).lean();
        res.json({ success: true, data: matches });
      } catch (error) {
        res.status(500).json({ error: 'Failed to get matches' });
      }
    });

    // ========== SURGE PRICING ==========

    // Update surge zone
    this.app.post('/api/surge/zones', authenticate(), async (req: Request, res: Response) => {
      try {
        const schema = z.object({
          name: z.string(),
          boundaries: z.object({
            type: z.enum(['Polygon']).default('Polygon'),
            coordinates: z.array(z.array(z.array(z.number()))),
          }),
          surgeMultiplier: z.number().min(1).max(5).default(1),
        });

        const validated = schema.parse(req.body);

        const zone = new SurgeZone({
          ...validated,
          zoneId: `zone_${Date.now()}`
        });
        await zone.save();
        res.status(201).json({ success: true, data: zone });
      } catch (error) {
        if (error instanceof z.ZodError) {
          res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
        } else {
          res.status(500).json({ error: 'Failed to create surge zone' });
        }
      }
    });

    // Get surge multiplier
    this.app.get('/api/surge/:lat/:lng', authenticate(), async (req: Request, res: Response) => {
      try {
        const lat = parseFloat(req.params.lat);
        const lng = parseFloat(req.params.lng);

        // Simplified - in production would check polygon
        const zones = await SurgeZone.find().lean();

        for (const zone of zones) {
          if (zone.boundaries?.coordinates?.[0]) {
            res.json({ success: true, data: { surgeMultiplier: zone.surgeMultiplier } });
            return;
          }
        }

        // Check demand-based surge
        const availableDrivers = await Driver.countDocuments({ status: 'available' });
        const pendingRides = await RideRequest.countDocuments({ status: 'pending' });

        let surge = 1.0;
        if (pendingRides > availableDrivers * 2) surge = 1.5;
        if (pendingRides > availableDrivers * 3) surge = 2.0;

        res.json({ success: true, data: { surgeMultiplier: surge } });
      } catch (error) {
        res.status(500).json({ error: 'Failed to get surge' });
      }
    });

    // ========== ANALYTICS ==========

    // Get dispatch stats
    this.app.get('/api/stats', authenticate(), async (req: Request, res: Response) => {
      try {
        const stats = {
          activeDrivers: await Driver.countDocuments({ status: 'available' }),
          busyDrivers: await Driver.countDocuments({ status: 'busy' }),
          pendingRides: await RideRequest.countDocuments({ status: 'pending' }),
          matchingRides: await RideRequest.countDocuments({ status: 'matching' }),
          avgMatchTime: await this.getAverageMatchTime(),
          avgPickupTime: await this.getAveragePickupTime()
        };
        res.json({ success: true, data: stats });
      } catch (error) {
        res.status(500).json({ error: 'Failed to get stats' });
      }
    });
  }

  private async matchRide(requestId: string): Promise<any[]> {
    const request = await RideRequest.findOne({ requestId });
    if (!request) return [];

    // Update status
    request.status = 'matching';
    await request.save();

    // Find nearby drivers
    const drivers = await Driver.find({
      status: 'available',
      'vehicle.type': request.vehicleType
    }).lean();

    // Calculate scores
    const matches = [];
    for (const driver of drivers) {
      if (!driver.location) continue;

      const distance = this.calculateDistance(
        request.pickup.lat, request.pickup.lng,
        driver.location.lat, driver.location.lng
      );
      const eta = this.calculateETA(distance);
      const score = this.calculateMatchScore(driver, request, distance, eta);

      matches.push({
        matchId: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        requestId,
        driverId: driver.driverId,
        score,
        factors: { distance, rating: driver.rating, acceptanceRate: driver.acceptanceRate, eta },
        status: 'proposed'
      });
    }

    // Sort by score and save top matches
    matches.sort((a, b) => b.score - a.score);
    const topMatches = matches.slice(0, 5);

    for (const match of topMatches) {
      await new Match(match).save();
    }

    return topMatches;
  }

  private async getAverageMatchTime(): Promise<number> {
    const result = await Match.aggregate([
      { $match: { status: 'accepted' } },
      {
        $group: {
          _id: null,
          avgTime: { $avg: { $subtract: ['$createdAt', '$$NOW'] } }
        }
      }
    ]);
    return result.length > 0 ? Math.round(result[0].avgTime / 1000) : 45;
  }

  private async getAveragePickupTime(): Promise<number> {
    // Simplified - would calculate from completed rides
    return 8;
  }

  async start(port: number = 4610): Promise<void> {
    try {
      // Validate environment in production
      if (process.env.NODE_ENV === 'production') {
        const result = validateRequiredEnvVars(['PORT', 'MONGODB_URI', 'INTERNAL_SERVICE_TOKEN']);
        if (!result.valid) {
          throw new Error(`Environment validation failed: ${result.errors.join(', ')}`);
        }
      }

      await mongoose.connect(MONGODB_URI);
      logger.info('[Dispatch] Connected to MongoDB');

      this.app.listen(port, () => {
        logger.info(`[Dispatch] Service running on port ${port}`);
      });
    } catch (error) {
      logger.error('[Dispatch] Failed to start:', error);
      throw error;
    }
  }
}

const service = new DispatchService();

// Graceful shutdown
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

service.start(4610);

export default service;
