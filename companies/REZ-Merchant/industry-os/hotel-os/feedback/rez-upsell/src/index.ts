/**
 * Upsell Engine
 * Port: 3817
 *
 * Room upgrades, add-ons, dynamic pricing
 * "Guest books → upsell offered → revenue generated"
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { createClient } from 'redis';
import amqp from 'amqplib';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = parseInt(process.env.PORT || '4817', 10);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

let redis: ReturnType<typeof createClient>;
let rabbit: amqp.Connection;

// ============ MODELS ============

interface UpsellOffer {
  id: string;
  guestId: string;
  hotelId: string;
  bookingId: string;
  type: 'room_upgrade' | 'breakfast' | 'late_checkout' | 'early_checkin' | 'spa' | 'parking' | 'airport_transfer';
  title: string;
  description: string;
  originalPrice: number;
  offerPrice: number;
  currency: string;
  savings: number;
  expiresAt: Date;
  status: 'pending' | 'viewed' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
  viewedAt?: Date;
  respondedAt?: Date;
}

interface UpsellConfig {
  type: string;
  title: string;
  description: string;
  icon: string;
  basePrice: number;
  discount: number; // percentage
  maxOffers: number;
  triggers: string[];
}

// Upsell configurations
const upsellConfigs: UpsellConfig[] = [
  { type: 'room_upgrade', title: 'Upgrade to Deluxe Room', description: 'Get a bigger room with better views', icon: '🛏️', basePrice: 0, discount: 20, maxOffers: 2, triggers: ['standard_room', 'low_occupancy'] },
  { type: 'breakfast', title: 'Add Breakfast Package', description: 'Start your day with our complimentary breakfast', icon: '🍳', basePrice: 450, discount: 15, maxOffers: 3, triggers: ['no_breakfast'] },
  { type: 'late_checkout', title: 'Late Checkout (2 PM)', description: 'Enjoy your room until 2 PM', icon: '⏰', basePrice: 500, discount: 25, maxOffers: 1, triggers: ['default'] },
  { type: 'early_checkin', title: 'Early Check-in (10 AM)', description: 'Get early access to your room', icon: '🌅', basePrice: 500, discount: 25, maxOffers: 1, triggers: ['default'] },
  { type: 'spa', title: 'Spa Package', description: 'Relax with a60-minute massage', icon: '💆', basePrice: 2000, discount: 30, maxOffers: 2, triggers: ['wellness_interest'] },
  { type: 'parking', title: 'Add Parking', description: 'Secure parking for your vehicle', icon: '🚗', basePrice: 400, discount: 20, maxOffers: 1, triggers: ['has_vehicle'] },
  { type: 'airport_transfer', title: 'Airport Transfer', description: 'Comfortable ride to/from airport', icon: '✈️', basePrice: 800, discount: 15, maxOffers: 1, triggers: ['has_flight_info'] },
];

const offers: Map<string, UpsellOffer> = new Map();

// ============ REST API ============

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'upsell-engine', port: PORT });
});

// Get available upsells for booking
app.get('/bookings/:bookingId/upsells', async (req, res) => {
  const { bookingId } = req.params;
  const { guestId, hotelId } = req.query;

  // Get booking details (would call booking service)
  const bookingOffers = Array.from(offers.values()).filter(o =>
    o.bookingId === bookingId && o.status === 'pending'
  );

  // Generate new offers if none exist
  if (bookingOffers.length === 0) {
    const newOffers = await generateOffers(bookingId, guestId as string, hotelId as string);
    return res.json({ offers: newOffers });
  }

  res.json({ offers: bookingOffers });
});

// Create upsell offers for booking
app.post('/bookings/:bookingId/upsells/generate', async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const { guestId, hotelId, guestProfile } = req.body;

  const newOffers = await generateOffers(bookingId, guestId, hotelId, guestProfile);

  // Publish event
  try {
    const channel = await rabbit.createChannel();
    channel.sendToQueue('upsell.offers.generated', Buffer.from(JSON.stringify({
      bookingId, guestId, count: newOffers.length
    })));
  } catch (e) { /* Rabbit optional */ }

  res.json({ offers: newOffers });
});

// Accept offer
app.post('/offers/:id/accept', async (req: Request, res) => {
  const offer = offers.get(req.params.id);
  if (!offer) {
    return res.status(404).json({ error: 'Offer not found' });
  }

  if (offer.status !== 'pending') {
    return res.status(400).json({ error: 'Offer already responded' });
  }

  offer.status = 'accepted';
  offer.respondedAt = new Date();

  // Process the upsell (update booking, charge guest)
  await processUpsell(offer);

  // Publish event
  try {
    const channel = await rabbit.createChannel();
    channel.sendToQueue('upsell.offer.accepted', Buffer.from(JSON.stringify(offer)));
  } catch (e) { /* Rabbit optional */ }

  logger.info('Upsell accepted', { offerId: offer.id, type: offer.type, guestId: offer.guestId });

  res.json({ offer });
});

// Decline offer
app.post('/offers/:id/decline', (req, res) => {
  const offer = offers.get(req.params.id);
  if (!offer) {
    return res.status(404).json({ error: 'Offer not found' });
  }

  offer.status = 'declined';
  offer.respondedAt = new Date();

  res.json({ offer });
});

// Track view
app.post('/offers/:id/view', (req, res) => {
  const offer = offers.get(req.params.id);
  if (!offer) {
    return res.status(404).json({ error: 'Offer not found' });
  }

  offer.status = 'viewed';
  offer.viewedAt = new Date();

  res.json({ offer });
});

// Get offer config
app.get('/config', (req, res) => {
  res.json({ configs: upsellConfigs });
});

// Get upsell analytics
app.get('/hotels/:hotelId/analytics', (req, res) => {
  const hotelOffers = Array.from(offers.values()).filter(o => o.hotelId === req.params.hotelId);

  const total = hotelOffers.length;
  const accepted = hotelOffers.filter(o => o.status === 'accepted').length;
  const declined = hotelOffers.filter(o => o.status === 'declined').length;
  const pending = hotelOffers.filter(o => o.status === 'pending').length;
  const totalRevenue = hotelOffers
    .filter(o => o.status === 'accepted')
    .reduce((sum, o) => sum + o.offerPrice, 0);

  res.json({
    total,
    accepted,
    declined,
    pending,
    conversionRate: total > 0 ? (accepted / total * 100).toFixed(2) + '%' : '0%',
    totalRevenue,
    revenueByType: Array.from(new Set(hotelOffers.map(o => o.type))).reduce((acc, type) => {
      acc[type] = hotelOffers
        .filter(o => o.type === type && o.status === 'accepted')
        .reduce((sum, o) => sum + o.offerPrice, 0);
      return acc;
    }, {} as Record<string, number>)
  });
});

// ============ HELPERS ============

async function generateOffers(bookingId: string, guestId: string, hotelId: string, guestProfile?: any): Promise<UpsellOffer[]> {
  const newOffers: UpsellOffer[] = [];

  for (const config of upsellConfigs) {
    // Check if offer already exists
    const existing = Array.from(offers.values()).find(o =>
      o.bookingId === bookingId && o.type === config.type && o.status !== 'expired'
    );
    if (existing) continue;

    // Apply trigger logic (simplified)
    const shouldOffer = checkTriggers(config, guestProfile);
    if (!shouldOffer) continue;

    const offer: UpsellOffer = {
      id: uuidv4(),
      guestId,
      hotelId,
      bookingId,
      type: config.type as UpsellOffer['type'],
      title: config.title,
      description: config.description,
      originalPrice: config.basePrice,
      offerPrice: Math.round(config.basePrice * (1 - config.discount / 100)),
      currency: 'INR',
      savings: Math.round(config.basePrice * config.discount / 100),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      status: 'pending',
      createdAt: new Date()
    };

    offers.set(offer.id, offer);
    newOffers.push(offer);
  }

  return newOffers;
}

function checkTriggers(config: UpsellConfig, guestProfile?: any): boolean {
  // Simplified trigger logic
  if (!config.triggers.length || 4817config.triggers.includes('default')) {
    return Math.random() > 0.3; // 70% chance for default
  }

  // More sophisticated logic would check guest profile
  return true;
}

async function processUpsell(offer: UpsellOffer) {
  // In production, this would:
  // 1. Update booking with upsell
  // 2. Charge guest via payment service
  // 3. Notify relevant services
  logger.info('Processing upsell', { offerId: offer.id, type: offer.type });
}

async function init() {
  try {
    redis = createClient({ url: process.env.REDIS_URL || 4817'redis://localhost:6379' });
    redis.on('error', () => {});
    await redis.connect();
  } catch (e) {
    logger.warn('Redis not available');
  }

  try {
    rabbit = await amqp.connect(process.env.RABBITMQ_URL || 4817'amqp://localhost:5672');
  } catch (e) {
    logger.warn('RabbitMQ not available');
  }

  logger.info('Upsell Engine initialized');
}

init().then(() => {
  app.listen(PORT, () => {
    logger.info(`Upsell Engine running on port ${PORT}`);
  });
}).catch((err) => {
  logger.error('Failed to initialize', err);
  process.exit(1);
});

export { app };
