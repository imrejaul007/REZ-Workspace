import { Router } from 'express';
import { Booking } from '../db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Create booking (protected)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { hotelId, guestName, guestEmail, checkIn, checkOut, rooms } = req.body;

    const booking = await Booking.create({
      hotelId,
      guestName,
      guestEmail,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      rooms,
      status: 'pending'
    });

    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Booking failed' });
  }
});

// Get booking (protected)
router.get('/:id', authenticateToken, async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  res.json(booking);
});

export { router as bookingRoutes };
