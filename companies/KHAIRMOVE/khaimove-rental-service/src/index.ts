import { logger } from '../../shared/logger';
// KHAIRMOVE Rental Service - Hourly vehicle rentals
// Port: 4604

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import {
  VehicleType,
  RentalStatus,
  RentalPackage,
  RentalBooking,
  RentalFare,
  Location,
} from '../../shared/types';
import {
  rentalBookingSchema,
  rentalOtpVerifySchema,
  completeRentalSchema,
  locationSchema,
} from '../../shared/schemas';
import {
  authenticate,
  corsMiddleware,
  createGlobalLimiter,
  requestIdMiddleware,
  requestLoggingMiddleware,
  validateRequiredEnvVars,
} from '../../shared';

const PORT = process.env.PORT || 4605;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/khaimove_rental';

const app = express();

// Apply middleware
app.use(helmet());
app.use(corsMiddleware);
app.use(requestIdMiddleware);
app.use(requestLoggingMiddleware);
app.use('/api/', createGlobalLimiter());
app.use(express.json({ limit: '1mb' })); // Prevent large payload DoS

// ============================================
// RENTAL PACKAGES CONFIG
// ============================================

const RENTAL_PACKAGES: RentalPackage[] = [
  // Auto
  { id: 'auto-2h', vehicleType: VehicleType.AUTO, duration: 2, name: 'Auto 2 Hour', description: '2 hour auto rental', price: 150, includesKms: 10, extraKmRate: 8, extraHrRate: 75, available: true },
  { id: 'auto-4h', vehicleType: VehicleType.AUTO, duration: 4, name: 'Auto 4 Hour', description: '4 hour auto rental', price: 280, includesKms: 20, extraKmRate: 7, extraHrRate: 70, available: true },
  { id: 'auto-8h', vehicleType: VehicleType.AUTO, duration: 8, name: 'Auto Full Day', description: '8 hour auto rental', price: 500, includesKms: 50, extraKmRate: 6, extraHrRate: 60, available: true },

  // Sedan
  { id: 'sedan-2h', vehicleType: VehicleType.CAB, duration: 2, name: 'Sedan 2 Hour', description: '2 hour sedan rental', price: 250, includesKms: 10, extraKmRate: 10, extraHrRate: 100, available: true },
  { id: 'sedan-4h', vehicleType: VehicleType.CAB, duration: 4, name: 'Sedan 4 Hour', description: '4 hour sedan rental', price: 450, includesKms: 25, extraKmRate: 9, extraHrRate: 90, available: true },
  { id: 'sedan-8h', vehicleType: VehicleType.CAB, duration: 8, name: 'Sedan Full Day', description: '8 hour sedan rental', price: 800, includesKms: 60, extraKmRate: 8, extraHrRate: 80, available: true },
  { id: 'sedan-12h', vehicleType: VehicleType.CAB, duration: 12, name: 'Sedan Extended', description: '12 hour sedan rental', price: 1100, includesKms: 80, extraKmRate: 7, extraHrRate: 70, available: true },

  // SUV
  { id: 'suv-2h', vehicleType: VehicleType.SUV, duration: 2, name: 'SUV 2 Hour', description: '2 hour SUV rental', price: 400, includesKms: 10, extraKmRate: 15, extraHrRate: 150, available: true },
  { id: 'suv-4h', vehicleType: VehicleType.SUV, duration: 4, name: 'SUV 4 Hour', description: '4 hour SUV rental', price: 700, includesKms: 25, extraKmRate: 12, extraHrRate: 120, available: true },
  { id: 'suv-8h', vehicleType: VehicleType.SUV, duration: 8, name: 'SUV Full Day', description: '8 hour SUV rental', price: 1200, includesKms: 60, extraKmRate: 10, extraHrRate: 100, available: true },
  { id: 'suv-12h', vehicleType: VehicleType.SUV, duration: 12, name: 'SUV Extended', description: '12 hour SUV rental', price: 1600, includesKms: 80, extraKmRate: 8, extraHrRate: 80, available: true },
];

// ============================================
// DATABASE MODELS
// ============================================

const bookingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  driverId: String,
  packageId: { type: String, required: true, index: true },
  vehicleType: { type: String, enum: Object.values(VehicleType) },
  pickup: {
    lat: Number,
    lng: Number,
    address: String,
    city: String,
  },
  scheduledStart: Date,
  scheduledEnd: Date,
  actualStart: Date,
  actualEnd: Date,
  status: { type: String, enum: Object.values(RentalStatus), default: RentalStatus.AVAILABLE, index: true },
  fare: {
    packagePrice: Number,
    extraHours: Number,
    extraKms: Number,
    totalFare: Number,
    deposit: Number,
    depositStatus: { type: String, enum: ['pending', 'held', 'refunded'], default: 'pending' },
  },
  startOdometer: Number,
  endOdometer: Number,
  totalKms: Number,
  totalHours: Number,
  otp: String,
  notes: String,
  createdAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

// Compound indexes
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ status: 1, scheduledStart: 1 });

const BookingModel = mongoose.model('RentalBooking', bookingSchema);

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function calculateRentalFare(packageId: string, actualKms?: number, actualHours?: number): RentalFare {
  const pkg = RENTAL_PACKAGES.find(p => p.id === packageId);
  if (!pkg) {
    throw new Error('Package not found');
  }

  const extraKms = actualKms ? Math.max(0, actualKms - pkg.includesKms) : 0;
  const extraHoursVal = actualHours ? Math.max(0, actualHours - pkg.duration) : 0;

  const extraKmCharge = extraKms * pkg.extraKmRate;
  const extraHrCharge = extraHoursVal * pkg.extraHrRate;

  return {
    packagePrice: pkg.price,
    extraHours: extraHrCharge,
    extraKms: extraKmCharge,
    totalFare: pkg.price + extraKmCharge + extraHrCharge,
    deposit: pkg.vehicleType === VehicleType.SUV ? 5000 : 3000,
    depositStatus: 'pending',
  };
}

// ============================================
// HEALTH CHECKS (Production Ready)
// ============================================

app.get('/health/live', (req, res) => {
  res.json({ status: 'alive', service: 'khaimove-rental', timestamp: new Date() });
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
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'khaimove-rental-service',
    timestamp: new Date(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ============================================
// API ROUTES (All require authentication)
// ============================================

// Get all packages
app.get('/api/packages', authenticate(), (req, res) => {
  const { vehicleType } = req.query;

  let packages = RENTAL_PACKAGES.filter(p => p.available);
  if (vehicleType) {
    packages = packages.filter(p => p.vehicleType === vehicleType);
  }

  res.json({ success: true, data: packages });
});

// Get packages by vehicle type
app.get('/api/packages/:vehicleType', authenticate(), (req, res) => {
  const { vehicleType } = req.params;
  const packages = RENTAL_PACKAGES.filter(p => p.vehicleType === vehicleType && p.available);

  if (packages.length === 0) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No packages available for this vehicle type' } });
  }

  res.json({ success: true, data: packages });
});

// Get package by ID
app.get('/api/packages/detail/:id', authenticate(), (req, res) => {
  const pkg = RENTAL_PACKAGES.find(p => p.id === req.params.id);

  if (!pkg) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Package not found' } });
  }

  res.json({ success: true, data: pkg });
});

// Estimate rental fare
app.post('/api/rentals/estimate', authenticate(), async (req, res) => {
  try {
    const schema = z.object({
      packageId: z.string(),
      pickup: locationSchema,
    });

    const validated = schema.parse(req.body);
    const pkg = RENTAL_PACKAGES.find(p => p.id === validated.packageId);

    if (!pkg) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Package not found' } });
    }

    const fare = calculateRentalFare(validated.packageId);

    res.json({
      success: true,
      data: {
        package: pkg,
        fare,
        includesHours: pkg.duration,
        includesKms: pkg.includesKms,
        extraKmRate: pkg.extraKmRate,
        extraHrRate: pkg.extraHrRate,
        deposit: fare.deposit,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to estimate' } });
    }
  }
});

// Create rental booking
app.post('/api/rentals', authenticate(), async (req, res) => {
  try {
    const validated = rentalBookingSchema.parse(req.body);
    const userId = (req as any).user?.userId || req.headers['x-user-id'] as string || 'demo-user';

    const pkg = RENTAL_PACKAGES.find(p => p.id === validated.packageId);
    if (!pkg) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Package not found' } });
    }

    const fare = calculateRentalFare(validated.packageId);

    const booking: RentalBooking = {
      id: uuidv4(),
      userId,
      packageId: validated.packageId,
      vehicleType: validated.vehicleType,
      pickup: validated.pickup as Location,
      scheduledStart: new Date(validated.scheduledStart),
      scheduledEnd: new Date(validated.scheduledEnd),
      status: RentalStatus.BOOKED,
      fare,
      createdAt: new Date(),
    } as RentalBooking;

    const bookingDoc = new BookingModel(booking);
    await bookingDoc.save();

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      logger.error('Create booking error:', error);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create booking' } });
    }
  }
});

// Get booking by ID
app.get('/api/rentals/:id', authenticate(), async (req, res) => {
  try {
    const booking = await BookingModel.findOne({ id: req.params.id });

    if (!booking) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } });
    }

    const pkg = RENTAL_PACKAGES.find(p => p.id === booking.packageId);
    res.json({
      success: true,
      data: {
        ...booking.toObject(),
        package: pkg,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get booking' } });
  }
});

// Get user's bookings
app.get('/api/rentals', authenticate(), async (req, res) => {
  try {
    const userId = (req as any).user?.userId || req.headers['x-user-id'] as string || 'demo-user';
    const { status, limit = '20', offset = '0' } = req.query;

    const query: Record<string, unknown> = { userId };
    if (status) query.status = status;

    const bookings = await BookingModel.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(offset as string))
      .limit(Math.min(parseInt(limit as string), 100));

    const total = await BookingModel.countDocuments(query);

    const bookingsWithPackages = await Promise.all(
      bookings.map(async (booking) => {
        const pkg = RENTAL_PACKAGES.find(p => p.id === booking.packageId);
        return { ...booking.toObject(), package: pkg };
      })
    );

    res.json({
      success: true,
      data: {
        bookings: bookingsWithPackages,
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get bookings' } });
  }
});

// Start rental
app.post('/api/rentals/:id/start', authenticate(), async (req, res) => {
  try {
    const booking = await BookingModel.findOne({ id: req.params.id });

    if (!booking) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } });
    }

    if (booking.status !== RentalStatus.BOOKED) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Cannot start rental in current status' } });
    }

    const { startOdometer } = req.body;

    booking.status = RentalStatus.ON_RENTAL;
    booking.actualStart = new Date();
    booking.startOdometer = startOdometer || 0;

    await booking.save();

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to start rental' } });
  }
});

// Verify OTP and complete rental
app.post('/api/rentals/:id/complete', authenticate(), async (req, res) => {
  try {
    const validated = completeRentalSchema.parse(req.body);
    const booking = await BookingModel.findOne({ id: req.params.id });

    if (!booking) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } });
    }

    if (booking.status !== RentalStatus.ON_RENTAL) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Rental not in progress' } });
    }

    booking.status = RentalStatus.AVAILABLE;
    booking.actualEnd = new Date();
    booking.endOdometer = validated.endOdometer;

    // Calculate actual hours and kms
    const totalMs = booking.actualEnd.getTime() - booking.actualStart!.getTime();
    booking.totalHours = Math.ceil(totalMs / (1000 * 60 * 60));

    if (validated.endOdometer && booking.startOdometer) {
      booking.totalKms = validated.endOdometer - booking.startOdometer;
    }

    // Recalculate fare with actual usage
    const pkg = RENTAL_PACKAGES.find(p => p.id === booking.packageId);
    if (pkg) {
      const extraKms = booking.totalKms ? Math.max(0, booking.totalKms - pkg.includesKms) : 0;
      const extraHours = Math.max(0, booking.totalHours - pkg.duration);

      booking.fare.extraKms = extraKms * pkg.extraKmRate;
      booking.fare.extraHours = extraHours * pkg.extraHrRate;
      booking.fare.totalFare = pkg.price + booking.fare.extraKms + booking.fare.extraHours;
    }

    if (validated.notes) booking.notes = validated.notes;

    await booking.save();

    res.json({ success: true, data: booking });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to complete rental' } });
    }
  }
});

// Cancel booking
app.post('/api/rentals/:id/cancel', authenticate(), async (req, res) => {
  try {
    const booking = await BookingModel.findOne({ id: req.params.id });

    if (!booking) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } });
    }

    if (booking.status === RentalStatus.ON_RENTAL) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Cannot cancel rental in progress' } });
    }

    booking.status = RentalStatus.MAINTENANCE;
    await booking.save();

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to cancel booking' } });
  }
});

// Get available vehicles (driver availability)
app.get('/api/vehicles/available', authenticate(), async (req, res) => {
  try {
    const { vehicleType, city } = req.query;

    const vehicles = RENTAL_PACKAGES
      .filter(p => p.available && (!vehicleType || p.vehicleType === vehicleType))
      .map(pkg => ({
        packageId: pkg.id,
        vehicleType: pkg.vehicleType,
        duration: pkg.duration,
        price: pkg.price,
      }));

    res.json({ success: true, data: vehicles });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get vehicles' } });
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

    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    app.listen(PORT, () => {
      logger.info(`KHAIRMOVE Rental Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export { app };
