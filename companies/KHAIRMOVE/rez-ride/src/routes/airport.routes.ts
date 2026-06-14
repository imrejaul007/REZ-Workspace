import { Router, Request, Response } from 'express';
import { AirportService } from '../services/airport.service';

const router = Router();
const airportService = new AirportService(null as any);

// ===========================================
// AIRPORTS
// ===========================================

/**
 * @route GET /api/airports
 * @desc Get all airports
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const airports = await airportService.getAirports();
    res.json({ success: true, airports });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/airports/code/:code
 * @desc Get airport by code
 */
router.get('/code/:code', async (req: Request, res: Response) => {
  try {
    const airport = await airportService.getAirport(req.params.code);
    if (!airport) {
      return res.status(404).json({ error: 'Airport not found' });
    }
    res.json({ success: true, airport });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/airports/:id
 * @desc Get airport by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const airport = await airportService.getAirportById(req.params.id);
    if (!airport) {
      return res.status(404).json({ error: 'Airport not found' });
    }
    res.json({ success: true, airport });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// QUEUE
// ===========================================

/**
 * @route GET /api/airports/:id/queue
 * @desc Get airport queue
 */
router.get('/:id/queue', async (req: Request, res: Response) => {
  try {
    const { vehicleType = 'cab' } = req.query;
    const queue = await airportService.getQueue(
      req.params.id,
      vehicleType as 'auto' | 'cab' | 'suv'
    );
    res.json({ success: true, queue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/airports/:id/queue/join
 * @desc Join airport queue
 */
router.post('/:id/queue/join', async (req: Request, res: Response) => {
  try {
    const { driverId, driverName, vehicleType, vehiclePlate } = req.body;

    const entry = await airportService.joinQueue(req.params.id, {
      id: driverId,
      name: driverName,
      vehicleType,
      vehiclePlate,
    });

    res.json({ success: true, entry });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route POST /api/airports/:id/queue/leave
 * @desc Leave airport queue
 */
router.post('/:id/queue/leave', async (req: Request, res: Response) => {
  try {
    const { driverId, vehicleType } = req.body;

    await airportService.leaveQueue(req.params.id, vehicleType, driverId);
    res.json({ success: true, message: 'Left queue' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route GET /api/airports/:id/queue/position
 * @desc Get queue position
 */
router.get('/:id/queue/position', async (req: Request, res: Response) => {
  try {
    const { driverId, vehicleType } = req.query;

    const position = await airportService.getPosition(
      req.params.id,
      vehicleType as 'auto' | 'cab' | 'suv',
      driverId as string
    );

    res.json({ success: true, position });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/airports/:id/surge
 * @desc Get airport surge multiplier
 */
router.get('/:id/surge', async (req: Request, res: Response) => {
  try {
    const surge = await airportService.getSurgeMultiplier(req.params.id);
    res.json({ success: true, surge });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/airports/:id/stats
 * @desc Get queue statistics
 */
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const stats = await airportService.getQueueStats(req.params.id);
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
