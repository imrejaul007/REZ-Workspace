import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { DriverLocation } from '../models/DriverLocation';
import { Delivery } from '../models/Delivery';
import { authenticate } from '../middleware/auth';

const router = Router();

// Validation helpers
function validateCoordinates(lat: number, lng: number): boolean {
  return typeof lat === 'number' && typeof lng === 'number' &&
         lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

// Update driver location (requires authentication)
router.post('/driver/:driverId/location', authenticate(), async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    
    // Verify the authenticated driver owns this location update
    if (req.user!.role === 'driver' && req.user!.userId !== driverId) {
      return res.status(403).json({ error: 'Cannot update another driver\'s location' });
    }
    
    const { lat, lng, heading, speed } = req.body;
    
    // Validate coordinates
    if (!validateCoordinates(lat, lng)) {
      return res.status(400).json({ error: 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.' });
    }
    
    // Save to MongoDB instead of in-memory Map
    await DriverLocation.findOneAndUpdate(
      { driverId },
      {
        lat,
        lng,
        heading,
        speed,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );
    
    res.json({ success: true, driverId });
  } catch (error) {
    console.error('Error updating driver location:', error);
    res.status(500).json({ error: 'Failed to update driver location' });
  }
});

// Get driver location
router.get('/driver/:driverId/location', async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    const location = await DriverLocation.findOne({ driverId });
    
    if (!location) {
      return res.status(404).json({ error: 'Driver location not found' });
    }
    
    res.json({
      driverId: location.driverId,
      lat: location.lat,
      lng: location.lng,
      heading: location.heading,
      speed: location.speed,
      updatedAt: location.updatedAt,
    });
  } catch (error) {
    console.error('Error getting driver location:', error);
    res.status(500).json({ error: 'Failed to get driver location' });
  }
});

// Create delivery
router.post('/', async (req: Request, res: Response) => {
  try {
    const { orderId, pickup, dropoff, driverId } = req.body;
    
    if (!orderId || !pickup || !dropoff) {
      return res.status(400).json({ error: 'Missing required fields: orderId, pickup, dropoff' });
    }
    
    const deliveryId = `del_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const delivery = new Delivery({
      deliveryId,
      orderId,
      pickup,
      dropoff,
      driverId,
      status: 'assigned',
      history: [{
        status: 'assigned',
        timestamp: new Date(),
      }],
    });
    
    await delivery.save();
    
    res.status(201).json({ success: true, deliveryId });
  } catch (error) {
    console.error('Error creating delivery:', error);
    res.status(500).json({ error: 'Failed to create delivery' });
  }
});

// Get delivery status
router.get('/:deliveryId', async (req: Request, res: Response) => {
  try {
    const { deliveryId } = req.params;
    const delivery = await Delivery.findOne({ deliveryId });
    
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    
    let driverLocation = null;
    if (delivery.driverId) {
      driverLocation = await DriverLocation.findOne({ driverId: delivery.driverId });
    }
    
    res.json({
      ...delivery.toObject(),
      driverLocation: driverLocation ? {
        lat: driverLocation.lat,
        lng: driverLocation.lng,
        heading: driverLocation.heading,
        speed: driverLocation.speed,
        updatedAt: driverLocation.updatedAt,
      } : null,
    });
  } catch (error) {
    console.error('Error getting delivery:', error);
    res.status(500).json({ error: 'Failed to get delivery' });
  }
});

// Get ETA
router.get('/:deliveryId/eta', async (req: Request, res: Response) => {
  try {
    const { deliveryId } = req.params;
    const delivery = await Delivery.findOne({ deliveryId });
    
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    
    // Calculate a deterministic ETA based on distance (simplified)
    // In production, integrate with a routing API
    const baseEta = 15 + Math.floor(Math.random() * 15); // 15-30 minutes
    const distanceKm = (Math.random() * 10).toFixed(1);
    
    res.json({
      deliveryId,
      etaMinutes: baseEta,
      distanceKm: parseFloat(distanceKm),
    });
  } catch (error) {
    console.error('Error calculating ETA:', error);
    res.status(500).json({ error: 'Failed to calculate ETA' });
  }
});

// Update delivery status
router.put('/:deliveryId/status', async (req: Request, res: Response) => {
  try {
    const { deliveryId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }
    
    const delivery = await Delivery.findOne({ deliveryId });
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    
    delivery.status = status;
    delivery.history.push({
      status,
      timestamp: new Date(),
    });
    
    await delivery.save();
    
    res.json({ success: true, delivery });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({ error: 'Failed to update delivery status' });
  }
});

// Get nearby drivers (simplified - in production use geospatial queries)
router.get('/drivers/nearby', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius } = req.query;
    
    // Get all active driver locations
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const drivers = await DriverLocation.find({
      updatedAt: { $gte: oneHourAgo },
    });
    
    // Simple distance filtering (in production, use MongoDB geospatial queries)
    const targetLat = lat ? parseFloat(lat as string) : 0;
    const targetLng = lng ? parseFloat(lng as string) : 0;
    const maxRadius = radius ? parseFloat(radius as string) : 10; // km
    
    const nearby = drivers.filter(driver => {
      // Haversine formula for distance calculation
      const R = 6371; // Earth's radius in km
      const dLat = (driver.lat - targetLat) * Math.PI / 180;
      const dLng = (driver.lng - targetLng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(targetLat * Math.PI / 180) * Math.cos(driver.lat * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      return distance <= maxRadius;
    }).slice(0, 10);
    
    res.json({
      drivers: nearby.map(driver => ({
        driverId: driver.driverId,
        lat: driver.lat,
        lng: driver.lng,
        heading: driver.heading,
        speed: driver.speed,
        updatedAt: driver.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error getting nearby drivers:', error);
    res.status(500).json({ error: 'Failed to get nearby drivers' });
  }
});

export default router;
