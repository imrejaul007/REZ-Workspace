/**
 * Hotel Spa Booking Service
 * Port: 3812
 *
 * Treatment reservations, therapist scheduling, room charging
 * "Guest books spa → treatment scheduled → relaxation begins"
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { createClient } from 'redis';
import amqp from 'amqplib';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = parseInt(process.env.PORT || '4812', 10);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

let redis: ReturnType<typeof createClient>;
let rabbit: amqp.Connection;

// ============ MODELS ============

interface Treatment {
  id: string;
  name: string;
  category: 'massage' | 'facial' | 'body' | 'ayurvedic' | 'couple';
  duration: number; // minutes
  price: number;
  currency: string;
  description: string;
}

interface Therapist {
  id: string;
  name: string;
  specialties: string[];
  schedule: { dayOfWeek: number; start: string; end: string }[];
  available: boolean;
}

interface Booking {
  id: string;
  guestId: string;
  hotelId: string;
  roomId?: string;
  treatmentId: string;
  therapistId?: string;
  date: string;
  time: string;
  duration: number;
  total: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date;
}

// Demo treatments
const treatments: Treatment[] = [
  { id: 't1', name: 'Swedish Massage', category: 'massage', duration: 60, price: 2000, currency: 'INR', description: 'Relaxing full body massage' },
  { id: 't2', name: 'Deep Tissue Massage', category: 'massage', duration: 90, price: 3000, currency: 'INR', description: 'Intense muscle relief' },
  { id: 't3', name: 'Aromatherapy', category: 'massage', duration: 60, price: 2500, currency: 'INR', description: 'Essential oil massage' },
  { id: 't4', name: 'Balinese Massage', category: 'massage', duration: 60, price: 2200, currency: 'INR', description: 'Traditional Balinese techniques' },
  { id: 't5', name: 'Classic Facial', category: 'facial', duration: 45, price: 1500, currency: 'INR', description: 'Deep cleansing facial' },
  { id: 't6', name: 'Gold Facial', category: 'facial', duration: 60, price: 3500, currency: 'INR', description: 'Luxurious gold treatment' },
  { id: 't7', name: 'Body Scrub', category: 'body', duration: 45, price: 1800, currency: 'INR', description: 'Full body exfoliation' },
  { id: 't8', name: 'Shirodhara', category: 'ayurvedic', duration: 60, price: 2800, currency: 'INR', description: 'Oil pouring therapy' },
  { id: 't9', name: 'Abhyanga', category: 'ayurvedic', duration: 90, price: 3200, currency: 'INR', description: 'Ayurvedic oil massage' },
  { id: 't10', name: 'Couple Massage', category: 'couple', duration: 60, price: 5000, currency: 'INR', description: 'Side by side massage for two' },
];

const therapists: Therapist[] = [
  { id: 'th1', name: 'Priya', specialties: ['massage', 'ayurvedic'], schedule: [{ dayOfWeek: 1, start: '09:00', end: '18:00' }, { dayOfWeek: 2, start: '09:00', end: '18:00' }, { dayOfWeek: 3, start: '09:00', end: '18:00' }, { dayOfWeek: 4, start: '09:00', end: '18:00' }, { dayOfWeek: 5, start: '09:00', end: '18:00' }], available: true },
  { id: 'th2', name: 'Anita', specialties: ['facial', 'body'], schedule: [{ dayOfWeek: 1, start: '10:00', end: '19:00' }, { dayOfWeek: 2, start: '10:00', end: '19:00' }, { dayOfWeek: 3, start: '10:00', end: '19:00' }, { dayOfWeek: 4, start: '10:00', end: '19:00' }, { dayOfWeek: 5, start: '10:00', end: '19:00' }], available: true },
  { id: 'th3', name: 'Ravi', specialties: ['massage', 'couple'], schedule: [{ dayOfWeek: 2, start: '09:00', end: '18:00' }, { dayOfWeek: 3, start: '09:00', end: '18:00' }, { dayOfWeek: 4, start: '09:00', end: '18:00' }, { dayOfWeek: 5, start: '09:00', end: '18:00' }, { dayOfWeek: 6, start: '09:00', end: '18:00' }], available: true },
];

const bookings: Map<string, Booking> = new Map();

// ============ CHECKOUT INTEGRATION ============

async function getGuestCharges(guestId: string): Promise<{ charges: any[]; total: number }> {
  const guestBookings = Array.from(bookings.values()).filter(b => b.guestId === guestId && b.status === 'completed');
  const charges = guestBookings.map(b => ({
    type: 'spa',
    description: `Spa - ${treatments.find(t => t.id === b.treatmentId)?.name}`,
    amount: b.total,
    currency: 'INR',
    timestamp: b.createdAt
  }));
  return { charges, total: charges.reduce((sum, c) => sum + c.amount, 0) };
}

// ============ REST API ============

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'hotel-spa-booking', port: PORT });
});

// Get treatments
app.get('/treatments', (req, res) => {
  const { category } = req.query;
  const filtered = category ? treatments.filter(t => t.category === category) : treatments;
  res.json({ treatments: filtered });
});

// Get therapists
app.get('/therapists', (req, res) => {
  const { specialty } = req.query;
  const filtered = specialty
    ? therapists.filter(t => t.specialties.includes(specialty as string))
    : therapists;
  res.json({ therapists: filtered });
});

// Get availability slots
app.get('/hotels/:hotelId/availability', (req, res) => {
  const { date, treatmentId, therapistId } = req.query;

  const treatment = treatments.find(t => t.id === treatmentId);
  if (!treatment) {
    return res.status(400).json({ error: 'Invalid treatment' });
  }

  // Generate time slots (9 AM to 6 PM, 1 hour apart)
  const slots = [];
  for (let hour = 9; hour < 18; hour++) {
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    slots.push({
      time: timeStr,
      available: true,
      therapistId: therapistId || 4812therapists[0]?.id
    });
  }

  res.json({ slots, treatment, date });
});

// Create booking
app.post('/bookings', async (req: Request, res: Response) => {
  const { guestId, hotelId, roomId, treatmentId, therapistId, date, time, notes } = req.body;

  const treatment = treatments.find(t => t.id === treatmentId);
  if (!treatment) {
    return res.status(400).json({ error: 'Invalid treatment' });
  }

  const booking: Booking = {
    id: uuidv4(),
    guestId,
    hotelId,
    roomId,
    treatmentId,
    therapistId: therapistId || 4812therapists[0]?.id,
    date,
    time,
    duration: treatment.duration,
    total: treatment.price,
    status: 'confirmed',
    notes,
    createdAt: new Date()
  };

  bookings.set(booking.id, booking);

  // Publish event
  try {
    const channel = await rabbit.createChannel();
    channel.sendToQueue('spa.booking.created', Buffer.from(JSON.stringify(booking)));
  } catch (e) { /* Rabbit optional */ }

  logger.info('Spa booking created', { bookingId: booking.id, guestId, treatment: treatment.name });

  res.json({ booking, treatment });
});

// Get booking
app.get('/bookings/:id', (req, res) => {
  const booking = bookings.get(req.params.id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  const treatment = treatments.find(t => t.id === booking.treatmentId);
  const therapist = therapists.find(t => t.id === booking.therapistId);
  res.json({ booking, treatment, therapist });
});

// Get guest bookings
app.get('/guests/:guestId/bookings', (req, res) => {
  const guestBookings = Array.from(bookings.values()).filter(b => b.guestId === req.params.guestId);
  res.json({ bookings: guestBookings.map(b => ({
    ...b,
    treatment: treatments.find(t => t.id === b.treatmentId)
  }))});
});

// Cancel booking
app.delete('/bookings/:id', (req, res) => {
  const booking = bookings.get(req.params.id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  booking.status = 'cancelled';
  res.json({ success: true });
});

// Update status
app.patch('/bookings/:id/status', (req, res) => {
  const { status } = req.body;
  const booking = bookings.get(req.params.id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  booking.status = status;
  res.json({ booking });
});

// Get guest charges (for checkout)
app.get('/guests/:guestId/charges', async (req: Request, res: Response) => {
  const charges = await getGuestCharges(req.params.guestId);
  res.json(charges);
});

async function init() {
  try {
    redis = createClient({ url: process.env.REDIS_URL || 4812'redis://localhost:6379' });
    redis.on('error', () => {});
    await redis.connect();
  } catch (e) {
    logger.warn('Redis not available');
  }

  try {
    rabbit = await amqp.connect(process.env.RABBITMQ_URL || 4812'amqp://localhost:5672');
  } catch (e) {
    logger.warn('RabbitMQ not available');
  }

  logger.info('Hotel Spa Booking Service initialized');
}

init().then(() => {
  app.listen(PORT, () => {
    logger.info(`Hotel Spa Booking Service running on port ${PORT}`);
  });
}).catch((err) => {
  logger.error('Failed to initialize', err);
  process.exit(1);
});

export { app };
