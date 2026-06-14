import { Router, Request, Response } from 'express';
import { DeliveryModel } from '../models/Delivery';
import { DriverModel } from '../models/Driver';
import { CreateDeliverySchema } from '../types';
import { ZodError } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/deliveries', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const driverId = req.query.driverId as string;

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (driverId) query.driverId = driverId;

    const skip = (page - 1) * limit;
    const [deliveries, total] = await Promise.all([
      DeliveryModel.find(query).sort({ scheduledTime: 1 }).skip(skip).limit(limit),
      DeliveryModel.countDocuments(query)
    ]);

    res.json({ success: true, data: deliveries, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.post('/deliveries', async (req: Request, res: Response) => {
  try {
    const data = await CreateDeliverySchema.parseAsync(req.body);
    const delivery = new DeliveryModel({
      deliveryId: `DEL-${uuidv4().substring(0, 8).toUpperCase()}`,
      ...data,
      scheduledTime: new Date(data.scheduledTime),
      status: 'pending'
    });
    await delivery.save();
    res.status(201).json({ success: true, data: delivery, message: 'Delivery created' });
  } catch (error) {
    if (error instanceof ZodError) { res.status(400).json({ success: false, error: 'Validation failed', details: error.errors }); return; }
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.patch('/deliveries/:id/assign', async (req: Request, res: Response) => {
  try {
    const { driverId } = req.body;
    const delivery = await DeliveryModel.findByIdAndUpdate(req.params.id, { $set: { driverId, status: 'assigned' } }, { new: true });
    if (!delivery) { res.status(404).json({ success: false, error: 'Delivery not found' }); return; }
    res.json({ success: true, data: delivery, message: 'Driver assigned' });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.patch('/deliveries/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const updates: Record<string, unknown> = { status };
    if (status === 'picked_up') updates.pickedUpAt = new Date();
    if (status === 'delivered') updates.deliveredAt = new Date();
    const delivery = await DeliveryModel.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    if (!delivery) { res.status(404).json({ success: false, error: 'Delivery not found' }); return; }
    res.json({ success: true, data: delivery, message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.get('/drivers', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    const drivers = await DriverModel.find(query).sort({ rating: -1 });
    res.json({ success: true, data: drivers });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

router.get('/drivers/available', async (_req: Request, res: Response) => {
  try {
    const drivers = await DriverModel.findAvailable();
    res.json({ success: true, data: drivers });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

export default router;
