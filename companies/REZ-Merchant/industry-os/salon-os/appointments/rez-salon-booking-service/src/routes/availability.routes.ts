/**
 * Availability Routes - Stylist availability and time slots
 */

import { Router, Request, Response } from 'express';
import { Appointment } from '../models/Appointment';
import { bookingService } from '../services/booking.service';

const router = Router();

// GET /api/availability/slots - Get available time slots
router.get('/slots', async (req: Request, res: Response) => {
  try {
    const { salonId, stylistId, date, serviceIds } = req.query;

    if (!salonId || !date) {
      res.status(400).json({
        success: false,
        error: 'salonId and date are required',
      });
      return;
    }

    const slots = await bookingService.getAvailableSlots(
      salonId as string,
      date as string,
      stylistId as string | undefined,
      serviceIds ? (serviceIds as string).split(',') : undefined
    );

    res.json({
      success: true,
      data: slots,
    });
  } catch (error) {
    console.error('Error getting slots:', error);
    res.status(500).json({ success: false, error: 'Failed to get available slots' });
  }
});

// GET /api/availability/:stylistId - Get stylist availability
router.get('/:stylistId', async (req: Request, res: Response) => {
  try {
    const { stylistId } = req.params;
    const { date, startDate, endDate } = req.query;

    if (!date && !startDate) {
      res.status(400).json({
        success: false,
        error: 'date or startDate is required',
      });
      return;
    }

    const availability = await bookingService.getStylistAvailability(
      stylistId,
      date as string | undefined,
      startDate as string | undefined,
      endDate as string | undefined
    );

    res.json({
      success: true,
      data: availability,
    });
  } catch (error) {
    console.error('Error getting availability:', error);
    res.status(500).json({ success: false, error: 'Failed to get availability' });
  }
});

// POST /api/availability - Set availability (block time)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { stylistId, date, startTime, endTime, reason } = req.body;

    if (!stylistId || !date || !startTime || !endTime) {
      res.status(400).json({
        success: false,
        error: 'stylistId, date, startTime, and endTime are required',
      });
      return;
    }

    // Create a blocked time entry (represented as a cancelled booking)
    const blockId = `BLOCK${Date.now()}`;
    const block = await Appointment.create({
      appointmentId: blockId,
      salonId: 'SYSTEM',
      customerId: 'BLOCKED',
      customerName: 'Blocked',
      customerPhone: '0000000000',
      stylistId,
      serviceIds: [],
      date,
      startTime,
      endTime,
      duration: bookingService.calculateDuration(startTime, endTime),
      status: 'cancelled',
      type: 'walkin',
      notes: reason || 'Time blocked',
      source: 'app',
    });

    res.status(201).json({
      success: true,
      data: block,
      message: 'Availability blocked successfully',
    });
  } catch (error) {
    console.error('Error blocking availability:', error);
    res.status(500).json({ success: false, error: 'Failed to block availability' });
  }
});

// DELETE /api/availability/:blockId - Remove blocked time
router.delete('/:blockId', async (req: Request, res: Response) => {
  try {
    const { blockId } = req.params;

    const block = await Appointment.findOneAndDelete({
      appointmentId: blockId,
      customerId: 'BLOCKED',
    });

    if (!block) {
      res.status(404).json({ success: false, error: 'Blocked time not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Blocked time removed successfully',
    });
  } catch (error) {
    console.error('Error removing block:', error);
    res.status(500).json({ success: false, error: 'Failed to remove blocked time' });
  }
});

// GET /api/availability/calendar/:date - Get daily calendar
router.get('/calendar/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const { salonId } = req.query;

    const query: Record<string, unknown> = {
      date,
      status: { $nin: ['cancelled', 'no_show'] },
    };

    if (salonId) query.salonId = salonId;

    const bookings = await Appointment.find(query)
      .populate('stylistId', 'name image')
      .sort({ startTime: 1 });

    res.json({
      success: true,
      data: {
        date,
        totalBookings: bookings.length,
        bookings,
      },
    });
  } catch (error) {
    console.error('Error fetching calendar:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch calendar' });
  }
});

export { router as availabilityRoutes };
