import express from 'express';
import cors from 'cors';
import { AvailabilityService } from './services/availability.service';
import { BookingService } from './services/booking.service';

const app = express();
const PORT = 4042;

app.use(cors());
app.use(express.json());

const availabilityService = new AvailabilityService();
const bookingService = new BookingService();

// Check availability
app.post('/api/availability/check', async (req, res) => {
  try {
    const { hotelId, checkIn, checkOut, roomTypeId, guests, rooms } = req.body;

    if (!hotelId || !checkIn || !checkOut) {
      return res.status(400).json({ error: 'hotelId, checkIn, and checkOut are required' });
    }

    const result = await availabilityService.checkAvailability(
      hotelId,
      new Date(checkIn),
      new Date(checkOut),
      roomTypeId,
      guests,
      rooms
    );

    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Search rooms
app.post('/api/availability/search', async (req, res) => {
  try {
    const { hotelId, checkIn, checkOut, guests, budget } = req.body;

    if (!hotelId || !checkIn || !checkOut) {
      return res.status(400).json({ error: 'hotelId, checkIn, and checkOut are required' });
    }

    const rooms = await availabilityService.searchRooms(
      hotelId,
      new Date(checkIn),
      new Date(checkOut),
      guests,
      budget
    );

    res.json({ success: true, rooms, count: rooms.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get hotel info
app.get('/api/hotel/:hotelId', async (req, res) => {
  try {
    const { hotelId } = req.params;
    const rooms = await availabilityService.searchRooms(hotelId, new Date(), new Date(Date.now() + 86400000));

    res.json({
      success: true,
      hotelId,
      roomTypes: [...new Set(rooms.map(r => r.roomTypeName))],
      totalRooms: rooms.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create booking
app.post('/api/bookings', (req, res) => {
  try {
    const booking = bookingService.createBooking(req.body);
    res.status(201).json({ success: true, booking });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get booking by ID
app.get('/api/bookings/:id', (req, res) => {
  const booking = bookingService.getBooking(req.params.id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  res.json({ success: true, booking });
});

// Get bookings by hotel
app.get('/api/hotel/:hotelId/bookings', (req, res) => {
  const bookings = bookingService.getBookingsByHotel(req.params.hotelId);
  res.json({ success: true, bookings, count: bookings.length });
});

// Get bookings by guest
app.get('/api/guests/:guestId/bookings', (req, res) => {
  const bookings = bookingService.getBookingsByGuest(req.params.guestId);
  res.json({ success: true, bookings, count: bookings.length });
});

// Cancel booking
app.post('/api/bookings/:id/cancel', (req, res) => {
  const booking = bookingService.cancelBooking(req.params.id);
  if (!booking) {
    return res.status(400).json({ error: 'Cannot cancel booking' });
  }
  res.json({ success: true, booking });
});

// Update booking status
app.patch('/api/bookings/:id/status', (req, res) => {
  const { status } = req.body;
  const booking = bookingService.updateBookingStatus(req.params.id, status);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  res.json({ success: true, booking });
});

// Update payment status
app.patch('/api/bookings/:id/payment', (req, res) => {
  const { paymentStatus } = req.body;
  const booking = bookingService.updatePaymentStatus(req.params.id, paymentStatus);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  res.json({ success: true, booking });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'rez-booking-engine',
    version: '1.0.0',
    description: 'Direct Booking Engine',
    endpoints: {
      availability: '/api/availability',
      hotel: '/api/hotel/:hotelId',
      health: '/health',
    },
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'rez-booking-engine', port: PORT });
});

app.listen(PORT, () => {
  console.log(`🏨 Direct Booking Engine running on port ${PORT}`);
});

export default app;
