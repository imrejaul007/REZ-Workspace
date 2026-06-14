import { Router, Request, Response } from 'express';
import { AppointmentModel } from '../models/Appointment';
import { CreateBookingSchema, UpdateBookingSchema } from '../types';
import { ZodError } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const validateRequest = (schema: typeof CreateBookingSchema | typeof UpdateBookingSchema) => {
  return async (req: Request, res: Response, next: Function) => {
    try {
      const data = await schema.parseAsync(req.body);
      req.body = data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors
        });
        return;
      }
      next(error);
    }
  };
};

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const customerId = req.query.customerId as string;
    const therapistId = req.query.therapistId as string;
    const serviceId = req.query.serviceId as string;
    const date = req.query.date as string;

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (customerId) query.customerId = customerId;
    if (therapistId) query.therapistId = therapistId;
    if (serviceId) query.serviceId = serviceId;
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const skip = (page - 1) * limit;
    const [appointments, total] = await Promise.all([
      AppointmentModel.find(query)
        .sort({ date: -1, startTime: 1 })
        .skip(skip)
        .limit(limit),
      AppointmentModel.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: appointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
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
    const appointment = await AppointmentModel.findById(req.params.id);
    if (!appointment) {
      res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
      return;
    }
    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.post('/', validateRequest(CreateBookingSchema), async (req: Request, res: Response) => {
  try {
    const { customerId, serviceId, therapistId, date, startTime, notes, specialRequests } = req.body;

    const appointmentDate = new Date(date);
    const endTimeCalc = startTime;

    const appointment = new AppointmentModel({
      bookingId: `BK-${uuidv4().substring(0, 8).toUpperCase()}`,
      customerId,
      serviceId,
      therapistId: therapistId || 'unassigned',
      date: appointmentDate,
      startTime,
      endTime: endTimeCalc,
      duration: 60,
      status: 'pending',
      notes: notes || '',
      specialRequests: specialRequests || ''
    });

    await appointment.save();

    res.status(201).json({
      success: true,
      data: appointment,
      message: 'Booking created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.put('/:id', validateRequest(UpdateBookingSchema), async (req: Request, res: Response) => {
  try {
    const updates: Record<string, unknown> = { ...req.body };
    if (updates.date) {
      updates.date = new Date(updates.date as string);
    }

    const appointment = await AppointmentModel.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!appointment) {
      res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
      return;
    }

    res.json({
      success: true,
      data: appointment,
      message: 'Booking updated successfully'
    });
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
    const appointment = await AppointmentModel.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );

    if (!appointment) {
      res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
      return;
    }

    res.json({
      success: true,
      data: appointment,
      message: 'Booking status updated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const appointment = await AppointmentModel.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'cancelled' } },
      { new: true }
    );

    if (!appointment) {
      res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.get('/customer/:customerId', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const appointments = await AppointmentModel.findByCustomer(req.params.customerId, limit);
    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;
