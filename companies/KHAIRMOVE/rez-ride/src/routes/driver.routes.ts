import { logger } from '../../shared/logger';
import { Router, Request, Response } from 'express';
import { DriverService } from '../services/driver.service';
import { RideService } from '../services/ride.service';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation.middleware';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Apply auth to all routes
router.use(requireAuth());

// Schemas
const updateLocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  heading: z.number().optional(),
  speed: z.number().optional(),
});

const updateBankSchema = z.object({
  accountNumber: z.string().min(8).max(20),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/),
  accountHolderName: z.string().min(2).max(100),
});

/**
 * @route GET /api/drivers/:id
 * @desc Get driver profile
 * @access Authenticated users (drivers can only view own profile)
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const driverService = req.app.get('driverService');
    const driverId = req.params.id;

    // Ownership check: drivers can only view their own profile
    if (req.user!.role === 'driver' && req.user!.id !== driverId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only view your own profile.',
        code: 'FORBIDDEN'
      });
    }

    // Admins can view any profile
    const driver = await driverService.getDriver(driverId);
    res.json({ success: true, driver });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(404).json({ success: false, error: message });
  }
});

/**
 * @route PATCH /api/drivers/:id/location
 * @desc Update driver location
 * @access Driver only (can only update own location)
 */
router.patch('/:id/location', validateRequest(updateLocationSchema), async (req: Request, res: Response) => {
  try {
    const driverService = req.app.get('driverService');
    const driverId = req.params.id;

    // CRITICAL: Ownership check - drivers can only update their own location
    if (req.user!.role !== 'admin' && req.user!.id !== driverId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only update your own location.',
        code: 'FORBIDDEN'
      });
    }

    // Admin can update any driver location
    await driverService.updateLocation(driverId, req.body);
    res.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * @route POST /api/drivers/:id/status
 * @desc Go online/offline
 * @access Driver only (can only update own status)
 */
router.post('/:id/status', async (req: Request, res: Response) => {
  try {
    const driverService = req.app.get('driverService');
    const { status } = req.body;
    const driverId = req.params.id;

    // Ownership check
    if (req.user!.role !== 'admin' && req.user!.id !== driverId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied.',
        code: 'FORBIDDEN'
      });
    }

    let driver;
    if (status === 'online') {
      driver = await driverService.goOnline(driverId);
    } else if (status === 'offline') {
      driver = await driverService.goOffline(driverId);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Use "online" or "offline".'
      });
    }

    res.json({ success: true, driver });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * @route GET /api/drivers/:id/earnings
 * @desc Get driver earnings
 * @access Driver only (can only view own earnings)
 */
router.get('/:id/earnings', async (req: Request, res: Response) => {
  try {
    const driverService = req.app.get('driverService');
    const driverId = req.params.id;

    // Ownership check - financial data
    if (req.user!.role !== 'admin' && req.user!.id !== driverId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only view your own earnings.',
        code: 'FORBIDDEN'
      });
    }

    const { startDate, endDate } = req.query;
    const earnings = await driverService.getEarnings(
      driverId,
      startDate as string,
      endDate as string
    );
    res.json({ success: true, earnings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * @route PATCH /api/drivers/:id/bank
 * @desc Update bank details
 * @access Driver only (can only update own bank)
 */
router.patch('/:id/bank', validateRequest(updateBankSchema), async (req: Request, res: Response) => {
  try {
    const driverService = req.app.get('driverService');
    const driverId = req.params.id;

    // CRITICAL: Ownership check - financial fraud prevention
    if (req.user!.role !== 'admin' && req.user!.id !== driverId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only update your own bank details.',
        code: 'FORBIDDEN'
      });
    }

    // Log bank detail changes for audit
    logger.info(`[AUDIT] Bank details update for driver ${driverId} by user ${req.user!.id}`);

    await driverService.updateBankDetails(driverId, req.body);
    res.json({ success: true, message: 'Bank details updated' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * @route GET /api/drivers/:id/rides
 * @desc Get driver's ride history
 * @access Driver only (own rides)
 */
router.get('/:id/rides', async (req: Request, res: Response) => {
  try {
    const driverId = req.params.id;

    // Ownership check
    if (req.user!.role !== 'admin' && req.user!.id !== driverId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied.',
        code: 'FORBIDDEN'
      });
    }

    const rideService = req.app.get('rideService');
    const { status, page, limit } = req.query;
    const rides = await rideService.getDriverRides(
      driverId,
      status as string,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 20
    );
    res.json({ success: true, rides });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ success: false, error: message });
  }
});

export default router;
