import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { SpaService } from './services/spa.service.js';

const app = express();
const PORT = 4049;

app.use(cors());
app.use(express.json());

const spaService = new SpaService();

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-spa-service',
    timestamp: new Date().toISOString(),
  });
});

// Get all treatments
app.get('/api/treatments', (_req: Request, res: Response) => {
  const treatments = spaService.getTreatments();
  res.json({ success: true, treatments, count: treatments.length });
});

// Get treatments by category
app.get('/api/treatments/category/:category', (req: Request, res: Response) => {
  const treatments = spaService.getTreatmentsByCategory(req.params.category);
  res.json({ success: true, treatments, count: treatments.length });
});

// Get treatment by ID
app.get('/api/treatments/:treatmentId', (req: Request, res: Response) => {
  const treatment = spaService.getTreatment(req.params.treatmentId);
  if (!treatment) {
    res.status(404).json({ error: 'Treatment not found' });
    return;
  }
  res.json({ success: true, treatment });
});

// Get all therapists
app.get('/api/therapists', (req: Request, res: Response) => {
  const specialty = req.query.specialty as string | undefined;
  const therapists = spaService.getTherapists(specialty);
  res.json({ success: true, therapists, count: therapists.length });
});

// Get therapist by ID
app.get('/api/therapists/:therapistId', (req: Request, res: Response) => {
  const therapist = spaService.getTherapist(req.params.therapistId);
  if (!therapist) {
    res.status(404).json({ error: 'Therapist not found' });
    return;
  }
  res.json({ success: true, therapist });
});

// Create booking
app.post('/api/bookings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await spaService.createBooking(req.body);
    res.status(201).json({ success: true, booking });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get booking by ID
app.get('/api/bookings/:bookingId', async (req: Request, res: Response) => {
  const booking = await spaService.getBooking(req.params.bookingId);
  if (!booking) {
    res.status(404).json({ error: 'Booking not found' });
    return;
  }
  res.json({ success: true, booking });
});

// Get bookings by hotel
app.get('/api/hotels/:hotelId/bookings', async (req: Request, res: Response) => {
  const { date, status, therapistId } = req.query;
  const bookings = await spaService.getHotelBookings(
    req.params.hotelId,
    date as string | undefined,
    status as any,
    therapistId as string | undefined
  );
  res.json({ success: true, bookings, count: bookings.length });
});

// Get bookings by guest
app.get('/api/guests/:guestId/bookings', async (req: Request, res: Response) => {
  const bookings = await spaService.getGuestBookings(req.params.guestId);
  res.json({ success: true, bookings, count: bookings.length });
});

// Update booking status
app.patch('/api/bookings/:bookingId/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const booking = await spaService.updateBookingStatus(req.params.bookingId, status);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    res.json({ success: true, booking });
  } catch (error) {
    next(error);
  }
});

// Cancel booking
app.post('/api/bookings/:bookingId/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await spaService.cancelBooking(req.params.bookingId);
    if (!booking) {
      res.status(400).json({ error: 'Cannot cancel booking' });
      return;
    }
    res.json({ success: true, booking });
  } catch (error) {
    next(error);
  }
});

// Reschedule booking
app.post('/api/bookings/:bookingId/reschedule', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { newDate, newTime } = req.body;
    const booking = await spaService.rescheduleBooking(req.params.bookingId, newDate, newTime);
    if (!booking) {
      res.status(400).json({ error: 'Cannot reschedule booking' });
      return;
    }
    res.json({ success: true, booking });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get available slots
app.get('/api/slots', async (req: Request, res: Response) => {
  const { treatmentId, date, therapistId } = req.query;
  if (!treatmentId || !date) {
    res.status(400).json({ error: 'treatmentId and date are required' });
    return;
  }
  const slots = await spaService.getAvailableSlots(
    treatmentId as string,
    date as string,
    therapistId as string | undefined
  );
  res.json({ success: true, slots });
});

// Get spa stats
app.get('/api/hotels/:hotelId/stats', async (req: Request, res: Response) => {
  const stats = await spaService.getSpaStats(req.params.hotelId);
  res.json({ success: true, stats });
});

// Get daily revenue
app.get('/api/hotels/:hotelId/revenue', async (req: Request, res: Response) => {
  const { date } = req.query;
  const revenue = await spaService.getDailyRevenue(req.params.hotelId, date as string | undefined);
  res.json({ success: true, revenue });
});

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`ReZ Spa Service running on port ${PORT}`);
});

export default app;
