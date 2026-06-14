/**
 * Booking Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { bookingService } from '../services/booking.service';

const router = Router();

// Validation schemas
const checkInSchema = z.object({
  guestId: z.string().min(1),
  bookingId: z.string().min(1),
  idType: z.string().min(1),
  idNumber: z.string().min(1),
});

const checkoutSchema = z.object({
  guestId: z.string().min(1),
  bookingId: z.string().min(1),
  paymentMethod: z.enum(['card', 'cash', 'wallet']).optional(),
});

// GET /api/bookings - List guest bookings
router.get('/', async (req: Request, res: Response) => {
  try {
    const { guestId, status } = req.query;

    if (!guestId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'guestId is required' },
      });
    }

    const bookings = await bookingService.getGuestBookings(guestId as string, status as string);

    res.json({
      success: true,
      data: { bookings },
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get bookings' },
    });
  }
});

// GET /api/bookings/:bookingId - Get booking details
router.get('/:bookingId', async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.getBooking(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Booking not found' },
      });
    }

    res.json({ success: true, data: { booking } });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get booking' },
    });
  }
});

// POST /api/bookings/:bookingId/checkin - Self check-in
router.post('/:bookingId/checkin', async (req: Request, res: Response) => {
  try {
    const validated = checkInSchema.parse(req.body);

    if (validated.bookingId !== req.params.bookingId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Booking ID mismatch' },
      });
    }

    const result = await bookingService.checkIn(validated);

    res.json({
      success: true,
      data: result,
      message: 'Check-in successful',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', details: error.errors },
      });
    }
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to check in' },
    });
  }
});

// POST /api/bookings/:bookingId/checkout - Self check-out
router.post('/:bookingId/checkout', async (req: Request, res: Response) => {
  try {
    const validated = checkoutSchema.parse(req.body);

    if (validated.bookingId !== req.params.bookingId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Booking ID mismatch' },
      });
    }

    const result = await bookingService.checkOut(validated);

    res.json({
      success: true,
      data: result,
      message: 'Check-out successful',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', details: error.errors },
      });
    }
    console.error('Check-out error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to check out' },
    });
  }
});

// GET /api/bookings/:bookingId/invoice - Get booking invoice
router.get('/:bookingId/invoice', async (req: Request, res: Response) => {
  try {
    const invoice = await bookingService.getInvoice(req.params.bookingId);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invoice not found' },
      });
    }

    res.json({ success: true, data: { invoice } });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get invoice' },
    });
  }
});

export default router;
