import { Router, Request, Response } from 'express';
import { TrackingEvent } from '../models';
import { z } from 'zod';

const router = Router();

// Validation schemas
const CreateEventSchema = z.object({
  orderId: z.string().min(1),
  driverId: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'in_transit', 'arriving', 'delivered', 'cancelled']),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().optional()
  }).optional(),
  message: z.string().optional(),
  estimatedDelivery: z.string().datetime().optional()
});

const UpdateLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().optional()
});

// Create tracking event
router.post('/events', async (req: Request, res: Response) => {
  try {
    const data = CreateEventSchema.parse(req.body);
    const event = new TrackingEvent({
      ...data,
      timestamp: new Date()
    });
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create tracking event' });
  }
});

// Get tracking history for an order
router.get('/order/:orderId', async (req: Request, res: Response) => {
  try {
    const events = await TrackingEvent.find({ orderId: req.params.orderId })
      .sort({ timestamp: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tracking history' });
  }
});

// Get latest status for an order
router.get('/order/:orderId/latest', async (req: Request, res: Response) => {
  try {
    const event = await TrackingEvent.findOne({ orderId: req.params.orderId })
      .sort({ timestamp: -1 });
    if (!event) {
      return res.status(404).json({ error: 'No tracking data found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch latest status' });
  }
});

// Update driver location for an order
router.patch('/order/:orderId/location', async (req: Request, res: Response) => {
  try {
    const data = UpdateLocationSchema.parse(req.body);
    const latestEvent = await TrackingEvent.findOne({
      orderId: req.params.orderId,
      status: { $in: ['picked_up', 'in_transit', 'arriving'] }
    }).sort({ timestamp: -1 });

    if (!latestEvent) {
      return res.status(404).json({ error: 'No active delivery found' });
    }

    const event = new TrackingEvent({
      orderId: req.params.orderId,
      driverId: latestEvent.driverId,
      status: latestEvent.status,
      location: data,
      timestamp: new Date(),
      message: 'Location updated'
    });
    await event.save();
    res.json(event);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Get active deliveries for a driver
router.get('/driver/:driverId/active', async (req: Request, res: Response) => {
  try {
    const events = await TrackingEvent.find({
      driverId: req.params.driverId,
      status: { $in: ['picked_up', 'in_transit', 'arriving'] }
    }).sort({ timestamp: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active deliveries' });
  }
});

// Update order status
router.patch('/order/:orderId/status', async (req: Request, res: Response) => {
  try {
    const { status, message, driverId, estimatedDelivery } = req.body;
    if (!['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'in_transit', 'arriving', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const event = new TrackingEvent({
      orderId: req.params.orderId,
      driverId,
      status,
      message,
      timestamp: new Date(),
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined
    });
    await event.save();
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

export default router;
