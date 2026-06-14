import { Router, Request, Response } from 'express';
import { dataPipelineService } from '../services/data-pipeline.service';

const router = Router();

/**
 * @route POST /api/realtime/user-location
 * @desc Track user location (called from user app every 5 seconds)
 */
router.post('/user-location', async (req: Request, res: Response) => {
  try {
    const { userId, location } = req.body;

    if (!userId || !location) {
      return res.status(400).json({ error: 'userId and location required' });
    }

    dataPipelineService.trackUserLocation(userId, {
      lat: location.lat,
      lng: location.lng,
      accuracy: location.accuracy || 0,
      speed: location.speed,
      heading: location.heading,
      timestamp: new Date(),
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to track location' });
  }
});

/**
 * @route POST /api/realtime/driver-location
 * @desc Track driver location (called from driver app every 3 seconds)
 */
router.post('/driver-location', async (req: Request, res: Response) => {
  try {
    const { driverId, location, status } = req.body;

    if (!driverId || !location) {
      return res.status(400).json({ error: 'driverId and location required' });
    }

    dataPipelineService.trackDriverLocation(driverId, {
      lat: location.lat,
      lng: location.lng,
      heading: location.heading || 0,
      speed: location.speed || 0,
      status: status || 'online',
      timestamp: new Date(),
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to track location' });
  }
});

/**
 * @route POST /api/realtime/search
 * @desc Track ride search event
 */
router.post('/search', async (req: Request, res: Response) => {
  try {
    const { userId, pickup, drop, vehicleType, surge } = req.body;

    dataPipelineService.trackSearch(userId, {
      pickup,
      drop,
      vehicleType,
      surge,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to track search' });
  }
});

/**
 * @route POST /api/realtime/booking
 * @desc Track ride booking
 */
router.post('/booking', async (req: Request, res: Response) => {
  try {
    const { userId, rideId, pickup, drop, vehicleType, fare, distance } = req.body;

    dataPipelineService.trackBooking(userId, {
      rideId,
      pickup,
      drop,
      vehicleType,
      fare,
      distance,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to track booking' });
  }
});

/**
 * @route POST /api/realtime/completion
 * @desc Track ride completion
 */
router.post('/completion', async (req: Request, res: Response) => {
  try {
    const { userId, rideId, fare, distance, duration, vehicleType, rating, pickup, drop, cashback, driverId } = req.body;

    dataPipelineService.trackCompletion(userId, {
      rideId,
      fare,
      distance,
      duration,
      vehicleType,
      rating,
      pickup,
      drop,
      cashback,
      driverId,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to track completion' });
  }
});

/**
 * @route GET /api/realtime/demand-heatmap
 * @desc Get real-time demand heatmap (for operations)
 */
router.get('/demand-heatmap', async (req: Request, res: Response) => {
  try {
    const demand = dataPipelineService.getDemandHeatmap();
    const supply = dataPipelineService.getSupplyHeatmap();

    res.json({
      success: true,
      data: {
        demand,
        supply,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get heatmap' });
  }
});

/**
 * @route GET /api/realtime/insights
 * @desc Get real-time operational insights
 */
router.get('/insights', async (req: Request, res: Response) => {
  try {
    const insights = await dataPipelineService.getOperationalInsights();

    res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get insights' });
  }
});

export default router;
