import { Router, Request, Response } from 'express';
import { AppointmentModel } from '../models/Appointment';
import { CreateBookingSchema } from '../types';
import { ZodError } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const customerId = req.query.customerId as string;
    const vehicleId = req.query.vehicleId as string;
    const status = req.query.status as string;
    const date = req.query.date as string;

    const query: Record<string, unknown> = {};
    if (customerId) query.customerId = customerId;
    if (vehicleId) query.vehicleId = vehicleId;
    if (status) query.status = status;
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      AppointmentModel.find(query).sort({ date: -1, startTime: 1 }).skip(skip).limit(limit),
      AppointmentModel.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: bookings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const booking = await AppointmentModel.findById(req.params.id);
    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found' });
      return;
    }
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = await CreateBookingSchema.parseAsync(req.body);
    const booking = new AppointmentModel({
      bookingId: `AUTO-${uuidv4().substring(0, 8).toUpperCase()}`,
      ...data,
      date: new Date(data.date),
      endTime: data.startTime,
      status: 'scheduled'
    });
    await booking.save();
    res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking created successfully'
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
      return;
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const updates: Record<string, unknown> = { ...req.body };
    if (updates.date) updates.date = new Date(updates.date as string);
    const booking = await AppointmentModel.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found' });
      return;
    }
    res.json({ success: true, data: booking, message: 'Booking updated' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const booking = await AppointmentModel.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );
    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found' });
      return;
    }
    res.json({ success: true, data: booking, message: 'Status updated' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const booking = await AppointmentModel.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'cancelled' } },
      { new: true }
    );
    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found' });
      return;
    }
    res.json({ success: true, message: 'Booking cancelled' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;
