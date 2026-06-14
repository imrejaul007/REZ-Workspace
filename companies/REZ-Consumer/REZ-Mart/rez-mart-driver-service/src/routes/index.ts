import { Router, Request, Response } from 'express';
import { Driver } from '../models';
import { z } from 'zod';

const router = Router();

// Validation schemas
const CreateDriverSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  vehicle: z.object({
    type: z.enum(['bike', 'scooter', 'car']),
    plateNumber: z.string().min(1),
    model: z.string().optional()
  }),
  documents: z.object({
    license: z.string().min(1),
    rcBook: z.string().min(1),
    insurance: z.string().min(1)
  })
});

const LocationUpdateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
});

// Create driver
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = CreateDriverSchema.parse(req.body);
    const driver = new Driver(data);
    await driver.save();
    res.status(201).json(driver);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create driver' });
  }
});

// Get all drivers
router.get('/', async (_req: Request, res: Response) => {
  try {
    const drivers = await Driver.find().sort({ rating: -1 });
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

// Get driver by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json(driver);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch driver' });
  }
});

// Get driver by userId
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const driver = await Driver.findOne({ userId: req.params.userId });
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json(driver);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch driver' });
  }
});

// Update driver status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!['available', 'busy', 'offline'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json(driver);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Update driver location
router.patch('/:id/location', async (req: Request, res: Response) => {
  try {
    const data = LocationUpdateSchema.parse(req.body);
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      {
        currentLocation: {
          ...data,
          updatedAt: new Date()
        }
      },
      { new: true }
    );
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json(driver);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Find nearby drivers
router.get('/nearby/search', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radiusKm = '5', vehicleType, limit = '10' } = req.query;
    const centerLat = parseFloat(lat as string);
    const centerLng = parseFloat(lng as string);
    const radius = parseFloat(radiusKm as string);
    const maxResults = parseInt(limit as string);

    // Simple bounding box search (for production, use geospatial queries)
    const latDelta = radius / 111; // 1 degree ≈ 111km
    const lngDelta = radius / (111 * Math.cos((centerLat * Math.PI) / 180));

    const query: any = {
      status: 'available',
      verified: true,
      'currentLocation.lat': { $gte: centerLat - latDelta, $lte: centerLat + latDelta },
      'currentLocation.lng': { $gte: centerLng - lngDelta, $lte: centerLng + lngDelta }
    };

    if (vehicleType) {
      query['vehicle.type'] = vehicleType;
    }

    const drivers = await Driver.find(query)
      .limit(maxResults)
      .sort({ rating: -1 });

    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search nearby drivers' });
  }
});

// Assign delivery to driver
router.post('/:id/assign', async (req: Request, res: Response) => {
  try {
    const { orderId, pickupLocation, deliveryLocation } = req.body;
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      {
        status: 'busy',
        $push: {
          // Could track active deliveries
        }
      },
      { new: true }
    );
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json({
      driver,
      assignment: {
        orderId,
        pickupLocation,
        deliveryLocation,
        assignedAt: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign delivery' });
  }
});

// Complete delivery
router.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    const { orderId, earnings } = req.body;
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      {
        status: 'available',
        $inc: {
          totalDeliveries: 1,
          'earnings.today': earnings || 0,
          'earnings.week': earnings || 0,
          'earnings.month': earnings || 0
        }
      },
      { new: true }
    );
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json(driver);
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete delivery' });
  }
});

// Get driver stats
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json({
      totalDeliveries: driver.totalDeliveries,
      rating: driver.rating,
      earnings: driver.earnings,
      status: driver.status
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
