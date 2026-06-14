import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { RentalService } from '../services/rental.service';
import { RentalBookingModel } from '../models/rental.model';
import rateLimit from 'express-rate-limit';

// Rate limiter for booking endpoints
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many booking requests' },
});

// Initialize service with MongoDB model
const bookingModel = mongoose.model<RentalBookingModel>('RentalBooking');
const rentalService = new RentalService(bookingModel as any);

const router = Router();

// ===========================================
// MIDDLEWARE
// ===========================================

// Auth middleware (simplified - use proper JWT validation in production)
const authMiddleware = (req: Request, res: Response, next: Function) => {
  const token = req.headers['x-auth-token'];
  if (!token && !req.body.userId) {
    // Allow public access to packages, require auth for bookings
    if (!req.path.includes('/booking') && !req.path.includes('/stats')) {
      return next();
    }
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

router.use(authMiddleware);

// ===========================================
// PACKAGES
// ===========================================

/**
 * @route GET /api/rental/packages
 * @desc Get rental packages
 */
router.get('/packages', async (req: Request, res: Response) => {
  try {
    const { vehicleType } = req.query;
    const packages = await rentalService.getPackages(vehicleType as 'auto' | 'sedan' | 'suv' | undefined);
    res.json({ success: true, packages });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * @route GET /api/rental/packages/:packageId
 * @desc Get package by ID
 */
router.get('/packages/:packageId', async (req: Request, res: Response) => {
  try {
    const pkg = await rentalService.getPackage(req.params.packageId);
    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }
    res.json({ success: true, package: pkg });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// ===========================================
// BOOKING
// ===========================================

/**
 * @route POST /api/rental/booking
 * @desc Create rental booking
 */
router.post('/booking', bookingLimiter, async (req: Request, res: Response) => {
  try {
    const { userId, packageId, pickup } = req.body;

    if (!userId || !packageId || !pickup) {
      return res.status(400).json({ error: 'Missing required fields: userId, packageId, pickup' });
    }

    // Validate pickup object
    if (!pickup.lat || !pickup.lng || !pickup.address || !pickup.time) {
      return res.status(400).json({ error: 'Invalid pickup: requires lat, lng, address, time' });
    }

    const booking = await rentalService.createBooking(userId, packageId, {
      ...pickup,
      time: new Date(pickup.time),
    });
    res.status(201).json({ success: true, booking });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * @route GET /api/rental/booking/:bookingId
 * @desc Get booking
 */
router.get('/booking/:bookingId', async (req: Request, res: Response) => {
  try {
    const booking = await rentalService.getBooking(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json({ success: true, booking });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * @route POST /api/rental/booking/:bookingId/start
 * @desc Start rental
 */
router.post('/booking/:bookingId/start', async (req: Request, res: Response) => {
  try {
    const { currentKm } = req.body;
    if (typeof currentKm !== 'number' || currentKm < 0) {
      return res.status(400).json({ error: 'Invalid currentKm' });
    }
    const booking = await rentalService.startRental(req.params.bookingId, currentKm);
    res.json({ success: true, booking });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * @route POST /api/rental/booking/:bookingId/complete
 * @desc Complete rental
 */
router.post('/booking/:bookingId/complete', async (req: Request, res: Response) => {
  try {
    const { finalKm } = req.body;
    if (typeof finalKm !== 'number' || finalKm < 0) {
      return res.status(400).json({ error: 'Invalid finalKm' });
    }
    const result = await rentalService.completeRental(
      req.params.bookingId,
      finalKm,
      new Date()
    );
    res.json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * @route POST /api/rental/booking/:bookingId/cancel
 * @desc Cancel booking
 */
router.post('/booking/:bookingId/cancel', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const result = await rentalService.cancelBooking(req.params.bookingId, reason || 'User cancelled');
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
});

// ===========================================
// USER
// ===========================================

/**
 * @route GET /api/rental/user/:userId
 * @desc Get user's active rental
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const booking = await rentalService.getBookingByUser(req.params.userId);
    res.json({ success: true, booking });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * @route GET /api/rental/user/:userId/history
 * @desc Get user's rental history
 */
router.get('/user/:userId/history', async (req: Request, res: Response) => {
  try {
    const history = await rentalService.getUserRentalHistory(req.params.userId);
    res.json({ success: true, history });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// ===========================================
// DRIVERS
// ===========================================

/**
 * @route GET /api/rental/drivers
 * @desc Get available rental drivers
 */
router.get('/drivers', async (req: Request, res: Response) => {
  try {
    const { vehicleType } = req.query;
    const drivers = await rentalService.getAvailableDrivers(vehicleType as 'auto' | 'sedan' | 'suv' | undefined);
    res.json({ success: true, drivers });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// ===========================================
// STATS
// ===========================================

/**
 * @route GET /api/rental/stats
 * @desc Get rental statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await rentalService.getRentalStats();
    res.json({ success: true, stats });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
