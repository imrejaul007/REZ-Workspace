import { Router, Request, Response } from 'express';
import { QuickRideService } from '../services/quick-ride.service';

const router = Router();
const quickRideService = new QuickRideService();

// ===========================================
// QUICK RIDE TYPES
// ===========================================

/**
 * @route GET /api/quick/types
 * @desc Get available quick ride types
 */
router.get('/types', async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.query;

    const types = await quickRideService.getQuickRideTypes({
      lat: parseFloat(lat as string),
      lng: parseFloat(lng as string),
    });

    res.json({ success: true, types });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// CREATE QUICK RIDE
// ===========================================

/**
 * @route POST /api/quick
 * @desc Create quick ride
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      pickup,
      drop,
      rideType,
      paymentMethod,
    } = req.body;

    const result = await quickRideService.createQuickRide({
      userId,
      pickup,
      drop,
      rideType,
      paymentMethod,
      safetyVerified: true,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// SAFETY
// ===========================================

/**
 * @route GET /api/quick/safety/:userId
 * @desc Get safety checklist status
 */
router.get('/safety/:userId', async (req: Request, res: Response) => {
  try {
    const checklist = await quickRideService.verifySafetyChecklist(req.params.userId);
    res.json({ success: true, checklist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/quick/sos/:rideId
 * @desc Enable SOS for quick ride
 */
router.post('/sos/:rideId', async (req: Request, res: Response) => {
  try {
    const sos = await quickRideService.enableSOS(req.params.rideId);
    res.json({ success: true, sos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/quick/share/:rideId
 * @desc Share quick ride with contacts
 */
router.post('/share/:rideId', async (req: Request, res: Response) => {
  try {
    const { contacts } = req.body;

    const share = await quickRideService.shareQuickRide(req.params.rideId, contacts);
    res.json({ success: true, ...share });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// FARE CALCULATION
// ===========================================

/**
 * @route GET /api/quick/fare
 * @desc Calculate bike fare
 */
router.get('/fare', async (req: Request, res: Response) => {
  try {
    const { distanceKm, durationMinutes, rideType } = req.query;

    const fare = await quickRideService.calculateBikeFare(
      parseFloat(distanceKm as string),
      parseInt(durationMinutes as string),
      rideType as any
    );

    res.json({ success: true, fare });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
