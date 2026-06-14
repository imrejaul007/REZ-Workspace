import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { Delivery } from '../models/Delivery';

const router = Router();

// Pricing
const BASE_PRICE = 40;
const PER_KM = 8;
const PRIORITY_CHARGE = 20;
const FRAGILE_CHARGE = 20;

// Calculate price
function calculatePrice(distance: number, isPriority: boolean, isFragile: boolean, vehicleType: string): {
  deliveryFee: number;
  platformFee: number;
  driverEarning: number;
} {
  let price = BASE_PRICE + (distance * PER_KM);

  if (isPriority) price += PRIORITY_CHARGE;
  if (isFragile) price += FRAGILE_CHARGE;
  if (vehicleType === 'auto') price *= 1.3;
  if (vehicleType === 'mini_truck') price *= 2;

  // Platform fee: 15%
  const platformFee = Math.ceil(price * 0.15);

  // Driver earns: 80%
  const driverEarning = Math.ceil(price * 0.80);

  // Delivery fee = platform + driver
  const deliveryFee = price;

  return { deliveryFee, platformFee, driverEarning };
}

// Create delivery
router.post('/create', async (req: Request, res: Response) => {
  try {
    const {
      orderId,
      type = 'instant',
      pickup,
      drop,
      distance,
      estimatedTime,
      customerId,
      customerPhone,
      customerName,
      items,
      specialInstructions,
      isFragile = false,
      isPriority = false,
      vehicleType = 'bike',
      storeId,
      storeName,
      scheduledAt
    } = req.body;

    const { deliveryFee, platformFee, driverEarning } = calculatePrice(
      distance,
      isPriority,
      isFragile,
      vehicleType
    );

    const otp = crypto.randomInt(1000, 9999).toString();

    const delivery = new Delivery({
      orderId,
      type,
      pickup,
      drop,
      distance,
      estimatedTime,
      customerId,
      customerPhone,
      customerName,
      items,
      specialInstructions,
      isFragile,
      isPriority,
      vehicleType,
      deliveryFee,
      platformFee,
      driverEarning,
      otp,
      trackingUrl: `https://track.rez.money/${orderId}`,
      storeId,
      storeName,
      scheduledAt: scheduledAt || new Date()
    });

    await delivery.save();

    res.status(201).json({
      deliveryId: delivery._id,
      orderId: delivery.orderId,
      status: delivery.status,
      deliveryFee: delivery.deliveryFee,
      platformFee: delivery.platformFee,
      driverEarning: delivery.driverEarning,
      estimatedTime: delivery.estimatedTime,
      otp: delivery.otp,
      trackingUrl: delivery.trackingUrl
    });

  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get delivery status
router.get('/:deliveryId', async (req: Request, res: Response) => {
  try {
    const delivery = await Delivery.findById(req.params.deliveryId);

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    res.json({
      deliveryId: delivery._id,
      orderId: delivery.orderId,
      status: delivery.status,
      pickup: delivery.pickup,
      drop: delivery.drop,
      driverName: delivery.driverName,
      driverPhone: delivery.driverPhone,
      driverRating: delivery.driverRating,
      estimatedTime: delivery.estimatedTime,
      actualTime: delivery.actualTime,
      timeline: delivery.timeline,
      rating: delivery.rating,
      trackingUrl: delivery.trackingUrl
    });

  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Assign driver
router.patch('/:deliveryId/assign', async (req: Request, res: Response) => {
  try {
    const { driverId, driverName, driverPhone } = req.body;

    const delivery = await Delivery.findById(req.params.deliveryId);

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    delivery.driverId = driverId;
    delivery.driverName = driverName;
    delivery.driverPhone = driverPhone;
    delivery.status = 'assigned';

    delivery.timeline.push({
      status: 'assigned',
      timestamp: new Date(),
      comment: `Driver ${driverName} assigned`
    });

    await delivery.save();

    res.json({
      success: true,
      status: delivery.status,
      driverName: delivery.driverName
    });

  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update status
router.patch('/:deliveryId/status', async (req: Request, res: Response) => {
  try {
    const { status, location, comment } = req.body;

    const delivery = await Delivery.findById(req.params.deliveryId);

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    delivery.status = status;
    delivery.timeline.push({
      status,
      timestamp: new Date(),
      location,
      comment
    });

    if (status === 'picked_up') {
      delivery.pickedUpAt = new Date();
    }

    if (status === 'delivered') {
      delivery.deliveredAt = new Date();
      delivery.actualTime = Math.round(
        (delivery.deliveredAt.getTime() - delivery.pickedUpAt.getTime()) / 60000
      );
    }

    await delivery.save();

    res.json({
      success: true,
      status: delivery.status
    });

  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Rate delivery
router.patch('/:deliveryId/rate', async (req: Request, res: Response) => {
  try {
    const { rating, comment } = req.body;

    const delivery = await Delivery.findById(req.params.deliveryId);

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    delivery.rating = rating;
    delivery.ratingComment = comment;
    await delivery.save();

    res.json({ success: true, rating: delivery.rating });

  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Verify OTP
router.post('/:deliveryId/verify-otp', async (req: Request, res: Response) => {
  try {
    const { otp } = req.body;

    const delivery = await Delivery.findById(req.params.deliveryId);

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    if (delivery.otp !== otp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP'
      });
    }

    res.json({
      success: true,
      message: 'OTP verified'
    });

  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get pricing estimate
router.post('/estimate', async (req: Request, res: Response) => {
  try {
    const { distance, isPriority = false, isFragile = false, vehicleType = 'bike' } = req.body;

    const { deliveryFee, platformFee, driverEarning } = calculatePrice(
      distance,
      isPriority,
      isFragile,
      vehicleType
    );

    res.json({
      deliveryFee,
      platformFee,
      driverEarning,
      breakdown: {
        base: BASE_PRICE,
        perKm: distance * PER_KM,
        priority: isPriority ? PRIORITY_CHARGE : 0,
        fragile: isFragile ? FRAGILE_CHARGE : 0
      }
    });

  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
