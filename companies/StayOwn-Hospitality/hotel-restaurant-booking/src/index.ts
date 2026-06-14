/**
 * Hotel Restaurant Booking Service
 * Port: 3811
 *
 * Table reservations, room charging, menu access
 * "Guest books table → room charged → table ready"
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { createClient } from 'redis';
import amqp from 'amqplib';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3811;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

let redis: ReturnType<typeof createClient>;
let rabbit: amqp.Connection;

// ============ MODELS ============

interface Table {
  id: string;
  number: string;
  capacity: number;
  location: 'indoor' | 'outdoor' | 'rooftop' | 'private';
  available: boolean;
}

interface Reservation {
  id: string;
  guestId: string;
  hotelId: string;
  roomId?: string;
  tableId: string;
  date: string;
  time: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled';
  specialRequests?: string;
  createdAt: Date;
}

interface Order {
  id: string;
  reservationId?: string;
  guestId: string;
  hotelId: string;
  roomId?: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  chargeToRoom: boolean;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'paid';
  createdAt: Date;
}

// Demo data
const tables: Table[] = [
  { id: 't1', number: 'A1', capacity: 2, location: 'indoor', available: true },
  { id: 't2', number: 'A2', capacity: 2, location: 'indoor', available: true },
  { id: 't3', number: 'B1', capacity: 4, location: 'indoor', available: true },
  { id: 't4', number: 'B2', capacity: 4, location: 'indoor', available: true },
  { id: 't5', number: 'C1', capacity: 6, location: 'outdoor', available: true },
  { id: 't6', number: 'R1', capacity: 4, location: 'rooftop', available: true },
  { id: 't7', number: 'P1', capacity: 10, location: 'private', available: true },
];

const reservations: Map<string, Reservation> = new Map();
const orders: Map<string, Order> = new Map();

// ============ CHECKOUT INTEGRATION ============

/**
 * Get all charges for a guest (for checkout)
 */
async function getGuestCharges(guestId: string): Promise<{ charges: any[]; total: number }> {
  const guestOrders = Array.from(orders.values()).filter(o => o.guestId === guestId && o.chargeToRoom);
  const charges = guestOrders.map(o => ({
    type: 'restaurant',
    description: `Restaurant - Order ${o.id.slice(-6)}`,
    amount: o.total,
    currency: 'INR',
    timestamp: o.createdAt
  }));
  return { charges, total: charges.reduce((sum, c) => sum + c.amount, 0) };
}

// ============ REST API ============

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'hotel-restaurant-booking', port: PORT });
});

// Get availability
app.get('/hotels/:hotelId/availability', (req, res) => {
  const { date, time, guests } = req.query;
  const availableTables = tables.filter(t =>
    t.capacity >= (parseInt(guests as string) || 2) &&
    t.available
  );
  res.json({ tables: availableTables, date, time });
});

// Create reservation
app.post('/reservations', async (req: Request, res: Response) => {
  const { guestId, hotelId, roomId, date, time, guests, specialRequests } = req.body;

  // Find suitable table
  const table = tables.find(t => t.capacity >= guests && t.available);
  if (!table) {
    return res.status(400).json({ error: 'No tables available for this party size' });
  }

  const reservation: Reservation = {
    id: uuidv4(),
    guestId,
    hotelId,
    roomId,
    tableId: table.id,
    date,
    time,
    guests,
    status: 'confirmed',
    specialRequests,
    createdAt: new Date()
  };

  reservations.set(reservation.id, reservation);

  // Publish event
  try {
    const channel = await rabbit.createChannel();
    channel.sendToQueue('restaurant.reservation.created', Buffer.from(JSON.stringify(reservation)));
  } catch (e) { /* Rabbit optional */ }

  logger.info('Reservation created', { reservationId: reservation.id, guestId, table: table.number });

  res.json({ reservation, table });
});

// Get reservation
app.get('/reservations/:id', (req, res) => {
  const reservation = reservations.get(req.params.id);
  if (!reservation) {
    return res.status(404).json({ error: 'Reservation not found' });
  }
  res.json({ reservation, table: tables.find(t => t.id === reservation.tableId) });
});

// Get guest reservations
app.get('/guests/:guestId/reservations', (req, res) => {
  const guestReservations = Array.from(reservations.values()).filter(r => r.guestId === req.params.guestId);
  res.json({ reservations: guestReservations });
});

// Cancel reservation
app.delete('/reservations/:id', (req, res) => {
  const reservation = reservations.get(req.params.id);
  if (!reservation) {
    return res.status(404).json({ error: 'Reservation not found' });
  }
  reservation.status = 'cancelled';
  res.json({ success: true });
});

// Create room order
app.post('/orders', async (req: Request, res: Response) => {
  const { guestId, hotelId, roomId, reservationId, items, chargeToRoom = true } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'No items provided' });
  }

  const total = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

  const order: Order = {
    id: uuidv4(),
    reservationId,
    guestId,
    hotelId,
    roomId,
    items,
    total,
    chargeToRoom,
    status: chargeToRoom ? 'preparing' : 'pending',
    createdAt: new Date()
  };

  orders.set(order.id, order);

  // Publish event
  try {
    const channel = await rabbit.createChannel();
    channel.sendToQueue('restaurant.order.created', Buffer.from(JSON.stringify(order)));
  } catch (e) { /* Rabbit optional */ }

  logger.info('Order created', { orderId: order.id, guestId, total });

  res.json({ order });
});

// Get guest orders
app.get('/guests/:guestId/orders', (req, res) => {
  const guestOrders = Array.from(orders.values()).filter(o => o.guestId === req.params.guestId);
  res.json({ orders: guestOrders });
});

// Get guest charges (for checkout)
app.get('/guests/:guestId/charges', async (req: Request, res: Response) => {
  const charges = await getGuestCharges(req.params.guestId);
  res.json(charges);
});

// Update order status
app.patch('/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const order = orders.get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  order.status = status;
  res.json({ order });
});

// Menu (static for demo)
app.get('/hotels/:hotelId/menu', (req, res) => {
  res.json({
    menu: {
      breakfast: [
        { id: 'b1', name: 'Continental Breakfast', price: 450, currency: 'INR' },
        { id: 'b2', name: 'South Indian Breakfast', price: 350, currency: 'INR' },
        { id: 'b3', name: 'Eggs Benedict', price: 380, currency: 'INR' },
      ],
      lunch: [
        { id: 'l1', name: 'Veg Thali', price: 550, currency: 'INR' },
        { id: 'l2', name: 'Non-Veg Thali', price: 650, currency: 'INR' },
        { id: 'l3', name: 'Biryani Special', price: 450, currency: 'INR' },
      ],
      dinner: [
        { id: 'd1', name: 'Chef Special Dinner', price: 1200, currency: 'INR' },
        { id: 'd2', name: 'BBQ Platter', price: 1500, currency: 'INR' },
        { id: 'd3', name: 'Paneer Special', price: 700, currency: 'INR' },
      ]
    }
  });
});

async function init() {
  try {
    redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    redis.on('error', () => {});
    await redis.connect();
  } catch (e) {
    logger.warn('Redis not available');
  }

  try {
    rabbit = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672');
  } catch (e) {
    logger.warn('RabbitMQ not available');
  }

  logger.info('Hotel Restaurant Booking Service initialized');
}

init().then(() => {
  app.listen(PORT, () => {
    logger.info(`Hotel Restaurant Booking Service running on port ${PORT}`);
  });
}).catch((err) => {
  logger.error('Failed to initialize', err);
  process.exit(1);
});

export { app };
