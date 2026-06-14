/**
 * Availability Routes
 */

import { Router, Request, Response } from 'express';
import { Stylist } from '../models/Stylist';
import { Booking } from '../models/Booking';

const router = Router();

// Get available slots
router.get('/slots', async (req: Request, res: Response) => {
  try {
    const { salonId, stylistId, serviceId, date, duration } = req.query;

    if (!date || !duration) {
      res.status(400).json({ success: false, error: 'date and duration required' });
      return;
    }

    const slots: string[] = [];
    const startHour = 9;
    const endHour = 20;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }

    // In production, filter out booked slots from Booking collection
    res.json({
      success: true,
      data: {
        date,
        duration: Number(duration),
        slots,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get availability' });
  }
});

// Get stylist schedule
router.get('/stylist/:stylistId', async (req: Request, res: Response) => {
  try {
    const { stylistId } = req.params;

    const stylist = await Stylist.findOne({ stylistId });

    if (!stylist) {
      res.status(404).json({ success: false, error: 'Stylist not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        stylistId,
        name: stylist.name,
        schedule: stylist.schedule,
        specialties: stylist.specialties,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get stylist schedule' });
  }
});

export { router as availabilityRoutes };
