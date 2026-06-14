/**
 * REZ Booking Engine
 * Port: 4042
 *
 * Hotel booking management
 */

import express from 'express';
import cors from 'cors';
import winston from 'winston';

const app = express();
const PORT = process.env.PORT || 4042;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

app.use(cors());
app.use(express.json());

const bookings: Map<string, any> = new Map();

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'rez-booking', port: PORT });
});

// Create booking
app.post('/bookings', (req, res) => {
  const { guestId, hotelId, roomId, checkIn, checkOut, guests } = req.body;
  const id = `booking_${Date.now()}`;
  const booking = { id, guestId, hotelId, roomId, checkIn, checkOut, guests, status: 'confirmed', createdAt: new Date() };
  bookings.set(id, booking);
  logger.info('Booking created', { id, guestId });
  res.json(booking);
});

// Get booking
app.get('/bookings/:id', (req, res) => {
  const booking = bookings.get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  res.json(booking);
});

// Get guest bookings
app.get('/guests/:guestId/bookings', (req, res) => {
  const guestBookings = Array.from(bookings.values()).filter(b => b.guestId === req.params.guestId);
  res.json({ bookings: guestBookings });
});

app.listen(PORT, () => {
  logger.info(`REZ Booking running on port ${PORT}`);
});

export { app };